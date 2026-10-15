<?php

namespace App\Services;

use App\Models\Site;
use App\Models\Incident;
use App\Models\DetectionLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VisualDefaceService
{
    /**
     * Ambang batas persentase perbedaan visual untuk memicu alarm defacement (35%).
     */
    public const DIFF_THRESHOLD_PERCENT = 35.0;

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
        ];
    }

    /**
     * Bandingkan snapshot visual terkini dengan baseline terpercaya.
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

        // Bandingkan dengan baseline
        $diffScore = 0.00;
        $isDefaced = false;

        if ($currentHash === $site->visual_baseline_hash) {
            $diffScore = 0.00;
        } else {
            // Hitung Levenshtein distance dari visual skeleton
            $baselineSnapshotPath = $site->visual_baseline_snapshot;
            $baselineSkeleton = '';

            if ($baselineSnapshotPath && Storage::disk('public')->exists($baselineSnapshotPath)) {
                $baseData = json_decode(Storage::disk('public')->get($baselineSnapshotPath), true);
                $baselineSkeleton = $baseData['skeleton_sample'] ?? '';
            }

            $currentSkeleton = substr($current['skeleton'] ?? '', 0, 255);

            if (!empty($baselineSkeleton) && !empty($currentSkeleton)) {
                $lev = levenshtein($baselineSkeleton, $currentSkeleton);
                $maxLen = max(strlen($baselineSkeleton), strlen($currentSkeleton));
                $diffScore = $maxLen > 0 ? round(($lev / $maxLen) * 100, 2) : 50.0;
            } else {
                // Hash berbeda tanpa skeleton lengkap
                $diffScore = 40.0;
            }
        }

        $site->visual_diff_score = $diffScore;
        $site->save();

        // Evaluasi ambang batas defacement
        if ($diffScore >= self::DIFF_THRESHOLD_PERCENT) {
            $isDefaced = true;

            $alertMsg = "🚨 *ALERT: INDIKASI DEFACEMENT VISUAL TERDETEKSI*\n\n" .
                "Situs: *{$site->name}* (`{$site->url}`)\n" .
                "Skor Perubahan Visual: *{$diffScore}%* (Ambang Batas: " . self::DIFF_THRESHOLD_PERCENT . "%)\n" .
                "Judul Halaman Terdeteksi: *{$current['title']}*\n" .
                "Waktu Deteksi: *" . now()->translatedFormat('d F Y, H:i:s') . " WIB*\n\n" .
                "Tindakan Darurat: Segera periksa tampilan visual halaman depan situs. Layout dan struktur visual situs berubah drastis dari baseline terpercaya!";

            NotificationService::sendAlert($alertMsg);

            // Buat Insiden Kritis jika belum ada insiden visual deface terbuka
            $existingIncident = Incident::where('site_id', $site->id)
                ->whereIn('status', ['open', 'investigating'])
                ->where('type', 'visual_deface')
                ->first();

            if (!$existingIncident) {
                Incident::create([
                    'site_id' => $site->id,
                    'title' => "Defacement Visual Terdeteksi: {$site->name} ({$diffScore}%)",
                    'type' => 'visual_deface',
                    'severity' => 'critical',
                    'status' => 'open',
                    'description' => "Struktur dan elemen visual halaman utama berubah sebesar {$diffScore}%. Kemungkinan serangan visual defacement tanpa kata kunci.",
                    'payload' => [
                        'diff_score' => $diffScore,
                        'baseline_hash' => $site->visual_baseline_hash,
                        'current_hash' => $currentHash,
                        'current_title' => $current['title'] ?? null,
                    ],
                    'detected_at' => now(),
                ]);
            }

            // Catat log deteksi
            DetectionLog::create([
                'site_id' => $site->id,
                'title' => "Visual Deface Alert: Perubahan {$diffScore}%",
                'category' => 'deface',
                'context' => "Visual skeleton diff: {$diffScore}%. Judul: '{$current['title']}'",
                'url_path' => '/',
                'status' => 'danger',
                'source' => 'Visual Snapshot Diffing Engine',
            ]);
        }

        return [
            'site_id' => $site->id,
            'name' => $site->name,
            'status' => $isDefaced ? 'defaced' : 'normal',
            'diff_score' => $diffScore,
            'is_defaced' => $isDefaced,
            'title' => $current['title'] ?? null,
            'message' => $isDefaced 
                ? "PERINGATAN: Perubahan visual sebesar {$diffScore}% melebihi batas aman!" 
                : "Tampilan visual konsisten dengan baseline ({$diffScore}% diff).",
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
