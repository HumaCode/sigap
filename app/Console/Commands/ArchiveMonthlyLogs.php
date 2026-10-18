<?php

namespace App\Console\Commands;

use App\Services\LogArchiveService;
use Illuminate\Console\Command;

class ArchiveMonthlyLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:archive-monthly {--month= : Periode bulan yang ingin diarsipkan (format YYYY-MM, contoh: 2026-09)} {--period= : Alias untuk --month} {--scope=all : Cakupan data: all, activity, detection, incident} {--no-purge : Hanya backup tanpa membersihkan log dari database} {--force : Paksa eksekusi meskipun backup otomatis dinonaktifkan}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Otomatis membuat arsip PDF eksekutif & raw ZIP dari data log bulanan, kemudian membersihkan tabel database';

    public function __construct(protected LogArchiveService $archiveService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hasExplicitMonth = !empty($this->option('month')) || !empty($this->option('period'));
        $force = (bool) $this->option('force');
        $autoBackupEnabled = (bool) \App\Models\Setting::getValue('log_auto_backup_enabled', true);

        // Jika dipanggil otomatis (tanpa parameter bulan spesifik) dan fitur dinonaktifkan
        if (!$hasExplicitMonth && !$force && !$autoBackupEnabled) {
            $this->warn("Fitur backup otomatis bulanan sedang DINONAKTIFKAN di Pengaturan Sistem.");
            $this->line("Eksekusi dilewati. Aktifkan di web atau gunakan opsi --force jika ingin tetap menjalankan.");
            return 0;
        }

        $month = $this->option('month') ?: $this->option('period') ?: now()->subMonth()->format('Y-m');
        $purge = !$this->option('no-purge');
        $scope = $this->option('scope') ?: 'all';

        $this->info("Memulai proses arsip dan rekap log ({$scope}) untuk periode: {$month}...");

        try {
            $result = $this->archiveService->archivePeriod($month, null, $purge, $scope);

            $this->info("✔ Arsip ({$result['scope']}) berhasil dibuat!");
            $this->line("- Log Aktivitas Terarsip : " . number_format($result['activity_count']) . " baris");
            $this->line("- Log Deteksi Terarsip   : " . number_format($result['detection_count']) . " baris");
            $this->line("- Insiden Terarsip       : " . number_format($result['incident_count']) . " baris");
            $this->line("- File Laporan PDF       : " . $result['pdf_file'] . " (" . round($result['pdf_size'] / 1024, 1) . " KB)");
            $this->line("- File Data Mentah ZIP   : " . $result['zip_file'] . " (" . round($result['zip_size'] / 1024, 1) . " KB)");

            if ($result['purged']) {
                $this->info("✔ Pembersihan database selesai:");
                $this->line("- Data Activity Log terhapus  : " . number_format($result['deleted_activities']) . " baris");
                $this->line("- Data Detection Log terhapus : " . number_format($result['deleted_detections']) . " baris");
                $this->line("- Data Insiden terhapus       : " . number_format($result['deleted_incidents']) . " baris");
            } else {
                $this->warn("Data log di database tidak dihapus (mode --no-purge).");
            }

            return 0;
        } catch (\Throwable $e) {
            $this->error("Gagal menjalankan arsip log bulanan: " . $e->getMessage());
            return 1;
        }
    }
}
