<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 2.1 Worker Scheduler Pemantauan Uptime Otomatis (Setiap Menit)
Schedule::command('monitor:check-uptime')
    ->everyMinute()
    ->withoutOverlapping(10)
    ->runInBackground();

// 2.2 Pelacak Kedaluwarsa Sertifikat SSL Otomatis (Setiap Hari 06:00 WIB)
Schedule::command('security:check-ssl-expiry')
    ->dailyAt('06:00')
    ->withoutOverlapping(15)
    ->runInBackground();

// 2.3 Domain Expiry & DNS Health Tracker (Setiap Hari 06:30 WIB)
Schedule::command('security:check-domain-health')
    ->dailyAt('06:30')
    ->withoutOverlapping(15)
    ->runInBackground();

// 4.1 Visual Defacement Diffing (Setiap 30 Menit)
Schedule::command('security:check-visual-diff')
    ->everyThirtyMinutes()
    ->withoutOverlapping(20)
    ->runInBackground();

// 4.2 Pemindai Port & Service Exposure Terbuka (Setiap Hari 07:00 WIB)
Schedule::command('security:scan-port-exposure')
    ->dailyAt('07:00')
    ->withoutOverlapping(20)
    ->runInBackground();

// Prune logs pemantauan lama setiap hari pukul 00:30
Schedule::command('logs:prune')
    ->dailyAt('00:30')
    ->withoutOverlapping(15)
    ->runInBackground();

// 5.1 Otomatis Arsip Log Bulanan (PDF & ZIP Raw) & Pembersihan Database (Setiap Tanggal 1 Pukul 01:00 WIB)
Schedule::command('logs:archive-monthly')
    ->monthlyOn(1, '01:00')
    ->withoutOverlapping(30)
    ->when(function () {
        return (bool) \App\Models\Setting::getValue('log_auto_backup_enabled', true);
    })
    ->runInBackground();

