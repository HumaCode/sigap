<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $totalSites = \App\Models\Site::count();
    $downSites = \App\Models\Site::where('status', 'down')->count();
    $warnSites = \App\Models\Site::where('status', 'warn')->count();
    $activeSites = \App\Models\Site::where('status', 'up')->count();
    $pausedSites = \App\Models\Site::where('status', 'paused')->count();

    $avgUptime = 99.85;
    if ($totalSites > 0) {
        $totalUptimeSum = ($downSites * 92.4) + ($warnSites * 98.2) + (($activeSites + $pausedSites) * 99.9);
        $avgUptime = round($totalUptimeSum / $totalSites, 2);
    }

    $activeIncidents = \App\Models\Incident::whereIn('status', ['open', 'investigating'])->count();
    $criticalIncidents = \App\Models\Incident::where('severity', 'critical')
        ->whereIn('status', ['open', 'investigating'])
        ->count();

    if ($criticalIncidents > 0) {
        $defconLevel = 'DEFCON 2';
        $defconStatus = 'CRITICAL ALERT';
        $defconType = 'error';
    } elseif ($activeIncidents > 0 || $downSites > 0) {
        $defconLevel = 'DEFCON 3';
        $defconStatus = 'ELEVATED';
        $defconType = 'warning';
    } elseif ($warnSites > 0) {
        $defconLevel = 'DEFCON 4';
        $defconStatus = 'GUARDED';
        $defconType = 'secondary';
    } else {
        $defconLevel = 'DEFCON 5';
        $defconStatus = 'NOMINAL';
        $defconType = 'primary';
    }

    $sampleSites = \App\Models\Site::where('status', 'up')
        ->inRandomOrder()
        ->take(2)
        ->pluck('url')
        ->map(function ($url) {
            return preg_replace('#^https?://#', '', rtrim($url, '/'));
        })
        ->values()
        ->toArray();

    $radarBlip1 = $sampleSites[0] ?? 'portal.layanan-digital.id';
    $radarBlip2 = $sampleSites[1] ?? 'api.service-cloud.id';

    $latestSite = \App\Models\Site::latest('updated_at')->first(['name', 'url']);
    $latestDomain = $latestSite ? preg_replace('#^https?://#', '', rtrim($latestSite->url, '/')) : 'portal.layanan-digital.id';

    $sslValidCount = \App\Models\Site::where('status', '!=', 'down')->count();
    $sslPercentage = $totalSites > 0 ? round(($sslValidCount / $totalSites) * 100) : 100;

    $publicServices = \App\Models\Site::take(4)->get(['id', 'name', 'url', 'status'])->map(function ($site) {
        return [
            'id' => (string) $site->id,
            'name' => $site->name,
            'url' => preg_replace('#^https?://#', '', rtrim($site->url, '/')),
            'status' => $site->status,
            'status_label' => match ($site->status) {
                'up' => 'Aktif Normal',
                'warn' => 'Perlu Atensi',
                'down' => 'Gangguan',
                default => 'Pemeliharaan',
            },
            'uptime' => match ($site->status) {
                'up' => '99.98%',
                'warn' => '98.50%',
                'down' => '89.20%',
                default => '99.90%',
            },
        ];
    });

    if ($downSites > 0) {
        $systemStatus = [
            'type' => 'critical',
            'text' => "$downSites Layanan Mengalami Gangguan",
            'dot_color' => 'bg-error',
            'badge_color' => 'bg-error/10 text-error border-error/30 shadow-[0_0_24px_rgba(239,68,68,0.2)]',
        ];
    } elseif ($warnSites > 0) {
        $systemStatus = [
            'type' => 'warning',
            'text' => "$warnSites Layanan Perlu Perhatian",
            'dot_color' => 'bg-warning',
            'badge_color' => 'bg-warning/10 text-warning border-warning/30 shadow-[0_0_24px_rgba(245,158,11,0.2)]',
        ];
    } else {
        $systemStatus = [
            'type' => 'normal',
            'text' => 'Seluruh Sistem Beroperasi Normal',
            'dot_color' => 'bg-primary',
            'badge_color' => 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_24px_rgba(20,184,166,0.2)]',
        ];
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'stats' => [
            'total_sites' => $totalSites > 0 ? $totalSites : 48,
            'avg_uptime' => $avgUptime,
            'active_incidents' => $activeIncidents,
        ],
        'socTelemetry' => [
            'defcon_level' => $defconLevel,
            'defcon_status' => $defconStatus,
            'defcon_type' => $defconType,
            'radar_blip_1' => $radarBlip1,
            'radar_blip_2' => $radarBlip2,
            'anomalies_count' => $downSites + $warnSites + $activeIncidents,
            'critical_count' => $criticalIncidents,
            'ssl_percentage' => $sslPercentage,
            'latest_scanned_domain' => $latestDomain,
        ],
        'publicServices' => $publicServices,
        'systemStatus' => $systemStatus,
    ]);
})->name('home');

