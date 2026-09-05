<?php

namespace App\Observers;

use App\Models\DetectionLog;
use App\Models\Keyword;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DetectionLogObserver
{
    /**
     * Handle the DetectionLog "created" event.
     */
    public function created(DetectionLog $detectionLog): void
    {
        // Skip routine HTTP health check logs
        if ($detectionLog->category === 'uptime') {
            return;
        }

        $extractedKeyword = $this->extractKeyword($detectionLog);

        if (empty($extractedKeyword)) {
            return;
        }

        // DB Transaction with commit and rollback for database safety
        DB::beginTransaction();
        try {
            // Case-insensitive check if keyword already exists
            $exists = Keyword::whereRaw('LOWER(keyword) = ?', [mb_strtolower($extractedKeyword)])->exists();

            if (!$exists) {
                Keyword::create([
                    'keyword'     => $extractedKeyword,
                    'category'    => $detectionLog->category ?: 'lainnya',
                    'type'        => 'plain',
                    'is_active'   => true,
                    'description' => 'Otomatis terdaftar dari Log Deteksi: "' . $detectionLog->title . '"',
                ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Gagal menyinkronkan kata kunci dari DetectionLog: ' . $e->getMessage(), [
                'detection_log_id' => $detectionLog->id,
                'keyword'          => $extractedKeyword,
            ]);
        }
    }

    /**
     * Extract keyword from DetectionLog title or HTML context markup.
     */
    private function extractKeyword(DetectionLog $log): ?string
    {
        // 1. Check if <mark>keyword</mark> exists in context HTML
        if (preg_match('/<mark>(.*?)<\/mark>/is', $log->context, $matches)) {
            $kw = trim(strip_tags($matches[1]));
            if (!empty($kw)) {
                return $kw;
            }
        }

        // 2. Check quotes in title, e.g. Kata kunci "slot gacor" terdeteksi
        if (preg_match('/"([^"]+)"/', $log->title, $matches)) {
            $kw = trim($matches[1]);
            if (!empty($kw)) {
                return $kw;
            }
        }

        // 3. Fallback for title
        if (!empty($log->title) && str_contains(strtolower($log->title), 'terdeteksi')) {
            $cleanTitle = str_ireplace(['Kata kunci', 'terdeteksi', 'pada teks tersembunyi', 'saat pemindaian keamanan'], '', $log->title);
            $kw = trim($cleanTitle);
            if (!empty($kw) && strlen($kw) >= 3) {
                return $kw;
            }
        }

        return null;
    }
}
