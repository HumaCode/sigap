<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Site;
use App\Services\DomainHealthService;

class CheckDomainHealth extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:check-domain-health 
                            {--site= : ID situs spesifik yang ingin diperiksa} 
                            {--force : Paksa kirim notifikasi tanpa memedulikan milestone terakhir}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pemeriksaan kesehatan domain, deteksi DNS / Name Server hijacking, dan masa berlaku domain (.id / .go.id)';

    /**
     * Execute the console command.
     */
    public function handle(DomainHealthService $domainService)
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

            $this->info("Memeriksa kesehatan domain & DNS untuk {$site->name} ({$site->url})...");
            $r = $domainService->checkSiteDomainHealth($site, $force);
            $this->displaySummaryTable([$r]);
        } else {
            $this->info("Memulai audit kesehatan domain & DNS untuk seluruh situs aktif...");
            $results = $domainService->checkAllSitesDomainHealth($force);
            $this->displaySummaryTable($results);
        }

        $duration = round(microtime(true) - $startTime, 2);
        $this->info("Pemeriksaan kesehatan domain & DNS selesai dalam {$duration}s.");

        return 0;
    }

    protected function displaySummaryTable(array $results): void
    {
        $rows = array_map(function ($r) {
            $statusFormatted = match ($r['status']) {
                'active' => '<info>AKTIF</info>',
                'expiring' => '<comment>HAMPIR HABIS</comment>',
                'expired' => '<error>KEDALUWARSA</error>',
                default => '<fg=gray>UNKNOWN / TDK TERDETEKSI</>',
            };

            $dnsStatus = isset($r['dns']['has_anomaly']) && $r['dns']['has_anomaly']
                ? '<error>⚠️ ANOMALI NS</error>'
                : '<info>NORMAL</info>';

            $nsCount = isset($r['dns']['name_servers']) ? count($r['dns']['name_servers']) : 0;
            $expiresStr = $r['expires_at'] ? $r['expires_at']->format('d M Y') : '-';
            $daysLeftStr = $r['days_left'] !== null ? "{$r['days_left']} hari" : '-';

            return [
                $r['name'] ?? '-',
                $r['domain'] ?? '-',
                $r['registrar'] ?? 'N/A',
                $nsCount . ' NS (' . $dnsStatus . ')',
                $expiresStr,
                $daysLeftStr,
                $statusFormatted,
            ];
        }, $results);

        $this->table(
            ['Situs', 'Domain Apex', 'Registrar', 'DNS Status', 'Berlaku Hingga', 'Sisa Hari', 'Status Domain'],
            $rows
        );
    }
}
