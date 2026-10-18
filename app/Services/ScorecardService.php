<?php

namespace App\Services;

use App\Models\Site;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ScorecardService
{
    /**
     * Calculate scorecard details for a single site.
     */
    public function calculateSiteScore(Site $site): array
    {
        // 1. Pilar 1: Uptime 30 Hari (Bobot 40%)
        $uptimePct = (float) $site->uptime_percentage;
        if ($uptimePct >= 99.9) {
            $uptimePoints = 100;
        } elseif ($uptimePct >= 99.5) {
            $uptimePoints = 95;
        } elseif ($uptimePct >= 99.0) {
            $uptimePoints = 85;
        } elseif ($uptimePct >= 98.0) {
            $uptimePoints = 72;
        } elseif ($uptimePct >= 95.0) {
            $uptimePoints = 50;
        } else {
            $uptimePoints = max(10, (int) round($uptimePct * 0.45));
        }
        $uptimeScore = round($uptimePoints * 0.40, 1);

        // 2. Pilar 2: Kepatuhan SSL, Port, & Postur Keamanan (Bobot 30%)
        $secPoints = 100;

        // SSL deductions
        $sslDays = $site->ssl_days_left;
        if ($site->ssl_status === 'expired' || ($sslDays !== null && $sslDays <= 0)) {
            $secPoints -= 40;
        } elseif ($site->ssl_status === 'invalid') {
            $secPoints -= 35;
        } elseif ($sslDays !== null && $sslDays <= 7) {
            $secPoints -= 20;
        } elseif ($sslDays !== null && $sslDays <= 14) {
            $secPoints -= 10;
        }

        // Domain deductions
        if ($site->domain_days_left !== null && $site->domain_days_left <= 7) {
            $secPoints -= 15;
        }

        // Port Exposure deductions
        if (!empty($site->open_ports) && is_array($site->open_ports)) {
            $openCount = count($site->open_ports);
            $secPoints -= min(30, $openCount * 15);
        }

        // Sensitive files exposed
        if (!empty($site->sensitive_files_exposed) && is_array($site->sensitive_files_exposed)) {
            $secPoints -= 25;
        }

        // Defacement visual diff score
        $diffScore = (float) ($site->visual_diff_score ?? 0);
        if ($diffScore >= 35.0) {
            $secPoints -= 30;
        } elseif ($diffScore >= 15.0) {
            $secPoints -= 15;
        }

        // Factor in SiteSecurity audit if present
        if ($site->security && $site->security->score !== null) {
            $secPoints = (int) round(($secPoints + (int) $site->security->score) / 2);
        }

        $secPoints = max(0, min(100, $secPoints));
        $secScore = round($secPoints * 0.30, 1);

        // 3. Pilar 3: Riwayat Bebas Insiden Siber 30 Hari (Bobot 30%)
        $incQuery = $site->incidents();
        $criticalActive = (clone $incQuery)->where('severity', 'critical')->whereIn('status', ['open', 'investigating'])->count();
        $otherActive = (clone $incQuery)->whereIn('status', ['open', 'investigating'])->count();
        $recentResolved = (clone $incQuery)->where('status', 'resolved')->where('created_at', '>=', now()->subDays(30))->count();

        if ($criticalActive > 0) {
            $incPoints = 15;
        } elseif ($otherActive > 0) {
            $incPoints = 50;
        } elseif ($recentResolved > 2) {
            $incPoints = 75;
        } elseif ($recentResolved > 0) {
            $incPoints = 90;
        } else {
            $incPoints = 100;
        }
        $incScore = round($incPoints * 0.30, 1);

        // Total Indeks Kematangan (0 - 100)
        $totalScore = round($uptimeScore + $secScore + $incScore, 1);

        // Penentuan Mutu Nilai Huruf (Grade)
        if ($totalScore >= 95.0) {
            $grade = 'A+';
            $gradeLabel = 'Ekselen / Teladan SPBE';
            $gradeColor = 'var(--teal-1)';
        } elseif ($totalScore >= 85.0) {
            $grade = 'A';
            $gradeLabel = 'Sangat Baik';
            $gradeColor = '#0284c7';
        } elseif ($totalScore >= 70.0) {
            $grade = 'B';
            $gradeLabel = 'Baik (Standar Terpenuhi)';
            $gradeColor = '#0d9488';
        } elseif ($totalScore >= 50.0) {
            $grade = 'C';
            $gradeLabel = 'Cukup (Perlu Evaluasi)';
            $gradeColor = '#d97706';
        } else {
            $grade = 'D';
            $gradeLabel = 'Kritis (Prioritas Remediasi)';
            $gradeColor = '#dc2626';
        }

        return [
            'id' => $site->id,
            'name' => $site->name,
            'url' => $site->url,
            'category' => $site->category ?? 'Umum',
            'status' => $site->status,
            'pic_name' => $site->pic_name ?? 'Tim Teknis OPD',
            'total_score' => $totalScore,
            'grade' => $grade,
            'grade_label' => $gradeLabel,
            'grade_color' => $gradeColor,
            'breakdown' => [
                'uptime' => [
                    'weight' => '40%',
                    'raw_value' => $uptimePct . '%',
                    'points' => $uptimePoints,
                    'score' => $uptimeScore,
                    'max_score' => 40,
                ],
                'security' => [
                    'weight' => '30%',
                    'raw_ssl' => $sslDays !== null ? $sslDays . ' hari' : 'Valid',
                    'raw_ports' => !empty($site->open_ports) ? count($site->open_ports) . ' terekspos' : 'Aman',
                    'points' => $secPoints,
                    'score' => $secScore,
                    'max_score' => 30,
                ],
                'incidents' => [
                    'weight' => '30%',
                    'raw_active' => $otherActive,
                    'raw_critical' => $criticalActive,
                    'points' => $incPoints,
                    'score' => $incScore,
                    'max_score' => 30,
                ],
            ],
            'recommendation' => $this->generateRecommendation($totalScore, $uptimePct, $sslDays, $otherActive),
        ];
    }

    /**
     * Generate instant actionable remediation advice for website operators.
     */
    protected function generateRecommendation(float $totalScore, float $uptimePct, ?int $sslDays, int $activeIncidents): string
    {
        if ($totalScore >= 95) {
            return 'Pertahankan performa ketersediaan tinggi dan audit berkala kepatuhan header keamanan.';
        }
        if ($uptimePct < 99.0) {
            return 'Optimalkan konfigurasi web server, periksa kapasitas RAM/CPU, dan pasang failover CDN.';
        }
        if ($sslDays !== null && $sslDays <= 14) {
            return 'Segera perpanjang sertifikat SSL sebelum kedaluwarsa untuk mencegah peringatan browser pada publik.';
        }
        if ($activeIncidents > 0) {
            return 'Tuntaskan tiket insiden keamanan aktif dan lakukan sanitasi konten melalui modul AI Remediation.';
        }
        return 'Lakukan hardening konfigurasi server dan tutup port database yang tidak diperlukan dari akses publik.';
    }

    /**
     * Get full Leaderboard ranking of sites.
     */
    public function getLeaderboard(array $filters = []): array
    {
        $query = Site::with(['security', 'incidents'])->withCount([
            'detectionLogs as uptime_total_checks_30d' => function ($q) {
                $q->where('category', 'uptime')
                  ->where('created_at', '>=', now()->subDays(30));
            },
            'detectionLogs as uptime_successful_checks_30d' => function ($q) {
                $q->where('category', 'uptime')
                  ->where('status', 'resolved')
                  ->where('created_at', '>=', now()->subDays(30));
            }
        ]);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('url', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['category']) && $filters['category'] !== 'all' && $filters['category'] !== 'Semua Kategori') {
            $query->where('category', $filters['category']);
        }

        $sites = $query->get();

        $scoredSites = $sites->map(function ($site) {
            return $this->calculateSiteScore($site);
        })->sortByDesc('total_score')->values();

        // Assign Rank Position (#1, #2, ...)
        $rankedSites = $scoredSites->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });

        // Calculate Aggregate Summary Stats
        $totalCount = $rankedSites->count();
        $avgScore = $totalCount > 0 ? round($rankedSites->avg('total_score'), 1) : 0;

        $gradeCounts = [
            'A_plus' => $rankedSites->where('grade', 'A+')->count(),
            'A' => $rankedSites->where('grade', 'A')->count(),
            'B' => $rankedSites->where('grade', 'B')->count(),
            'C' => $rankedSites->where('grade', 'C')->count(),
            'D' => $rankedSites->where('grade', 'D')->count(),
        ];

        // Top 3 Podium
        $podium = $rankedSites->take(3)->values()->all();

        // Categories list for filter dropdown
        $categories = Site::distinct()->whereNotNull('category')->pluck('category')->sort()->values()->all();

        return [
            'leaderboard' => $rankedSites,
            'summary' => [
                'total_sites' => $totalCount,
                'avg_score' => $avgScore,
                'grade_counts' => $gradeCounts,
                'podium' => $podium,
                'compliance_percentage' => $totalCount > 0 
                    ? round((($gradeCounts['A_plus'] + $gradeCounts['A'] + $gradeCounts['B']) / $totalCount) * 100, 1) 
                    : 100,
            ],
            'categories' => $categories,
        ];
    }

    /**
     * Export Scorecard / Leaderboard to CSV.
     */
    public function exportScorecard(array $filters = []): StreamedResponse
    {
        $data = $this->getLeaderboard($filters);
        $filename = 'rapor_mutu_website_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Peringkat',
            'Nama Situs / Layanan Web',
            'URL Domain',
            'Kategori Layanan',
            'Nilai Mutu (Grade)',
            'Total Skor Indeks (0-100)',
            'Poin Uptime 30 Hari (Maks 40)',
            'Poin Kepatuhan SSL & Port (Maks 30)',
            'Poin Bebas Insiden (Maks 30)',
            'Status Operasional',
            'PIC Pengelola',
            'Rekomendasi Peningkatan Mutu',
        ];

        $responseHeaders = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($headers, $data) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF)); // UTF-8 BOM
            fputcsv($handle, $headers);

            foreach ($data['leaderboard'] as $item) {
                fputcsv($handle, [
                    '#' . $item['rank'],
                    $item['name'],
                    $item['url'],
                    $item['category'],
                    $item['grade'] . ' (' . $item['grade_label'] . ')',
                    number_format($item['total_score'], 1, ',', '.'),
                    number_format($item['breakdown']['uptime']['score'], 1, ',', '.'),
                    number_format($item['breakdown']['security']['score'], 1, ',', '.'),
                    number_format($item['breakdown']['incidents']['score'], 1, ',', '.'),
                    ucfirst($item['status']),
                    $item['pic_name'],
                    $item['recommendation'],
                ]);
            }

            fclose($handle);
        }, 200, $responseHeaders);
    }
}
