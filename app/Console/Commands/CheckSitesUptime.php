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

        if ($siteId) {
            $site = \App\Models\Site::find($siteId);
            if (!$site) {
                $this->error("Situs dengan ID {$siteId} tidak ditemukan.");
                return 1;
            }
            $this->info("Memeriksa situs: {$site->name} ({$site->url})...");
            $result = $uptimeCheckService->checkSite($site);
            $this->info("Hasil: Status={$result['status']} | HTTP={$result['status_code']} | Latensi={$result['response_time_ms']}ms");
        } else {
            $this->info("Memulai pengecekan uptime untuk seluruh situs...");
            $results = $uptimeCheckService->checkAllSites();
            $this->info("Selesai memeriksa " . count($results) . " situs.");
        }

        return 0;
    }
}
