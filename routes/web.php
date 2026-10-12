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

    $publicServices = \App\Models\Site::take(4)->get(['id', 'name', 'url', 'status'])->map(function ($site) {
        return [
            'id' => (string) $site->id,
            'name' => $site->name,
            'url' => $site->url,
            'status' => $site->status,
            'uptime' => $site->status === 'up' ? 99.9 : ($site->status === 'warn' ? 98.5 : 92.0),
        ];
    });

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'stats' => [
            'total_sites' => $totalSites > 0 ? $totalSites : 48,
            'avg_uptime' => $avgUptime,
            'active_incidents' => \App\Models\Incident::whereIn('status', ['open', 'investigating'])->count(),
        ],
        'publicServices' => $publicServices,
    ]);
})->name('home');

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
    Route::post('/settings/ninerouter/test', [\App\Http\Controllers\SettingController::class, 'testNineRouter'])->name('settings.ninerouter.test');
    Route::post('/settings/sso/test', [\App\Http\Controllers\SettingController::class, 'testSso'])->name('settings.sso.test');
    Route::delete('/settings/activity-logs', [\App\Http\Controllers\SettingController::class, 'clearActivityLogs'])->name('settings.activity-logs.clear');
});

require __DIR__.'/auth.php';