Route::get('/api/realtime-status', function () {
    $sites = \App\Models\Site::take(4)->get(['id', 'name', 'url', 'status'])->map(function ($site) {
        return [
            'id' => (string) $site->id,
            'name' => $site->name,
            'url' => preg_replace('#^https?://#', '', rtrim($site->url, '/')),
            'status' => $site->status,
            'status_label' => match ($site->status) {
                'up' => 'Aktif Normal',
                'warn' => 'Perlu Atensi',
                'down' => 'Gangguan',
                default => 'Pemeliharaan',
            },
            'uptime' => match ($site->status) {
                'up' => '99.98%',
                'warn' => '98.50%',
                'down' => '89.20%',
                default => '99.90%',
            },
        ];
    });

    $totalSites = \App\Models\Site::count();
    $downSites = \App\Models\Site::where('status', 'down')->count();
    $warnSites = \App\Models\Site::where('status', 'warn')->count();
    $upSites = \App\Models\Site::where('status', 'up')->count();

    $avgUptime = 99.85;
    if ($totalSites > 0) {
        $totalUptimeSum = ($downSites * 92.4) + ($warnSites * 98.2) + (($upSites + ($totalSites - $downSites - $warnSites - $upSites)) * 99.9);
        $avgUptime = round($totalUptimeSum / $totalSites, 2);
    }

    if ($downSites > 0) {
        $systemStatus = [
            'type' => 'critical',
            'text' => "$downSites Layanan Mengalami Gangguan",
            'dot_color' => 'bg-error',
            'badge_color' => 'bg-error/10 text-error border-error/30 shadow-[0_0_24px_rgba(239,68,68,0.2)]',
        ];
    } elseif ($warnSites > 0) {
        $systemStatus = [
            'type' => 'warning',
            'text' => "$warnSites Layanan Perlu Perhatian",
            'dot_color' => 'bg-warning',
            'badge_color' => 'bg-warning/10 text-warning border-warning/30 shadow-[0_0_24px_rgba(245,158,11,0.2)]',
        ];
    } else {
        $systemStatus = [
            'type' => 'normal',
            'text' => 'Seluruh Sistem Beroperasi Normal',
            'dot_color' => 'bg-primary',
            'badge_color' => 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_24px_rgba(20,184,166,0.2)]',
        ];
    }

    return response()->json([
        'services' => $sites,
        'system_status' => $systemStatus,
        'summary' => [
            'total_sites' => $totalSites,
            'up_sites' => $upSites,
            'warn_sites' => $warnSites,
            'down_sites' => $downSites,
            'avg_uptime' => $avgUptime,
        ],
        'updated_at' => now()->format('H:i:s') . ' WIB',
        'timestamp' => now()->timestamp,
    ]);
})->name('status.realtime');

