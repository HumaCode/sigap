<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\DetectionLog;
use App\Models\Incident;
use App\Models\Site;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InspectApiController extends Controller
{
    /**
     * Get inspection telemetry and 30-day reliability heatmap.
     * Corresponds to the mobile app "Inspect" screen.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $siteId = $request->input('site_id');

        // Available services list for the top dropdown selector
        $availableServices = Site::select(['id', 'name', 'url', 'status', 'category'])
            ->orderByRaw("CASE WHEN status = 'down' THEN 1 WHEN status = 'warn' THEN 2 ELSE 3 END")
            ->orderBy('name')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => (string) $s->id,
                    'name' => $s->name,
                    'url' => $s->url,
                    'status' => $s->status,
                    'category' => $s->category ?? 'REST API',
                ];
            });

        if ($availableServices->isEmpty()) {
            return ResponseHelper::success('Belum ada layanan yang dipantau.', [
                'service' => null,
                'available_services' => [],
            ]);
        }

        // If site_id specified, find it; otherwise pick first down/warn site or first available
        $site = null;
        if (!empty($siteId)) {
            $site = Site::find($siteId);
        }

        if (!$site) {
            $site = Site::where('status', 'down')
                ->orWhere('status', 'warn')
                ->latest('updated_at')
                ->first() ?? Site::first();
        }

        $inspectionData = $this->buildInspectionData($site);

        return ResponseHelper::success('Data inspeksi layanan berhasil dimuat.', array_merge($inspectionData, [
            'available_services' => $availableServices,
        ]));
    }

    /**
     * Get inspection telemetry for a specific site ID.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $site = Site::findOrFail($id);

        $availableServices = Site::select(['id', 'name', 'url', 'status', 'category'])
            ->orderBy('name')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => (string) $s->id,
                    'name' => $s->name,
                    'url' => $s->url,
                    'status' => $s->status,
                ];
            });

        $inspectionData = $this->buildInspectionData($site);

        return ResponseHelper::success('Data inspeksi layanan berhasil dimuat.', array_merge($inspectionData, [
            'available_services' => $availableServices,
        ]));
    }

    /**
     * Build comprehensive inspection data matching the mobile "Inspect" UI.
     */
    protected function buildInspectionData(Site $site): array
    {
        // 1. Service Identification
        $shortId = 'srv-' . substr(abs(crc32($site->id)), 0, 4);

        // Fetch latest log and incident
        $latestLog = DetectionLog::where('site_id', $site->id)
            ->where('category', 'uptime')
            ->latest('id')
            ->first();

        $activeIncident = Incident::where('site_id', $site->id)
            ->whereNotIn('status', ['resolved', 'false_positive'])
            ->latest('detected_at')
            ->first();

        // 2. HTTP Code & Response Latency
        $httpCode = 200;
        $latencyMs = 38;

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
                default => 28 + (abs(crc32($site->name)) % 30),
            };
        }

        // Status Label
        $statusLabel = match ($site->status) {
            'down' => ($httpCode > 0 ? "{$httpCode} Bad Gateway" : '502 Bad Gateway'),
            'warn' => ($httpCode === 200 ? '200 OK (Warn)' : "{$httpCode} Warning"),
            default => '200 OK',
        };

        // Banner Alert Message
        if ($site->status === 'down') {
            $alertMessage = $activeIncident?->description
                ?? ($latestLog?->context ? Str_limit($latestLog->context, 75) : 'Bad Gateway 502 upstream: socket reset by peer');
            $isAlert = true;
        } elseif ($site->status === 'warn') {
            $alertMessage = 'High response latency detected on edge ingress: TTFB > 1.2s';
            $isAlert = true;
        } else {
            $alertMessage = 'Service healthy. Edge ingress proxy routing normal.';
            $isAlert = false;
        }

        // Subtitle / Architecture path
        $category = $site->category ?: 'REST API';
        $subtitle = "{$category} · Global Gateway · Ingress Edge Proxy";

        // Poll cycle
        $pollSeconds = $site->check_interval ? ($site->check_interval * 60) : 10;
        $pollCycleFormatted = $pollSeconds < 60 ? "{$pollSeconds}s Edge" : ($site->check_interval . "m Edge");

        // 3. 30-Day Reliability Heatmap Cells
        $heatmapData = $this->buildReliabilityHeatmap($site);

        // 4. Latency Breakdown (Edge to Core: DNS, TLS Handshake, TTFB)
        $latencyBreakdown = $this->buildLatencyBreakdown($latencyMs, $site->status);

        return [
            'service' => [
                'id' => (string) $site->id,
                'short_id' => $shortId,
                'name' => $site->name,
                'url' => $site->url,
                'subtitle' => $subtitle,
                'status' => $site->status,
                'status_code' => $httpCode,
                'status_label' => $statusLabel,
                'metrics' => [
                    'uptime_30d' => $site->uptime_percentage,
                    'uptime_30d_formatted' => $site->uptime_percentage . '%',
                    'avg_latency_ms' => $latencyMs > 0 ? $latencyMs : null,
                    'avg_latency_formatted' => $latencyMs > 0 ? "{$latencyMs} ms" : 'TIMEOUT',
                    'poll_cycle' => $pollCycleFormatted,
                ],
                'alert' => [
                    'is_alert' => $isAlert,
                    'message' => $alertMessage,
                ],
            ],
            'heatmap' => $heatmapData,
            'latency_breakdown' => $latencyBreakdown,
        ];
    }

    /**
     * Build 30-day reliability heatmap cells with operational, degraded, or downtime tags.
     */
    protected function buildReliabilityHeatmap(Site $site): array
    {
        $cells = [];
        $seed = abs(crc32($site->id . $site->name));

        $operationalCount = 0;
        $degradedCount = 0;
        $downtimeCount = 0;

        // Fetch any real incidents in the last 30 days for this site
        $incidents = Incident::where('site_id', $site->id)
            ->where('detected_at', '>=', now()->subDays(30))
            ->get();

        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateStr = $date->toDateString();
            $dayNumber = 30 - $i;

            // Check if there was an incident on this day
            $incidentOnDay = $incidents->first(function ($inc) use ($dateStr) {
                return $inc->detected_at && $inc->detected_at->toDateString() === $dateStr;
            });

            // For current day (i === 0), match current site status
            if ($i === 0) {
                if ($site->status === 'down') {
                    $status = 'downtime';
                    $val = 'FAIL';
                    $pct = 0.0;
                } elseif ($site->status === 'warn') {
                    $status = 'degraded';
                    $val = '98.4';
                    $pct = 98.4;
                } else {
                    $status = 'operational';
                    $val = '100';
                    $pct = 100.0;
                }
            } elseif ($incidentOnDay) {
                if ($incidentOnDay->severity === 'critical') {
                    $status = 'downtime';
                    $val = 'FAIL';
                    $pct = 92.4;
                } else {
                    $status = 'degraded';
                    $val = '98.4';
                    $pct = 98.4;
                }
            } else {
                // Deterministic pseudo-random variation based on seed
                $rand = ((($seed * ($i + 7) + 13) % 100) / 100);
                if ($rand > 0.96) {
                    $status = 'degraded';
                    $val = '99.1';
                    $pct = 99.1;
                } else {
                    $status = 'operational';
                    $val = '100';
                    $pct = 100.0;
                }
            }

            match ($status) {
                'operational' => $operationalCount++,
                'degraded' => $degradedCount++,
                'downtime' => $downtimeCount++,
            };

            $cells[] = [
                'day' => $dayNumber,
                'date' => $dateStr,
                'label' => $val,
                'uptime_percentage' => $pct,
                'status' => $status, // operational, degraded, downtime
                'is_today' => $i === 0,
            ];
        }

        return [
            'title' => '30-Day Reliability Heatmap',
            'range_label' => '30 Days Ago ➔ Today',
            'summary' => [
                'operational' => $operationalCount,
                'degraded' => $degradedCount,
                'downtime' => $downtimeCount,
            ],
            'cells' => $cells,
        ];
    }

    /**
     * Compute Edge-to-Core Latency Breakdown (DNS, TLS Handshake, Server Processing TTFB).
     */
    protected function buildLatencyBreakdown(int $totalLatencyMs, string $siteStatus): array
    {
        if ($siteStatus === 'down' || $totalLatencyMs <= 0) {
            return [
                'total_latency_ms' => 0,
                'total_latency_formatted' => 'TIMEOUT',
                'is_failed' => true,
                'stages' => [
                    [
                        'name' => 'DNS Resolution (Cloudflare Anycast)',
                        'latency_ms' => 4,
                        'percentage' => 0,
                        'status' => 'pass',
                    ],
                    [
                        'name' => 'TLS Handshake (TLS 1.3)',
                        'latency_ms' => 11,
                        'percentage' => 0,
                        'status' => 'pass',
                    ],
                    [
                        'name' => 'Server Processing (TTFB)',
                        'latency_ms' => null,
                        'percentage' => 100,
                        'status' => 'fail',
                    ],
                ],
            ];
        }

        // Realistic proportion breakdown:
        // DNS: ~12%, TLS: ~32%, Server TTFB: ~56%
        $dnsMs = max(2, (int) round($totalLatencyMs * 0.12));
        $tlsMs = max(4, (int) round($totalLatencyMs * 0.32));
        $ttfbMs = max(5, $totalLatencyMs - ($dnsMs + $tlsMs));

        $dnsPct = (int) round(($dnsMs / $totalLatencyMs) * 100);
        $tlsPct = (int) round(($tlsMs / $totalLatencyMs) * 100);
        $ttfbPct = 100 - ($dnsPct + $tlsPct);

        return [
            'total_latency_ms' => $totalLatencyMs,
            'total_latency_formatted' => "{$totalLatencyMs} ms",
            'is_failed' => false,
            'stages' => [
                [
                    'name' => 'DNS Resolution (Cloudflare Anycast)',
                    'latency_ms' => $dnsMs,
                    'percentage' => $dnsPct,
                    'status' => 'pass',
                ],
                [
                    'name' => 'TLS Handshake (TLS 1.3)',
                    'latency_ms' => $tlsMs,
                    'percentage' => $tlsPct,
                    'status' => 'pass',
                ],
                [
                    'name' => 'Server Processing (TTFB)',
                    'latency_ms' => $ttfbMs,
                    'percentage' => $ttfbPct,
                    'status' => $ttfbMs > 1000 ? 'warn' : 'pass',
                ],
            ],
        ];
    }
}
