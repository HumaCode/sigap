<?php

namespace App\Console\Commands;

use App\Models\Activity;
use App\Models\DetectionLog;
use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PruneExpiredLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:prune {--force : Paksa pembersihan meskipun fitur auto-prune nonaktif di pengaturan} {--days= : Override jumlah hari retensi secara manual}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Membersihkan riwayat log aktivitas dan log deteksi yang telah melewati batas masa retensi';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isAutoPrune = (bool) Setting::getValue('log_auto_prune', true);
        $isForce = (bool) $this->option('force');

        // Jika switch auto-prune nonaktif dan tidak dipaksa
        if (!$isAutoPrune && !$isForce) {
            $this->warn('Pembersihan otomatis dibatalkan: Fitur "Pembersihan Otomatis Terjadwal (Daily Auto-Prune)" dinonaktifkan di Pengaturan Sistem.');
            return 0;
        }

        // Tentukan masa retensi hari
        $customDays = $this->option('days');
        $retentionDays = $customDays !== null && is_numeric($customDays)
            ? (int) $customDays
            : (int) (Setting::getValue('log_retention_days') ?: 30);

        if ($retentionDays <= 0) {
            $this->error('Masa retensi tidak valid (harus lebih besar dari 0 hari).');
            return 1;
        }

        $cutoffDate = now()->subDays($retentionDays);

        $this->info("Memulai pembersihan log kedaluwarsa sebelum tanggal: {$cutoffDate->format('d M Y H:i:s')} (Batas retensi: {$retentionDays} hari)...");

        // 1. Bersihkan Activity Log
        $deletedActivities = Activity::where('created_at', '<', $cutoffDate)->delete();

        // 2. Bersihkan Detection Log
        $deletedDetections = DetectionLog::where('created_at', '<', $cutoffDate)->delete();

        $this->info("Hasil pembersihan:");
        $this->line("- Log Aktivitas (Audit Trail) terhapus : {$deletedActivities} baris");
        $this->line("- Log Deteksi Konten terhapus          : {$deletedDetections} baris");

        if ($deletedActivities > 0 || $deletedDetections > 0) {
            Log::info("Daily Auto-Prune: {$deletedActivities} activity logs dan {$deletedDetections} detection logs telah dibersihkan (retensi {$retentionDays} hari).");

            activity('system')
                ->log("Pembersihan otomatis terjadwal berhasil: {$deletedActivities} log aktivitas dan {$deletedDetections} log deteksi kedaluwarsa (>{$retentionDays} hari) telah dibersihkan.");
        } else {
            $this->comment('Tidak ditemukan data log kedaluwarsa yang memenuhi kriteria penghapusan.');
        }

        return 0;
    }
}
