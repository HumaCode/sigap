<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Site;
use App\Services\VisualDefaceService;

class CheckVisualDiff extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:check-visual-diff 
                            {--site= : ID situs spesifik yang ingin diperiksa} 
                            {--baseline : Tangkap snapshot saat ini sebagai baseline acuan baru}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pemeriksaan integritas visual dan deteksi defacement halaman web menggunakan perceptual structural diffing';

    /**
     * Execute the console command.
     */
    public function handle(VisualDefaceService $visualService)
    {
        $siteId = $this->option('site');
        $baseline = (bool) $this->option('baseline');
        $startTime = microtime(true);

        if ($siteId) {
            $site = Site::find($siteId);
            if (!$site) {
                $this->error("Situs dengan ID {$siteId} tidak ditemukan.");
                return 1;
            }

            $this->info("Memeriksa visual diff untuk {$site->name} ({$site->url})...");
            $r = $visualService->checkVisualDiff($site, $baseline);
            $this->displaySummaryTable([$r]);
        } else {
            $this->info("Memulai audit integritas visual untuk seluruh situs aktif...");
            $results = $visualService->checkAllSitesVisualDiff($baseline);
            $this->displaySummaryTable($results);
        }

        $duration = round(microtime(true) - $startTime, 2);
        $this->info("Audit integritas visual selesai dalam {$duration}s.");

        return 0;
    }

    protected function displaySummaryTable(array $results): void
    {
        $rows = array_map(function ($r) {
            $statusFormatted = match ($r['status'] ?? '') {
                'normal' => '<info>NORMAL (IDENTIK)</info>',
                'baseline_saved' => '<comment>BASELINE DISIMPAN</comment>',
                'defaced' => '<error>🚨 DEFACED (>35%)</error>',
                default => '<fg=gray>ERROR</>',
            };

            $diffStr = $r['diff_score'] !== null ? "{$r['diff_score']}%" : '-';

            return [
                $r['name'] ?? '-',
                $r['title'] ?? '-',
                $diffStr,
                $statusFormatted,
                $r['message'] ?? '-',
            ];
        }, $results);

        $this->table(
            ['Situs', 'Judul Halaman Terdeteksi', 'Diff Score', 'Status Integritas', 'Keterangan'],
            $rows
        );
    }
}
