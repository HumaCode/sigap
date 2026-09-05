<?php

namespace App\Services;

use App\Models\Site;
use App\Models\Incident;
use App\Models\DetectionLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UptimeCheckService
{
    private function getRandomHeaders(): array
    {
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        ];

        return [
            'User-Agent' => $userAgents[array_rand($userAgents)],
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cache-Control' => 'no-cache',
            'Pragma' => 'no-cache',
        ];
    }

    /**
     * Perform HTTP Health Check for a single site and update its status.
     */
    public function checkSite(Site $site): array
    {
        $url = $site->url;
        if (!Str::startsWith($url, ['http://', 'https://'])) {
            $url = 'https://' . $url;
        }

        $startTime = microtime(true);
        $status = 'down';
        $statusCode = 0;
        $responseTimeMs = 0;
        $errorMessage = null;

        try {
            $response = Http::withoutVerifying()
                ->withHeaders($this->getRandomHeaders())
                ->timeout(10)
                ->get($url);

            $responseTimeMs = round((microtime(true) - $startTime) * 1000);
            $statusCode = $response->status();

            // Consider 2xx and 3xx as UP, 4xx/5xx as DOWN or WARN
            if ($response->successful() || $response->redirect()) {
                $status = 'up';
            } else {
                $status = 'down';
                $errorMessage = "HTTP Status Code {$statusCode}";
            }
        } catch (\Exception $e) {
            $responseTimeMs = round((microtime(true) - $startTime) * 1000);
            $status = 'down';
            $errorMessage = $e->getMessage();
        }

        $oldStatus = $site->status;
        $site->status = $status;

        // Calculate / simulate request volume (RPM)
        // Standard normal: 60-350 req/mnt, Warn: 800-1800 req/mnt, Down/Offline: 0 req/mnt
        $rpm = match($status) {
            'up' => rand(60, 320),
            'warn' => rand(850, 1850),
            'down' => 0,
            default => 0
        };
        $site->requests_per_minute = $rpm;
        $site->save();

        // Create incident if site just went DOWN or is DOWN with HTTP 502/500
        if ($status === 'down') {
            $existingOpenIncident = Incident::where('site_id', $site->id)
                ->where('status', 'investigating')
                ->where('type', 'uptime')
                ->first();

            if (!$existingOpenIncident) {
                $title = "Situs Offline ({$statusCode}): " . ($errorMessage ?? '502 Bad Gateway');
                Incident::create([
                    'site_id' => $site->id,
                    'title' => "Situs Down: {$site->name}",
                    'type' => 'down',
                    'severity' => ($statusCode >= 500 || $statusCode === 0) ? 'critical' : 'high',
                    'status' => 'open',
                    'description' => "Permintaan HTTP ke {$url} gagal dengan respon: " . ($errorMessage ?? "Status Code {$statusCode}"),
                    'payload' => [
                        'url' => $url,
                        'status_code' => $statusCode,
                        'response_time_ms' => $responseTimeMs,
                        'error' => $errorMessage
                    ],
                    'detected_at' => now(),
                ]);

                // Send Alert Notification
                NotificationService::sendAlert(
                    "🔴 *ALERT: SITUS DOWN*\n" .
                    "Situs: *{$site->name}* ({$site->url})\n" .
                    "Status Respon: *{$statusCode} " . ($errorMessage ?? 'Down') . "*\n" .
                    "Waktu Respon: {$responseTimeMs} ms\n" .
                    "Waktu Deteksi: " . now()->format('Y-m-d H:i:s')
                );
            }
        } elseif ($status === 'up' && $oldStatus === 'down') {
            // Resolve previous incidents automatically
            Incident::where('site_id', $site->id)
                ->where('status', 'investigating')
                ->where('type', 'uptime')
                ->update(['status' => 'resolved']);

            NotificationService::sendAlert(
                "🟢 *RECOVERY: SITUS KEMBALI ONLINE*\n" .
                "Situs: *{$site->name}* ({$site->url})\n" .
                "Waktu Respon: {$responseTimeMs} ms\n" .
                "Status: HTTP {$statusCode} Normal"
            );
        }

        // Log detection history
        DetectionLog::create([
            'site_id' => $site->id,
            'title' => "Uptime Check: HTTP {$statusCode}",
            'category' => 'uptime',
            'context' => "Respon: {$statusCode} | Latensi: {$responseTimeMs}ms" . ($errorMessage ? " | Err: {$errorMessage}" : ""),
            'url_path' => $url,
            'status' => $status === 'up' ? 'resolved' : 'detected',
            'source' => 'HTTP HealthCheck Engine',
        ]);

        return [
            'site_id' => $site->id,
            'url' => $url,
            'status' => $status,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTimeMs,
            'error' => $errorMessage,
        ];
    }

    /**
     * Check all active sites.
     */
    public function checkAllSites(): array
    {
        $sites = Site::where('is_active', true)->get();
        $results = [];

        foreach ($sites as $site) {
            $results[] = $this->checkSite($site);
        }

        return $results;
    }
}
