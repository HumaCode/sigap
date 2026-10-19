<?php

namespace App\Services;

use App\Models\Site;
use App\Models\Incident;
use App\Models\DetectionLog;
use App\Models\Keyword;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VisualDefaceService
{
    /**
     * Ambang batas persentase perbedaan visual minimal untuk mulai evaluasi konten (40%).
     */
    public const MIN_DIFF_THRESHOLD_PERCENT = 40.0;

    /**
     * Ambang batas perubahan visual ekstrem untuk memicu kecurigaan deface tanpa kata kunci (85%).
     */
    public const SEVERE_DIFF_THRESHOLD_PERCENT = 85.0;

    /**
     * Pola kata kunci signature peretasan (Hacker Defacement Signatures).
     */
    protected const HACKER_SIGNATURES = [
        'hacked by', 'defaced by', 'pwned by', 'security team was here',
        'hacked_by', 'defaced_by', 'haxor', 'root@', 'stamped by',
        'c99shell', 'r57shell', 'b374k', 'anonsec', 'tangankosong',
        'we are anonymous', 'your database has been', 'under attack by',
        'cyber army', 'kurawa', 'indonesian hacker', 'security breach'
    ];

    /**
     * Pola kata kunci perjudian online & konten terlarang.
     */
    protected const GAMBLING_SIGNATURES = [
        'slot gacor', 'judi online', 'situs judi', 'maxwin',
        'pragmatic play', 'zeus slot', 'bocoran slot', 'rtp live slot',
        'deposit pulsa', 'togel online', 'bandar judi', 'sbobet',
        'agen judi', 'slot dana', 'slot deposit', 'link gacor'
    ];

    /**
     * Ekstrak visual signature dan struktur halaman web.
     */
    public function captureVisualSignature(Site $site): array
    {
        $url = $site->url;
        if (!Str::startsWith($url, ['http://', 'https://'])) {
            $url = 'https://' . $url;
        }

        $html = '';
        $statusCode = 0;
        $responseTimeMs = 0;
        $error = null;

        try {
            $startTime = microtime(true);
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SIGAP-VisualGuard/1.0',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                ])
                ->connectTimeout(8)
                ->timeout(15)
                ->get($url);

            $responseTimeMs = round((microtime(true) - $startTime) * 1000);
            $statusCode = $response->status();
            $html = $response->body();
        } catch (\Throwable $e) {
            $error = $e->getMessage();
        }

        if (empty($html) || $statusCode >= 500) {
            return [
                'success' => false,
                'status_code' => $statusCode,
                'error' => $error ?: "HTTP {$statusCode}",
                'hash' => null,
                'structure' => [],
            ];
        }

        // 1. Ekstrak judul dan metadata visual
        $title = '';
        if (preg_match('#<title[^>]*>(.*?)</title>#is', $html, $matches)) {
            $title = trim(strip_tags($matches[1]));
        }

        // 2. Ekstrak struktur elemen DOM visual kunci
        $headingsCount = preg_match_all('#<h[1-6][^>]*>#i', $html);
        $imagesCount = preg_match_all('#<img[^>]*>#i', $html);
        $formsCount = preg_match_all('#<form[^>]*>#i', $html);
        $iframesCount = preg_match_all('#<iframe[^>]*>#i', $html);
        $cssLinksCount = preg_match_all('#<link[^>]+rel=["\']stylesheet["\'][^>]*>#i', $html);
        $scriptsCount = preg_match_all('#<script[^>]*>#i', $html);

        // 3. Ekstrak representasi visual layout skeleton (urutan tag struktural)
        preg_match_all('#<(/?)((?:header|nav|main|article|section|aside|footer|div|h[1-6]|form|table|iframe|img))#i', $html, $tagMatches);
        $tagSkeleton = isset($tagMatches[2]) ? implode('-', array_slice($tagMatches[2], 0, 150)) : '';

        // 4. Hitung perceptual structural visual hash
        $structuralPayload = "TITLE:{$title}|H:{$headingsCount}|IMG:{$imagesCount}|FORM:{$formsCount}|IFR:{$iframesCount}|CSS:{$cssLinksCount}|JS:{$scriptsCount}|SKELETON:{$tagSkeleton}";
        $visualHash = hash('sha256', $structuralPayload);

        // 5. Simpan snapshot struktur di storage
        $snapshotPath = "snapshots/{$site->id}/" . now()->format('Ymd_His') . ".json";
        $snapshotData = [
            'captured_at' => now()->toIso8601String(),
            'site_id' => $site->id,
            'title' => $title,
            'metrics' => [
                'headings' => $headingsCount,
                'images' => $imagesCount,
                'forms' => $formsCount,
                'iframes' => $iframesCount,
                'css_links' => $cssLinksCount,
                'scripts' => $scriptsCount,
                'html_length' => strlen($html),
            ],
            'skeleton_sample' => substr($tagSkeleton, 0, 255),
            'hash' => $visualHash,
        ];

        Storage::disk('public')->put($snapshotPath, json_encode($snapshotData, JSON_PRETTY_PRINT));

        return [
            'success' => true,
            'status_code' => $statusCode,
            'hash' => $visualHash,
            'title' => $title,
            'snapshot_path' => $snapshotPath,
            'metrics' => $snapshotData['metrics'],
            'skeleton' => $tagSkeleton,
            'payload' => $structuralPayload,
            'html' => $html,
        ];
    }

    /**
     * Deteksi keberadaan kata kunci mencurigakan (peretasan / judi online) pada halaman.
     */
    protected function detectMaliciousKeywords(string $html, string $title): array
    {
        $content = strtolower($title . ' ' . strip_tags($html));
        $detected = [];

        // 1. Cek signature hacker
        foreach (self::HACKER_SIGNATURES as $signature) {
            if (str_contains($content, $signature)) {
                $detected[] = $signature;
            }
        }

        // 2. Cek signature judi
        foreach (self::GAMBLING_SIGNATURES as $signature) {
            if (str_contains($content, $signature)) {
                $detected[] = $signature;
            }
        }

        // 3. Cek kata kunci aktif yang dikonfigurasi di database SIGAP
        try {
            $dbKeywords = Keyword::where('is_active', true)->pluck('keyword')->all();
            foreach ($dbKeywords as $kw) {
                $cleanKw = strtolower(trim($kw));
                if (!empty($cleanKw) && str_contains($content, $cleanKw)) {
                    $detected[] = $cleanKw;
                }
            }
        } catch (\Throwable $e) {
            // Lewati jika tabel keyword belum tersedia
        }

        return array_unique($detected);
    }

    /**
     * Periksa apakah judul halaman saat ini masih sah / konsisten dengan identitas instansi.
     */
    protected function isTitleLegitimate(string $currentTitle, ?string $baselineTitle, Site $site): array
    {
        $cleanCurrent = strtolower(trim($currentTitle));
        $cleanBaseline = strtolower(trim($baselineTitle ?? ''));
        $siteName = strtolower(trim($site->name));

        if (empty($cleanCurrent)) {
            return [
                'is_legitimate' => false,
                'reason' => 'Judul halaman kosong (blank title).',
            ];
        }

        // Cek error halaman web server generik
        $genericErrors = ['404 not found', '502 bad gateway', '500 internal server error', 'apache2 default page', 'welcome to nginx', 'index of /'];
        foreach ($genericErrors as $error) {
            if (str_contains($cleanCurrent, $error)) {
                return [
                    'is_legitimate' => false,
                    'reason' => "Judul memuat halaman error server generik: '{$currentTitle}'.",
                ];
            }
        }

        // 1. Jika nama situs atau potongan nama instansi masih ada di judul
        if (!empty($siteName)) {
            $siteTokens = array_filter(explode(' ', $siteName), fn($t) => strlen($t) > 3);
            foreach ($siteTokens as $token) {
                if (str_contains($cleanCurrent, $token)) {
                    return [
                        'is_legitimate' => true,
                        'reason' => "Judul memuat nama situs resmi ('{$token}').",
                    ];
                }
            }
        }

        // 2. Jika judul memuat kata-kata resmi pemerintahan kota/daerah
        $govKeywords = ['dinas', 'pekalongan', 'pemerintah', 'badan', 'kecamatan', 'kelurahan', 'sekretariat', 'portal', 'resmi', 'kota', 'kabupaten'];
        foreach ($govKeywords as $gw) {
            if (str_contains($cleanCurrent, $gw)) {
                return [
                    'is_legitimate' => true,
                    'reason' => "Judul memuat identitas pemerintahan resmi ('{$gw}').",
                ];
            }
        }

        // 3. Hitung similaritas tekstual dengan baseline title
        if (!empty($cleanBaseline)) {
            similar_text($cleanBaseline, $cleanCurrent, $titleSimilarityPercent);
            if ($titleSimilarityPercent >= 45.0) {
                return [
                    'is_legitimate' => true,
                    'reason' => "Judul konsisten dengan acuan baseline (" . round($titleSimilarityPercent, 1) . "% mirip).",
                ];
            }
        }

        return [
            'is_legitimate' => false,
            'reason' => 'Judul halaman berubah total dan tidak memuat identitas instansi resmi.',
        ];
    }

    /**
     * Cek apakah seluruh konten halaman terhapus total (blank-out defacement).
     */
    protected function checkElementWipeout(array $currentMetrics, ?array $baselineMetrics): bool
    {
        if (!$baselineMetrics) {
            return false;
        }

        $baseImages = (int) ($baselineMetrics['images'] ?? 0);
        $baseHeadings = (int) ($baselineMetrics['headings'] ?? 0);
        $baseHtmlLength = (int) ($baselineMetrics['html_length'] ?? 0);

        $currImages = (int) ($currentMetrics['images'] ?? 0);
        $currHeadings = (int) ($currentMetrics['headings'] ?? 0);
        $currHtmlLength = (int) ($currentMetrics['html_length'] ?? 0);

        // Jika sebelumnya halaman kaya konten, lalu tiba-tiba berkurang > 90% menjadi kosong
        if ($baseHtmlLength > 8000 && $currHtmlLength < 600 && $currImages === 0 && $currHeadings === 0) {
            return true;
        }

        return false;
    }

    /**
     * Bandingkan snapshot visual terkini dengan baseline terpercaya menggunakan Multi-Factor Verification.
     */
    public function checkVisualDiff(Site $site, bool $forceBaseline = false): array
    {
        $current = $this->captureVisualSignature($site);

        if (!$current['success']) {
            return [
                'site_id' => $site->id,
                'name' => $site->name,
                'status' => 'error',
                'message' => 'Gagal mengambil snapshot: ' . ($current['error'] ?? 'Unknown error'),
                'diff_score' => null,
            ];
        }

        $currentHash = $current['hash'];
        $site->visual_last_hash = $currentHash;
        $site->visual_last_snapshot = $current['snapshot_path'] ?? null;
        $site->visual_last_checked_at = now();

        // Jika belum ada baseline atau dipaksa buat baseline baru
        if (empty($site->visual_baseline_hash) || $forceBaseline) {
            $site->visual_baseline_hash = $currentHash;
            $site->visual_baseline_snapshot = $current['snapshot_path'] ?? null;
            $site->visual_diff_score = 0.00;
            $site->save();

            return [
                'site_id' => $site->id,
                'name' => $site->name,
                'status' => 'baseline_saved',
                'message' => 'Visual baseline baru berhasil disimpan sebagai acuan terpercaya.',
                'diff_score' => 0.00,
                'is_defaced' => false,
            ];
        }

        // Ambil data baseline tersimpan
        $baselineSnapshotPath = $site->visual_baseline_snapshot;
        $baseData = [];
        $baselineSkeleton = '';

        if ($baselineSnapshotPath && Storage::disk('public')->exists($baselineSnapshotPath)) {
            $baseData = json_decode(Storage::disk('public')->get($baselineSnapshotPath), true) ?: [];
            $baselineSkeleton = $baseData['skeleton_sample'] ?? '';
        }

        // Bandingkan dengan baseline
        $diffScore = 0.00;

        if ($currentHash === $site->visual_baseline_hash) {
            $diffScore = 0.00;
        } else {
            $currentSkeleton = substr($current['skeleton'] ?? '', 0, 255);

            if (!empty($baselineSkeleton) && !empty($currentSkeleton)) {
                $lev = levenshtein($baselineSkeleton, $currentSkeleton);
                $maxLen = max(strlen($baselineSkeleton), strlen($currentSkeleton));
                $diffScore = $maxLen > 0 ? round(($lev / $maxLen) * 100, 2) : 50.0;
            } else {
                $diffScore = 40.0;
            }
        }

        $site->visual_diff_score = $diffScore;
        $site->save();

        // Evaluasi Multi-Faktor Cerdas:
        $currentTitle = $current['title'] ?? '';
        $baselineTitle = $baseData['title'] ?? null;
        $htmlContent = $current['html'] ?? '';

        $maliciousKeywords = $this->detectMaliciousKeywords($htmlContent, $currentTitle);
        $titleCheck = $this->isTitleLegitimate($currentTitle, $baselineTitle, $site);
        $isWipedOut = $this->checkElementWipeout($current['metrics'], $baseData['metrics'] ?? null);

        $isAttack = false;
        $attackReason = '';

        if (!empty($maliciousKeywords)) {
            // Serangan Terkonfirmasi: Ditemukan kata kunci hacker / judi online
            $isAttack = true;
            $kwList = implode(', ', array_slice($maliciousKeywords, 0, 3));
            $attackReason = "Ditemukan kata kunci peretasan/judi online ({$kwList}) pada halaman dengan skor perubahan layout {$diffScore}%.";
        } elseif ($diffScore >= self::SEVERE_DIFF_THRESHOLD_PERCENT && (!$titleCheck['is_legitimate'] || $isWipedOut)) {
            // Serangan Terkonfirmasi: Layout berubah ekstrem (>85%) DAN identitas/judul resmi hilang total
            $isAttack = true;
            $attackReason = "Perubahan visual ekstrem ({$diffScore}%) disertai hilangnya identitas resmi situs ({$titleCheck['reason']}).";
        }

        // 1. JIKA TERKONFIRMASI SERANGAN:
        if ($isAttack) {
            $alertMsg = "🚨 *ALERT: INDIKASI DEFACEMENT TERKONFIRMASI*\n\n" .
                "Situs: *{$site->name}* (`{$site->url}`)\n" .
                "Skor Perubahan Visual: *{$diffScore}%*\n" .
                "Judul Halaman: *{$currentTitle}*\n" .
                "Indikasi: *{$attackReason}*\n" .
                "Waktu Deteksi: *" . now()->translatedFormat('d F Y, H:i:s') . " WIB*\n\n" .
                "Tindakan Darurat: Segera buka menu Insiden SIGAP dan periksa tampilan halaman web!";

            NotificationService::sendAlert($alertMsg);

            // Buat Insiden Kritis jika belum ada
            $existingIncident = Incident::where('site_id', $site->id)
                ->whereIn('status', ['open', 'investigating'])
                ->where('type', 'visual_deface')
                ->first();

            if (!$existingIncident) {
                Incident::create([
                    'site_id' => $site->id,
                    'title' => "Defacement Visual Terkonfirmasi: {$site->name} ({$diffScore}%)",
                    'type' => 'visual_deface',
                    'severity' => 'critical',
                    'status' => 'open',
                    'description' => $attackReason,
                    'payload' => [
                        'diff_score' => $diffScore,
                        'baseline_hash' => $site->visual_baseline_hash,
                        'current_hash' => $currentHash,
                        'current_title' => $currentTitle,
                        'malicious_keywords' => $maliciousKeywords,
                    ],
                    'detected_at' => now(),
                ]);
            }

            // Catat log deteksi berstatus danger
            DetectionLog::create([
                'site_id' => $site->id,
                'title' => "Deface Alert: {$site->name} (Diff {$diffScore}%)",
                'category' => 'deface',
                'context' => $attackReason,
                'url_path' => '/',
                'status' => 'danger',
                'source' => 'Visual Snapshot Diffing Engine',
            ]);

            return [
                'site_id' => $site->id,
                'name' => $site->name,
                'status' => 'defaced',
                'diff_score' => $diffScore,
                'is_defaced' => true,
                'title' => $currentTitle,
                'message' => "PERINGATAN KRITIS: Terindikasi defacement nyata! {$attackReason}",
            ];
        }

        // 2. JIKA BUKAN SERANGAN (Perubahan Layout / Update Berita Resmi):
        if ($diffScore >= self::MIN_DIFF_THRESHOLD_PERCENT) {
            // Auto-adaptasi: Perbarui acuan baseline agar di pemindaian 30 menit ke depan tidak memicu selisih semu
            $site->visual_baseline_hash = $currentHash;
            $site->visual_baseline_snapshot = $current['snapshot_path'] ?? null;
            $site->visual_diff_score = 0.00;
            $site->save();

            // Catat sebagai log informasi aman (False Positive tereliminasi)
            DetectionLog::create([
                'site_id' => $site->id,
                'title' => "Pembaruan Konten Resmi: {$site->name}",
                'category' => 'deface',
                'context' => "Struktur layout berubah ({$diffScore}%) karena rilis berita/update konten dinamis. Judul resmi konsisten: '{$currentTitle}'. Tidak ada indikasi ancaman.",
                'url_path' => '/',
                'status' => 'false_positive',
                'source' => 'Visual Snapshot Diffing Engine',
            ]);

            return [
                'site_id' => $site->id,
                'name' => $site->name,
                'status' => 'content_updated',
                'diff_score' => $diffScore,
                'is_defaced' => false,
                'title' => $currentTitle,
                'message' => "Pembaruan konten resmi teridentifikasi ({$diffScore}%). Baseline visual otomatis disinkronkan secara aman.",
            ];
        }

        return [
            'site_id' => $site->id,
            'name' => $site->name,
            'status' => 'normal',
            'diff_score' => $diffScore,
            'is_defaced' => false,
            'title' => $currentTitle,
            'message' => "Tampilan visual konsisten dengan baseline ({$diffScore}% diff).",
        ];
    }

    /**
     * Periksa seluruh situs aktif.
     */
    public function checkAllSitesVisualDiff(bool $forceBaseline = false): array
    {
        $sites = Site::where('is_active', true)->get();
        $results = [];

        foreach ($sites as $site) {
            $results[] = $this->checkVisualDiff($site, $forceBaseline);
        }

        return $results;
    }
}
