<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Site;
use App\Services\SslCheckService;

class CheckSslExpiry extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:check-ssl-expiry 
                            {--site= : ID situs spesifik yang ingin diperiksa} 
                            {--force : Paksa kirim notifikasi tanpa memedulikan milestone terakhir}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pemeriksaan otomatis masa berlaku sertifikat SSL dan peringatan dini kedaluwarsa (H-30, H-14, H-7, H-1)';

    /**
     * Execute the console command.
     */
    public function handle(SslCheckService $sslService)
    {
        $siteId = $this->option('site');
        $force = (bool) $this->option('force');
        $startTime = microtime(true);

        if ($siteId) {
            $site = Site::find($siteId);
            if (!$site) {
                $this->error("Situs dengan ID {$siteId} tidak ditemukan.");
                return 1;
            }

            $this->info("Memeriksa sertifikat SSL untuk {$site->name} ({$site->url})...");
            $r = $sslService->checkSiteSsl($site, $force);
            
            $this->displaySummaryTable([$r]);
        } else {
            $this->info("Memulai audit masa berlaku sertifikat SSL untuk seluruh situs...");
            $results = $sslService->checkAllSitesSsl($force);
            $this->displaySummaryTable($results);
        }

        $duration = round(microtime(true) - $startTime, 2);
        $this->info("Pemeriksaan sertifikat SSL selesai dalam {$duration}s.");

        return 0;
    }

    protected function displaySummaryTable(array $results): void
    {
        $rows = array_map(function ($r) {
            $statusFormatted = match ($r['status']) {
                'valid' => '<info>VALID</info>',
                'expiring' => '<comment>HAMPIR HABIS</comment>',
                'expired' => '<error>KEDALUWARSA</error>',
                'self_signed' => '<comment>SELF-SIGNED</comment>',
                default => '<error>GAGAL / ERROR</error>',
            };

            $validToStr = $r['valid_to'] ? $r['valid_to']->format('d M Y') : '-';
            $daysLeftStr = $r['days_left'] !== null ? "{$r['days_left']} hari" : '-';

            return [
                $r['name'] ?? '-',
                $r['host'] ?? '-',
                $r['issuer'] ?? 'N/A',
                $validToStr,
                $daysLeftStr,
                $statusFormatted,
            ];
        }, $results);

        $this->table(['Situs', 'Host / Domain', 'Penerbit (CA)', 'Berlaku Hingga', 'Sisa Hari', 'Status SSL'], $rows);
    }
}
