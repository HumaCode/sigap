<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\UptimeCheckService;

class CheckSitesUptime extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'monitor:check-uptime {--site= : ID situs spesifik yang ingin diperiksa}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Melakukan pemeriksaan HTTP Health Check pada seluruh website terpantau';

    /**
     * Execute the console command.
     */
    public function handle(UptimeCheckService $uptimeCheckService)
    {
        $siteId = $this->option('site');
        $startTime = microtime(true);

        if ($siteId) {
            $site = \App\Models\Site::find($siteId);
            if (!$site) {
                $this->error("Situs dengan ID {$siteId} tidak ditemukan.");
                return 1;
            }
            $this->info("Memeriksa situs: {$site->name} ({$site->url})...");
            $result = $uptimeCheckService->checkSite($site);
            
            $statusLabel = $result['status'] === 'up' ? '<info>ONLINE</info>' : '<error>DOWN</error>';
            $this->line("Hasil: Status={$statusLabel} | HTTP={$result['status_code']} | Latensi={$result['response_time_ms']}ms");
        } else {
            $this->info("Memulai pengecekan uptime paralel (Http::pool) untuk seluruh situs...");
            $results = $uptimeCheckService->checkAllSites();
            $duration = round(microtime(true) - $startTime, 2);

            $rows = array_map(function ($r) {
                return [
                    $r['name'] ?? '-',
                    $r['url'] ?? '-',
                    $r['status_code'] ?: '0 (Timeout)',
                    ($r['response_time_ms'] ?? 0) . ' ms',
                    $r['status'] === 'up' ? 'ONLINE' : 'DOWN' . ($r['error'] ? " ({$r['error']})" : ''),
                ];
            }, $results);

            $this->table(['Situs', 'URL', 'HTTP Code', 'Latensi', 'Status'], $rows);
            $upCount = count(array_filter($results, fn($r) => $r['status'] === 'up'));
            $downCount = count($results) - $upCount;

            $this->info("Selesai memeriksa " . count($results) . " situs dalam {$duration}s (Online: {$upCount}, Down: {$downCount}).");
        }

        return 0;
    }
}
