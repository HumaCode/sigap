<?php

use App\Http\Controllers\Api\AuthController;
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
});
