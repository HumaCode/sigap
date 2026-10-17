<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\Api\IncidentApiController;
use App\Http\Controllers\Api\SiteApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mobile & REST API Routes (SIGAP Mobile)
| Base Prefix: /api/v1/
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->middleware('app.key')->group(function () {
    // Modul 1: Autentikasi & Keamanan Pengguna
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->name('api.v1.auth.login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
            Route::get('me', [AuthController::class, 'me'])->name('api.v1.auth.me');
        });
    });

    // Protected Routes (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        // Modul 2: Executive Dashboard
        Route::get('dashboard/stats', [DashboardApiController::class, 'stats'])->name('api.v1.dashboard.stats');

        // Modul 3: Manajemen & Pemantauan Situs (Site Explorer / Services)
        Route::prefix('sites')->group(function () {
            Route::get('/', [SiteApiController::class, 'index'])->name('api.v1.sites.index');
            Route::get('{id}', [SiteApiController::class, 'show'])->name('api.v1.sites.show');
            Route::post('{id}/check', [SiteApiController::class, 'check'])->name('api.v1.sites.check');
        });

        // Modul 4: Pusat Penanganan Insiden (War Room Live)
        Route::prefix('incidents')->group(function () {
            Route::get('/', [IncidentApiController::class, 'index'])->name('api.v1.incidents.index');
            Route::get('{id}', [IncidentApiController::class, 'show'])->name('api.v1.incidents.show');
            Route::patch('{id}/status', [IncidentApiController::class, 'updateStatus'])->name('api.v1.incidents.status');
            Route::post('{id}/notes', [IncidentApiController::class, 'addNote'])->name('api.v1.incidents.notes');
        });
    });
});

