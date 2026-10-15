<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Site;
use App\Services\PortExposureService;

class ScanPortExposure extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:scan-port-exposure 
                            {--site= : ID situs spesifik yang ingin diaudit}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pemindaian port eksternal berbahaya (3306, 6379, 27017, dll) dan kebocoran file konfigurasi sensitif (.env, .git)';

    /**
     * Execute the console command.
     */
    public function handle(PortExposureService $exposureService)
    {
        $siteId = $this->option('site');
        $startTime = microtime(true);

        if ($siteId) {
            $site = Site::find($siteId);
            if (!$site) {
                $this->error("Situs dengan ID {$siteId} tidak ditemukan.");
                return 1;
            }

            $this->info("Memindai eksposur port & file sensitif untuk {$site->name} ({$site->url})...");
            $r = $exposureService->auditSiteSecurityExposure($site);
            $this->displaySummaryTable([$r]);
        } else {
            $this->info("Memulai audit eksposur port & file sensitif untuk seluruh situs aktif...");
            $results = $exposureService->auditAllSitesExposure();
            $this->displaySummaryTable($results);
        }

        $duration = round(microtime(true) - $startTime, 2);
        $this->info("Audit eksposur port & file sensitif selesai dalam {$duration}s.");

        return 0;
    }

    protected function displaySummaryTable(array $results): void
    {
        $rows = array_map(function ($r) {
            $statusFormatted = !empty($r['has_critical'])
                ? '<error>⚠️ RAWAN (EKSPOSUR KRITIS)</error>'
                : '<info>AMAN (TERLINDUNGI)</info>';

            $portsStr = count($r['open_ports'] ?? []) > 0
                ? implode(', ', array_map(fn($p) => $p['port'], $r['open_ports']))
                : 'Tidak ada (Tertutup)';

            $filesStr = count($r['exposed_files'] ?? []) > 0
                ? implode(', ', array_map(fn($f) => $f['path'], $r['exposed_files']))
                : 'Tidak ada (Aman)';

            return [
                $r['name'] ?? '-',
                $r['host'] ?? '-',
                $portsStr,
                $filesStr,
                $statusFormatted,
            ];
        }, $results);

        $this->table(
            ['Situs', 'Host / IP', 'Port Terbuka', 'File Sensitif Terekspos', 'Status Keamanan'],
            $rows
        );
    }
}
