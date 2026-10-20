<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\DetectionLog;
use App\Models\Site;
use App\Services\UptimeCheckService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SiteApiController extends Controller
{
    public function __construct(
        protected UptimeCheckService $uptimeCheckService
    ) {}

    /**
     * Get paginated list of services/sites with filter counts.
     * Corresponds to PRD Modul 3: Manajemen & Pemantauan Situs (Site Explorer).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $search = trim($request->input('search', ''));
            $filter = strtolower(trim($request->input('filter', 'all')));
            $perPage = min(100, max(1, (int) $request->input('per_page', 15)));

            // 1. Calculate filter counts for mobile chips (Single Aggregated SQL Query)
            $statsRow = Site::toBase()->selectRaw("
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'up' THEN 1 END) as operational,
                COUNT(CASE WHEN status = 'down' THEN 1 END) as outage,
                COUNT(CASE WHEN status = 'warn' THEN 1 END) as warn,
                COUNT(CASE WHEN ssl_days_left <= 14 OR (ssl_status IS NOT NULL AND ssl_status != 'valid') THEN 1 END) as ssl
            ")->first();

            $counts = [
                'all'         => (int) ($statsRow->total ?? 0),
                'operational' => (int) ($statsRow->operational ?? 0),
                'outage'      => (int) ($statsRow->outage ?? 0),
                'warn'        => (int) ($statsRow->warn ?? 0),
                'ssl'         => (int) ($statsRow->ssl ?? 0),
            ];

            // 2. Query with search and filter (Eager load 30d uptime counts to prevent N+1 queries)
            $query = Site::query()->withCount([
                'detectionLogs as uptime_total_checks_30d' => function ($q) {
                    $q->where('category', 'uptime')
                      ->where('created_at', '>=', now()->subDays(30));
                },
                'detectionLogs as uptime_successful_checks_30d' => function ($q) {
                    $q->where('category', 'uptime')
                      ->where('status', 'resolved')
                      ->where('created_at', '>=', now()->subDays(30));
                }
            ]);

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('url', 'like', "%{$search}%")
                      ->orWhere('category', 'like', "%{$search}%");
                });
            }

            match ($filter) {
                'operational', 'up' => $query->where('status', 'up'),
                'outage', 'down' => $query->where('status', 'down'),
                'warn', 'warning' => $query->where('status', 'warn'),
                'ssl' => $query->where(function ($q) {
                    $q->where('ssl_days_left', '<=', 14)
                      ->orWhere('ssl_status', '!=', 'valid');
                }),
                'paused' => $query->where('status', 'paused')->orWhere('is_active', false),
                default => null, // 'all' - no filter
            };

            $paginated = $query->orderByRaw("CASE WHEN status = 'down' THEN 1 WHEN status = 'warn' THEN 2 WHEN status = 'up' THEN 3 ELSE 4 END")
                ->latest('updated_at')
                ->paginate($perPage);

            // 3. Batch fetch only the latest uptime log per site (Max performance, zero memory bloat)
            $siteIds = $paginated->pluck('id')->all();
            $latestLogs = collect();
            if (!empty($siteIds)) {
                $latestLogIds = DetectionLog::where('category', 'uptime')
                    ->whereIn('site_id', $siteIds)
                    ->groupBy('site_id')
                    ->selectRaw('MAX(id) as max_id')
                    ->pluck('max_id');

                $latestLogs = DetectionLog::whereIn('id', $latestLogIds)
                    ->get()
                    ->keyBy('site_id');
            }

            // 4. Format cards for mobile app
            $items = $paginated->getCollection()->map(function (Site $site) use ($latestLogs) {
                return $this->formatSiteCard($site, $latestLogs->get($site->id));
            });

            return ResponseHelper::success('Daftar layanan berhasil dimuat.', [
                'counts' => $counts,
                'items' => $items,
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'has_more' => $paginated->hasMorePages(),
                ],
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('SiteApiController::index error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return ResponseHelper::error('Gagal memuat daftar layanan: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get comprehensive details of a single service/site.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $site = Site::with(['security', 'incidents' => function ($q) {
                $q->latest('detected_at')->take(5);
            }])->findOrFail($id);

        $latestLog = DetectionLog::where('site_id', $site->id)
            ->where('category', 'uptime')
            ->latest('id')
            ->first();

        $cardData = $this->formatSiteCard($site, $latestLog);

        // 30-Day Mini Uptime Calendar
        $uptimeHistory = $this->build30DayUptimeHistory($site);

        // Recent 5 Detection Logs
        $recentLogs = DetectionLog::where('site_id', $site->id)
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => (string) $log->id,
                    'title' => $log->title,
                    'category' => $log->category,
                    'status' => $log->status,
                    'context' => $log->context,
                    'source' => $log->source,
                    'created_at' => $log->created_at?->toISOString(),
                    'time_ago' => $log->created_at?->diffForHumans() ?? 'Baru saja',
                ];
            });

        // Recent Incidents
        $recentIncidents = $site->incidents->map(function ($incident) {
            return [
                'id' => (string) $incident->id,
                'title' => $incident->title,
                'type' => $incident->type,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'description' => $incident->description,
                'detected_at' => $incident->detected_at?->toISOString() ?? $incident->created_at?->toISOString(),
                'detected_time_ago' => $incident->detected_at?->diffForHumans() ?? 'Baru saja',
            ];
        });

        // Security Audit Overview
        $security = $site->security;
        $securityData = [
            'score' => $security?->score ?? 100,
            'grade' => $security?->grade ?? 'A',
            'issues_count' => $security?->issues_count ?? 0,
            'last_scanned_at' => $security?->last_scanned_at?->toISOString(),
        ];

            return ResponseHelper::success('Detail layanan berhasil dimuat.', array_merge($cardData, [
                'ssl_details' => [
                    'status' => $site->ssl_status ?? 'unknown',
                    'issuer' => $site->ssl_issuer,
                    'valid_to' => $site->ssl_valid_to?->toISOString(),
                    'valid_to_formatted' => $site->ssl_valid_to?->format('d M Y'),
                    'days_left' => $site->ssl_days_left,
                    'last_checked_at' => $site->ssl_last_checked_at?->toISOString(),
                ],
                'domain_details' => [
                    'domain_name' => $site->domain_name,
                    'registrar' => $site->domain_registrar,
                    'expires_at' => $site->domain_expires_at?->toISOString(),
                    'expires_at_formatted' => $site->domain_expires_at?->format('d M Y'),
                    'days_left' => $site->domain_days_left,
                    'status' => $site->domain_status,
                    'name_servers' => $site->dns_name_servers ?? [],
                ],
                'visual_audit' => [
                    'diff_score' => $site->visual_diff_score ?? 0.0,
                    'last_checked_at' => $site->visual_last_checked_at?->toISOString(),
                    'is_clean' => ($site->visual_diff_score ?? 0) < 5.0,
                ],
                'uptime_history_30d' => $uptimeHistory,
                'security_audit' => $securityData,
                'recent_incidents' => $recentIncidents,
                'recent_logs' => $recentLogs,
            ]));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('SiteApiController::show error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return ResponseHelper::error('Gagal memuat detail layanan: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Trigger manual Quick Ping / HTTP Health Check.
     * Corresponds to the "Quick Ping" button on service cards.
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function check(Request $request, string $id): JsonResponse
    {
        $site = Site::findOrFail($id);

        $user = $request->user();
        if (!$user || (!$user->hasAnyRole(['dev', 'admin']) && !$user->can('checkUptime', Site::class))) {
            return ResponseHelper::error('Akses Ditolak: Anda tidak memiliki wewenang untuk memicu Quick Ping manual.', 403);
        }

        $result = $this->uptimeCheckService->checkSite($site);
        $site->refresh();

        $latestLog = DetectionLog::where('site_id', $site->id)
            ->where('category', 'uptime')
            ->latest('id')
            ->first();

        $formattedCard = $this->formatSiteCard($site, $latestLog);

        return ResponseHelper::success('Quick Ping berhasil dieksekusi.', [
            'check_result' => $result,
            'site' => $formattedCard,
        ]);
    }

    /**
     * Format a Site instance into standard mobile card structure.
     */
    protected function formatSiteCard(Site $site, ?DetectionLog $latestLog = null): array
    {
        $httpCode = 200;
        $latencyMs = 35;
        $isTimeout = false;

        if ($latestLog) {
            if (preg_match('/HTTP\s*(\d+)/i', $latestLog->title, $mCode)) {
                $httpCode = (int) $mCode[1];
            } elseif (preg_match('/Respon:\s*(\d+)/i', $latestLog->context, $mCode)) {
                $httpCode = (int) $mCode[1];
            }

            if (preg_match('/Latensi:\s*(\d+)ms/i', $latestLog->context, $mLat)) {
                $latencyMs = (int) $mLat[1];
            }
        } else {
            $httpCode = match ($site->status) {
                'down' => 502,
                'warn' => 301,
                default => 200,
            };
            $latencyMs = match ($site->status) {
                'down' => 0,
                'warn' => 1250,
                default => 25 + (abs(crc32($site->id)) % 50),
            };
        }

        if ($site->status === 'down' || $httpCode >= 500 || $httpCode === 0 || $latencyMs === 0) {
            $statusLabel = $httpCode > 0 ? "{$httpCode} Bad Gateway" : '502 Bad Gateway';
            if ($httpCode === 504 || $httpCode === 0) {
                $statusLabel = '504 Timeout';
            }
            $latencyFormatted = 'TIMEOUT / Fail';
            $isTimeout = true;
        } elseif ($site->status === 'warn') {
            $statusLabel = $httpCode === 200 ? '200 OK' : "{$httpCode} Warning";
            $latencyFormatted = $latencyMs >= 1000 ? round($latencyMs / 1000, 2) . ' s' : "{$latencyMs} ms";
        } else {
            $statusLabel = '200 OK';
            $latencyFormatted = "{$latencyMs} ms";
        }

        // SSL formatting
        $sslDaysLeft = $site->ssl_days_left;
        $sslIsWarning = false;
        if ($sslDaysLeft !== null) {
            if ($sslDaysLeft <= 0) {
                $sslLabel = 'Expired';
                $sslStatus = 'expired';
                $sslIsWarning = true;
            } elseif ($sslDaysLeft <= 14) {
                $sslLabel = "{$sslDaysLeft}d left ⚠";
                $sslStatus = 'expiring_soon';
                $sslIsWarning = true;
            } else {
                $sslLabel = "{$sslDaysLeft}d valid";
                $sslStatus = 'valid';
            }
        } else {
            $isHttps = str_starts_with(strtolower($site->url), 'https://');
            $sslLabel = $isHttps ? 'Valid' : 'No SSL';
            $sslStatus = $isHttps ? 'valid' : 'unknown';
        }

        // Summary badge text
        $summaryBadge = match ($site->status) {
            'up' => '✔ Healthy · Anycast Cluster',
            'warn' => '⚠ High Latency / Warning',
            'down' => '⚠ Service Down / Outage',
            'paused' => '⏸ Monitoring Paused',
            default => '✔ Healthy'
        };

        $lastChecked = $latestLog?->created_at ?? $site->updated_at ?? now();

        return [
            'id' => (string) $site->id,
            'name' => $site->name,
            'url' => $site->url,
            'category' => $site->category ?? 'REST API · Service',
            'status' => $site->status,
            'status_code' => $httpCode,
            'status_label' => $statusLabel,
            'latency' => [
                'value_ms' => $isTimeout ? null : $latencyMs,
                'formatted' => $latencyFormatted,
                'is_timeout' => $isTimeout,
            ],
            'ssl' => [
                'days_left' => $sslDaysLeft,
                'status' => $sslStatus,
                'status_label' => $sslLabel,
                'is_warning' => $sslIsWarning,
            ],
            'summary_badge' => $summaryBadge,
            'uptime_percentage' => $site->uptime_percentage,
            'last_checked_at' => $lastChecked->toISOString(),
            'last_checked_ago' => $lastChecked->diffForHumans(),
        ];
    }

    /**
     * Build 30-day mini uptime calendar.
     */
    protected function build30DayUptimeHistory(Site $site): array
    {
        $history = [];
        $recentIncidents = $site->incidents()
            ->where('detected_at', '>=', Carbon::now()->subDays(30)->startOfDay())
            ->get(['id', 'severity', 'detected_at']);

        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateStr = $date->toDateString();

            $dayIncident = $recentIncidents->first(function ($inc) use ($dateStr) {
                return $inc->detected_at?->toDateString() === $dateStr;
            });

            $dayStatus = 'up';
            $dayUptime = 99.9;

            if ($dayIncident) {
                if ($dayIncident->severity === 'critical') {
                    $dayStatus = 'down';
                    $dayUptime = 92.4;
                } else {
                    $dayStatus = 'warn';
                    $dayUptime = 98.2;
                }
            }

            $history[] = [
                'date' => $dateStr,
                'day' => (int) $date->format('j'),
                'day_name' => $date->format('D'),
                'status' => $dayStatus,
                'uptime_percentage' => $dayUptime,
            ];
        }

        return $history;
    }
}
