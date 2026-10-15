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
     * Process and record the result of an uptime check for a site.
     */
    public function processCheckResult(Site $site, string $url, int $statusCode, int $responseTimeMs, ?string $errorMessage = null): array
    {
        // Consider 2xx and 3xx as UP, 4xx/5xx/0 as DOWN
        $isSuccessful = ($statusCode >= 200 && $statusCode < 400);
        $status = $isSuccessful ? 'up' : 'down';

        if (!$isSuccessful && empty($errorMessage)) {
            $errorMessage = $statusCode > 0 ? "HTTP Status Code {$statusCode}" : "Connection Timeout / Unreachable";
        }

        $oldStatus = $site->status;
        $site->status = $status;

        // Calculate simulated request volume (RPM)
        $rpm = match($status) {
            'up' => rand(60, 320),
            'warn' => rand(850, 1850),
            'down' => 0,
            default => 0
        };
        $site->requests_per_minute = $rpm;
        $site->save();

        // Create incident if site went DOWN
        if ($status === 'down') {
            $existingOpenIncident = Incident::where('site_id', $site->id)
                ->whereIn('status', ['open', 'investigating', 'acknowledged'])
                ->whereIn('type', ['down', 'uptime'])
                ->first();

            if (!$existingOpenIncident) {
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
                $formattedTime = now()->translatedFormat('d F Y, H:i:s') . ' WIB';
                NotificationService::sendAlert(
                    "🔴 *ALERT: SITUS DOWN*\n\n" .
                    "Situs: *{$site->name}* (`{$site->url}`)\n" .
                    "Status Respon: *{$statusCode} " . ($errorMessage ?? 'Down') . "*\n" .
                    "Waktu Respon: *{$responseTimeMs} ms*\n" .
                    "Waktu Deteksi: *{$formattedTime}*"
                );
            }
        } elseif ($status === 'up' && $oldStatus === 'down') {
            // Resolve previous incidents automatically
            Incident::where('site_id', $site->id)
                ->whereIn('status', ['open', 'investigating', 'acknowledged'])
                ->whereIn('type', ['down', 'uptime'])
                ->update(['status' => 'resolved']);

            $formattedRecoveryTime = now()->translatedFormat('d F Y, H:i:s') . ' WIB';
            NotificationService::sendAlert(
                "🟢 *RECOVERY: SITUS KEMBALI ONLINE*\n\n" .
                "Situs: *{$site->name}* (`{$site->url}`)\n" .
                "Status: *HTTP {$statusCode} Normal*\n" .
                "Waktu Respon: *{$responseTimeMs} ms*\n" .
                "Waktu Pemulihan: *{$formattedRecoveryTime}*"
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
            'source' => 'HTTP HealthCheck Engine (Concurrent)',
        ]);

        return [
            'site_id' => $site->id,
            'name' => $site->name,
            'url' => $url,
            'status' => $status,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTimeMs,
            'error' => $errorMessage,
        ];
    }

    /**
     * Perform HTTP Health Check for a single site synchronously.
     */
    public function checkSite(Site $site): array
    {
        $url = $site->url;
        if (!Str::startsWith($url, ['http://', 'https://'])) {
            $url = 'https://' . $url;
        }

        $startTime = microtime(true);
        $statusCode = 0;
        $responseTimeMs = 0;
        $errorMessage = null;

        try {
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                ])
                ->connectTimeout(10)
                ->timeout(20)
                ->get($url);

            $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);
            $statusCode = $response->status();
        } catch (\Exception $e) {
            $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);
            $errorMessage = $e->getMessage();
        }

        return $this->processCheckResult($site, $url, $statusCode, $responseTimeMs, $errorMessage);
    }

    /**
     * Check all active sites concurrently in parallel using Http::pool.
     * Batches requests in chunks of 20 to avoid socket exhaustion.
     */
    public function checkAllSites(int $chunkSize = 20): array
    {
        $sites = Site::where('is_active', true)->get();
        if ($sites->isEmpty()) {
            return [];
        }

        $results = [];

        // Chunk sites to prevent socket exhaustion on large site counts
        foreach ($sites->chunk($chunkSize) as $chunk) {
            $siteMap = [];
            $startTimes = [];

            $responses = Http::pool(function (\Illuminate\Http\Client\Pool $pool) use ($chunk, &$siteMap, &$startTimes) {
                foreach ($chunk as $site) {
                    $url = $site->url;
                    if (!Str::startsWith($url, ['http://', 'https://'])) {
                        $url = 'https://' . $url;
                    }

                    $siteMap[$site->id] = [
                        'site' => $site,
                        'url' => $url,
                    ];
                    $startTimes[$site->id] = microtime(true);

                    $pool->as($site->id)
                        ->withoutVerifying()
                        ->withHeaders([
                            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                        ])
                        ->connectTimeout(10)
                        ->timeout(20)
                        ->get($url);
                }
            });

            // Process results of the pool
            foreach ($responses as $siteId => $response) {
                $siteData = $siteMap[$siteId] ?? null;
                if (!$siteData) continue;

                $site = $siteData['site'];
                $url = $siteData['url'];
                $startTime = $startTimes[$siteId] ?? microtime(true);
                $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);

                if ($response instanceof \Illuminate\Http\Client\Response) {
                    $statusCode = $response->status();
                    $errorMessage = $response->successful() || $response->redirect() ? null : "HTTP Status {$statusCode}";
                } elseif ($response instanceof \Exception) {
                    $statusCode = 0;
                    $errorMessage = $response->getMessage();
                } else {
                    $statusCode = 0;
                    $errorMessage = "Request failed / Unreachable";
                }

                $results[] = $this->processCheckResult($site, $url, $statusCode, $responseTimeMs, $errorMessage);
            }
        }

        return $results;
    }
}
