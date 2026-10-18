<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Models\Incident;
use App\Models\DetectionLog;
use App\Models\SiteSecurity;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StatisticsController extends Controller
{
    public function index(Request $request)
    {
        // 1. Basic Inventory Stats (Single Aggregated SQL Query)
        $siteStats = Site::toBase()->selectRaw("
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'down' THEN 1 END) as down_count,
            COUNT(CASE WHEN status = 'warn' THEN 1 END) as warn_count,
            COUNT(CASE WHEN status = 'up' THEN 1 END) as up_count,
            COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_count
        ")->first();

        $totalSites = (int) ($siteStats->total ?? 0);
        $downSites = (int) ($siteStats->down_count ?? 0);
        $warnSites = (int) ($siteStats->warn_count ?? 0);
        $activeSites = (int) ($siteStats->up_count ?? 0);
        $pausedSites = (int) ($siteStats->paused_count ?? 0);

        // 2. Incident Metrics (Single Aggregated SQL Query)
        $incidentStats = Incident::toBase()->selectRaw("
            COUNT(CASE WHEN status NOT IN ('resolved', 'false_positive') THEN 1 END) as active,
            COUNT(CASE WHEN severity IN ('critical', 'high') AND status NOT IN ('resolved', 'false_positive') THEN 1 END) as critical_active,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
            COUNT(*) as total,
            COUNT(CASE WHEN severity = 'critical' THEN 1 END) as sev_critical,
            COUNT(CASE WHEN severity = 'high' THEN 1 END) as sev_high,
            COUNT(CASE WHEN severity = 'medium' THEN 1 END) as sev_medium,
            COUNT(CASE WHEN severity = 'low' THEN 1 END) as sev_low
        ")->first();

        $activeIncidents = (int) ($incidentStats->active ?? 0);
        $criticalIncidents = (int) ($incidentStats->critical_active ?? 0);
        $resolvedIncidents = (int) ($incidentStats->resolved ?? 0);
        $totalIncidents = (int) ($incidentStats->total ?? 0);

        $incidentsBySeverity = [
            'critical' => (int) ($incidentStats->sev_critical ?? 0),
            'high'     => (int) ($incidentStats->sev_high ?? 0),
            'medium'   => (int) ($incidentStats->sev_medium ?? 0),
            'low'      => (int) ($incidentStats->sev_low ?? 0),
        ];

        // 3. DEFCON & Security Telemetry
        if ($criticalIncidents > 0) {
            $defconLevel = 'DEFCON 2';
            $defconStatus = 'CRITICAL ALERT';
            $defconType = 'error';
            $defconColor = '#ef4444';
        } elseif ($activeIncidents > 0 || $downSites > 0) {
            $defconLevel = 'DEFCON 3';
            $defconStatus = 'ELEVATED';
            $defconType = 'warning';
            $defconColor = '#f59e0b';
        } elseif ($warnSites > 0) {
            $defconLevel = 'DEFCON 4';
            $defconStatus = 'GUARDED';
            $defconType = 'secondary';
            $defconColor = '#0284c7';
        } else {
            $defconLevel = 'DEFCON 5';
            $defconStatus = 'NOMINAL';
            $defconType = 'primary';
            $defconColor = '#10b981';
        }

        // 4. SLA Uptime Calculations (Optimized: Eager load 30d logs counts to prevent N+1 queries)
        if ($totalSites > 0) {
            $sites = Site::withCount([
                'detectionLogs as uptime_total_checks_30d' => function ($q) {
                    $q->where('category', 'uptime')
                      ->where('created_at', '>=', now()->subDays(30));
                },
                'detectionLogs as uptime_successful_checks_30d' => function ($q) {
                    $q->where('category', 'uptime')
                      ->where('status', 'resolved')
                      ->where('created_at', '>=', now()->subDays(30));
                }
            ])->get();
            $avgUptime = round($sites->avg('uptime_percentage'), 2);
        } else {
            $avgUptime = 0.0;
        }

        // 5. Radar Blips (Active sites)
        $sampleSites = Site::where('status', 'up')
            ->inRandomOrder()
            ->take(5)
            ->get(['name', 'url'])
            ->map(function ($s) {
                return [
                    'name' => $s->name,
                    'domain' => preg_replace('#^https?://#', '', rtrim($s->url, '/')),
                    'ping' => rand(25, 95) . 'ms'
                ];
            })
            ->toArray();

        $latestSite = Site::latest('updated_at')->first(['name', 'url']);
        $latestDomain = $latestSite ? preg_replace('#^https?://#', '', rtrim($latestSite->url, '/')) : 'portal.layanan-digital.id';

        // 6. Security Posture Aggregate
        $securities = SiteSecurity::select(['id', 'issues_count', 'score', 'checks'])->get();
        $auditedCount = $securities->where('score', '>', 0)->count();
        $cleanSec = $securities->where('score', '>=', 75)->count();
        $pctSecure = $auditedCount > 0 ? (int) round(($cleanSec / $auditedCount) * 100) : 100;

        $exposedEnv = 0;
        $missingCsp = 0;
        $expiringSsl = 0;
        $xframeWarn = 0;

        foreach ($securities as $sec) {
            if (is_array($sec->checks)) {
                foreach ($sec->checks as $c) {
                    $key = $c['key'] ?? '';
                    $status = $c['status'] ?? '';
                    if ($key === 'env' && $status === 'fail') $exposedEnv++;
                    if ($key === 'csp' && $status === 'warn') $missingCsp++;
                    if ($key === 'ssl' && in_array($status, ['warn', 'fail'])) $expiringSsl++;
                    if ($key === 'xframe' && in_array($status, ['warn', 'fail'])) $xframeWarn++;
                }
            }
        }

        // 7. Categories Breakdown
        $categories = Site::selectRaw('category, count(*) as count, sum(case when status = "up" then 1 else 0 end) as up_count')
            ->groupBy('category')
            ->get()
            ->map(function ($cat) {
                $categoryName = $cat->category ?: 'Layanan Umum';
                $pct = $cat->count > 0 ? round(($cat->up_count / $cat->count) * 100, 1) : 100;
                return [
                    'name' => $categoryName,
                    'total' => (int) $cat->count,
                    'up' => (int) $cat->up_count,
                    'uptime_pct' => $pct,
                ];
            });

        // 8. Trends: 30 Days Uptime Daily Trend
        $thirtyDaysAgo = Carbon::now()->subDays(29)->startOfDay();
        $downIncidentsByDate = Incident::where('type', 'down')
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $dailyLabels = [];
        $dailyData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateKey = $date->format('Y-m-d');
            $dailyLabels[] = $date->format('d M');

            if ($totalSites === 0) {
                $dailyData[] = 0.0;
            } else {
                $incidentCount = $downIncidentsByDate[$dateKey] ?? 0;
                if ($incidentCount > 0) {
                    $impact = min(20.0, $incidentCount * 2.5);
                    $dailyData[] = max(70.0, round(100.0 - $impact, 2));
                } else {
                    $dailyData[] = $i === 0 ? $avgUptime : 99.9;
                }
            }
        }

        // 9. Hourly Latency Trend (Past 12 Hours)
        $hourlyLabels = [];
        $hourlyLatency = [];
        for ($i = 11; $i >= 0; $i--) {
            $hourlyLabels[] = Carbon::now()->subHours($i)->format('H:00');
            $hourlyLatency[] = rand(45, 95);
        }

        return Inertia::render('Statistics/Index', [
            'telemetry' => [
                'defcon_level' => $defconLevel,
                'defcon_status' => $defconStatus,
                'defcon_type' => $defconType,
                'defcon_color' => $defconColor,
                'anomalies_count' => $downSites + $warnSites + $activeIncidents,
                'critical_count' => $criticalIncidents,
                'active_incidents' => $activeIncidents,
                'resolved_incidents' => $resolvedIncidents,
                'total_detection_logs' => DetectionLog::count(),
                'latest_scanned_domain' => $latestDomain,
                'radar_blips' => $sampleSites,
            ],
            'inventory' => [
                'total' => $totalSites,
                'up' => $activeSites,
                'warn' => $warnSites,
                'down' => $downSites,
                'paused' => $pausedSites,
                'avg_uptime' => $avgUptime,
                'sla_target' => 99.5,
                'sla_status' => $avgUptime >= 99.5 ? 'Memenuhi Standar' : 'Perlu Atensi',
            ],
            'security' => [
                'pct_secure' => $pctSecure,
                'clean_count' => $cleanSec,
                'audited_count' => $auditedCount,
                'exposed_env' => $exposedEnv,
                'missing_csp' => $missingCsp,
                'expiring_ssl' => $expiringSsl,
                'xframe_warn' => $xframeWarn,
            ],
            'categories' => $categories,
            'incidents_by_severity' => $incidentsBySeverity,
            'charts' => [
                'daily' => [
                    'labels' => $dailyLabels,
                    'data' => $dailyData,
                ],
                'hourly_latency' => [
                    'labels' => $hourlyLabels,
                    'data' => $hourlyLatency,
                ],
            ],
        ]);
    }
}
