<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

use App\Http\Controllers\SiteController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\UptimeReportController;
use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
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
});

require __DIR__.'/auth.php';
