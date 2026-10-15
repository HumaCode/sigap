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

// Prune logs pemantauan lama setiap hari pukul 00:30
Schedule::command('logs:prune')
    ->dailyAt('00:30')
    ->withoutOverlapping(15)
    ->runInBackground();