use App\Http\Controllers\SiteController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\UptimeReportController;
use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'active'])
    ->name('dashboard');

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    Route::post('/sites/{site}/check', [SiteController::class, 'recheck'])->name('sites.check');
    Route::post('/sites/test-ssh', [SiteController::class, 'testSshConnection'])->name('sites.test-ssh');
    Route::resource('sites', SiteController::class)->except(['create', 'edit', 'show']);
    Route::post('/incidents/mark-all-resolved', [\App\Http\Controllers\IncidentController::class, 'markAllResolved'])->name('incidents.mark-all-resolved');
    Route::post('/incidents/ai-remediation', [\App\Http\Controllers\AiRemediationController::class, 'generate'])->name('incidents.ai-remediation');
    Route::get('/incidents/{incident}/ai-history', [\App\Http\Controllers\AiRemediationController::class, 'history'])->name('incidents.ai-history');
    Route::resource('incidents', IncidentController::class)->except(['create', 'edit', 'show']);
    
    Route::get('/uptime-reports', [\App\Http\Controllers\UptimeReportController::class, 'index'])->name('reports.uptime');
    Route::get('/detection-logs', [\App\Http\Controllers\DetectionLogController::class, 'index'])->name('logs.detection');
    Route::patch('/detection-logs/{id}/status', [\App\Http\Controllers\DetectionLogController::class, 'updateStatus'])->name('logs.detection.status');
    Route::post('/detection-logs/mark-all-reviewed', [\App\Http\Controllers\DetectionLogController::class, 'markAllReviewed'])->name('logs.detection.mark-all-reviewed');
    
    Route::resource('keywords', \App\Http\Controllers\KeywordController::class)->except(['create', 'edit', 'show']);
    Route::get('/security', [\App\Http\Controllers\SiteSecurityController::class, 'index'])->name('security.index');
    Route::post('/security/scan', [\App\Http\Controllers\SiteSecurityController::class, 'scan'])->name('security.scan');
    
    Route::get('/backups', [\App\Http\Controllers\BackupController::class, 'index'])->name('backups.index');
    Route::post('/backups', [\App\Http\Controllers\BackupController::class, 'store'])->name('backups.store');
    Route::get('/backups/{id}/download', [\App\Http\Controllers\BackupController::class, 'download'])->name('backups.download');
    Route::post('/backups/{id}/restore', [\App\Http\Controllers\BackupController::class, 'restore'])->name('backups.restore');
    Route::delete('/backups/{id}', [\App\Http\Controllers\BackupController::class, 'destroy'])->name('backups.destroy');

    Route::get('/server-investigations', [\App\Http\Controllers\ServerInvestigationController::class, 'index'])->name('server-investigations.index');
    Route::get('/server-investigations/{site}/check-health', [\App\Http\Controllers\ServerInvestigationController::class, 'checkHealth'])->name('server-investigations.check-health');
    Route::post('/server-investigations/{site}/scan-files', [\App\Http\Controllers\ServerInvestigationController::class, 'scanFiles'])->name('server-investigations.scan-files');
    Route::post('/server-investigations/{site}/quarantine-file', [\App\Http\Controllers\ServerInvestigationController::class, 'quarantineFile'])->name('server-investigations.quarantine-file');
    Route::post('/server-investigations/{site}/rollback-file', [\App\Http\Controllers\ServerInvestigationController::class, 'rollbackFile'])->name('server-investigations.rollback-file');
    Route::post('/server-investigations/{site}/toggle-maintenance', [\App\Http\Controllers\ServerInvestigationController::class, 'toggleMaintenance'])->name('server-investigations.toggle-maintenance');
    Route::post('/server-investigations/{site}/analyze-logs', [\App\Http\Controllers\ServerInvestigationController::class, 'analyzeLogs'])->name('server-investigations.analyze-logs');
    
    Route::patch('/users/{id}/toggle-status', [\App\Http\Controllers\UserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::resource('users', \App\Http\Controllers\UserController::class)->except(['create', 'edit', 'show']);

    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');
    Route::delete('/notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::delete('/notifications/clear-all', [\App\Http\Controllers\NotificationController::class, 'clearAll'])->name('notifications.clear-all');

    Route::get('/incidents/ai-models', [\App\Http\Controllers\AiRemediationController::class, 'models'])->name('incidents.ai-models');

    Route::get('/settings', [\App\Http\Controllers\SettingController::class, 'index'])->name('settings.index');
    Route::post('/settings', [\App\Http\Controllers\SettingController::class, 'update'])->name('settings.update');
    Route::post('/settings/telegram/test', [\App\Http\Controllers\SettingController::class, 'testTelegram'])->name('settings.telegram.test');
    Route::post('/settings/ninerouter/test', [\App\Http\Controllers\SettingController::class, 'testNineRouter'])->name('settings.ninerouter.test');
    Route::post('/settings/sso/test', [\App\Http\Controllers\SettingController::class, 'testSso'])->name('settings.sso.test');
    Route::delete('/settings/activity-logs', [\App\Http\Controllers\SettingController::class, 'clearActivityLogs'])->name('settings.activity-logs.clear');
});

require __DIR__.'/auth.php';
