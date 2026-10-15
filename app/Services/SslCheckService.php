<?php

namespace App\Services;

use App\Models\Site;
use App\Models\Incident;
use App\Models\DetectionLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SslCheckService
{
    /**
     * Inspect and record SSL certificate health for a single site.
     */
    public function checkSiteSsl(Site $site, bool $forceAlert = false): array
    {
        $url = $site->url;
        $parsed = parse_url($url);
        $host = $parsed['host'] ?? $url;

        // Strip protocol/path if host is empty
        if (empty($parsed['host'])) {
            $host = preg_replace('#^https?://#', '', rtrim($url, '/'));
            $host = explode('/', $host)[0];
        }
        $host = explode(':', $host)[0];

        $sslStatus = 'unknown';
        $issuer = null;
        $validTo = null;
        $validFrom = null;
        $daysLeft = null;
        $subjectCn = null;
        $errorMessage = null;

        try {
            $context = stream_context_create([
                "ssl" => [
                    "capture_peer_cert" => true,
                    "verify_peer" => false,
                    "verify_peer_name" => false,
                ]
            ]);

            $client = @stream_socket_client(
                "ssl://{$host}:443",
                $errno,
                $errstr,
                8,
                STREAM_CLIENT_CONNECT,
                $context
            );

            if ($client) {
                $params = stream_context_get_params($client);
                fclose($client);

                if (!empty($params["options"]["ssl"]["peer_certificate"])) {
                    $cert = @openssl_x509_parse($params["options"]["ssl"]["peer_certificate"]);

                    if ($cert && isset($cert['validTo_time_t'])) {
                        $validToTimestamp = $cert['validTo_time_t'];
                        $validFromTimestamp = $cert['validFrom_time_t'] ?? null;

                        $validTo = Carbon::createFromTimestamp($validToTimestamp);
                        $validFrom = $validFromTimestamp ? Carbon::createFromTimestamp($validFromTimestamp) : null;
                        $daysLeft = (int) round(($validToTimestamp - time()) / 86400);

                        // Extract Issuer details
                        $issuer = $cert['issuer']['O'] ?? $cert['issuer']['CN'] ?? 'Unknown CA';
                        $subjectCn = $cert['subject']['CN'] ?? $host;

                        // Check self-signed
                        $isSelfSigned = isset($cert['issuer']['CN'], $cert['subject']['CN']) && $cert['issuer']['CN'] === $cert['subject']['CN'];

                        if ($daysLeft < 0) {
                            $sslStatus = 'expired';
                        } elseif ($daysLeft <= 30) {
                            $sslStatus = 'expiring';
                        } elseif ($isSelfSigned) {
                            $sslStatus = 'self_signed';
                        } else {
                            $sslStatus = 'valid';
                        }
                    } else {
                        $sslStatus = 'invalid';
                        $errorMessage = "Gagal membedah x509 certificate data.";
                    }
                } else {
                    $sslStatus = 'invalid';
                    $errorMessage = "Peer certificate tidak ditemukan pada port 443.";
                }
            } else {
                $sslStatus = 'invalid';
                $errorMessage = "Gagal terhubung ke port 443 ({$errstr} - code {$errno})";
            }
        } catch (\Throwable $e) {
            $sslStatus = 'invalid';
            $errorMessage = $e->getMessage();
        }

        // Update site model
        $site->ssl_status = $sslStatus;
        $site->ssl_issuer = $issuer;
        $site->ssl_valid_to = $validTo;
        $site->ssl_days_left = $daysLeft;
        $site->ssl_last_checked_at = now();

        // Determine Milestone: 0 (expired), 1 (H-1), 7 (H-7), 14 (H-14), 30 (H-30)
        $milestoneTier = null;
        if ($daysLeft !== null) {
            if ($daysLeft <= 0) {
                $milestoneTier = 0;
            } elseif ($daysLeft <= 1) {
                $milestoneTier = 1;
            } elseif ($daysLeft <= 7) {
                $milestoneTier = 7;
            } elseif ($daysLeft <= 14) {
                $milestoneTier = 14;
            } elseif ($daysLeft <= 30) {
                $milestoneTier = 30;
            }
        }

        // Send Milestone Notification if threshold reached and not sent yet
        $shouldSendAlert = $forceAlert || (
            $milestoneTier !== null && 
            $site->ssl_alert_sent_milestone !== $milestoneTier
        );

        if ($shouldSendAlert && in_array($sslStatus, ['expiring', 'expired'])) {
            $site->ssl_alert_sent_milestone = $milestoneTier;

            $statusIcon = $sslStatus === 'expired' ? '🚨' : ($milestoneTier <= 7 ? '⚠️' : 'ℹ️');
            $statusLabel = $sslStatus === 'expired' 
                ? "*TELAH KEDALUWARSA*" 
                : "*Akan Kedaluwarsa dalam {$daysLeft} Hari (H-{$milestoneTier})*";
            $validToFormatted = $validTo ? $validTo->translatedFormat('d F Y, H:i') . ' WIB' : '-';

            $alertMessage = "{$statusIcon} *PERINGATAN SERTIFIKAT SSL WEBSITE*\n\n" .
                "Situs: *{$site->name}* (`{$site->url}`)\n" .
                "Penerbit SSL: *{$issuer}*\n" .
                "Status: {$statusLabel}\n" .
                "Kedaluwarsa Pada: *{$validToFormatted}*\n\n" .
                "Tindakan: Segera perbarui sertifikat SSL domain untuk mencegah browser menandai website sebagai 'Tidak Aman / Insecure Connection'.";

            NotificationService::sendAlert($alertMessage);

            // Create Incident if critical threshold (H-7, H-1, or Expired)
            if ($milestoneTier !== null && $milestoneTier <= 7) {
                $existingIncident = Incident::where('site_id', $site->id)
                    ->whereIn('status', ['open', 'investigating'])
                    ->where('type', 'ssl')
                    ->first();

                if (!$existingIncident) {
                    Incident::create([
                        'site_id' => $site->id,
                        'title' => $sslStatus === 'expired' 
                            ? "Sertifikat SSL Kedaluwarsa: {$site->name}" 
                            : "SSL Mendekati Kedaluwarsa (H-{$daysLeft}): {$site->name}",
                        'type' => 'ssl',
                        'severity' => $milestoneTier <= 1 ? 'critical' : 'high',
                        'status' => 'open',
                        'description' => "Sertifikat SSL situs {$site->name} ({$issuer}) berakhir pada {$validToFormatted}. Sisa masa aktif: {$daysLeft} hari.",
                        'payload' => [
                            'host' => $host,
                            'issuer' => $issuer,
                            'valid_to' => $validTo ? $validTo->toIso8601String() : null,
                            'days_left' => $daysLeft,
                        ],
                        'detected_at' => now(),
                    ]);
                }
            }
        } elseif ($sslStatus === 'valid' && $site->ssl_alert_sent_milestone !== null) {
            // Reset milestone tier once renewed
            $site->ssl_alert_sent_milestone = null;

            // Auto-resolve any open SSL incidents
            Incident::where('site_id', $site->id)
                ->whereIn('status', ['open', 'investigating'])
                ->where('type', 'ssl')
                ->update(['status' => 'resolved']);
        }

        $site->save();

        // Record detection log
        DetectionLog::create([
            'site_id' => $site->id,
            'title' => "SSL Check: " . strtoupper($sslStatus) . ($daysLeft !== null ? " ({$daysLeft} hari)" : ""),
            'category' => 'ssl',
            'context' => "Penerbit: " . ($issuer ?? 'N/A') . " | Status: {$sslStatus}" . ($daysLeft !== null ? " | Sisa: {$daysLeft} hari" : "") . ($errorMessage ? " | Err: {$errorMessage}" : ""),
            'url_path' => "https://{$host}:443",
            'status' => $sslStatus === 'valid' ? 'resolved' : 'detected',
            'source' => 'SSL Health Tracker Engine',
        ]);

        return [
            'site_id' => $site->id,
            'name' => $site->name,
            'host' => $host,
            'status' => $sslStatus,
            'issuer' => $issuer,
            'valid_to' => $validTo,
            'days_left' => $daysLeft,
            'error' => $errorMessage,
        ];
    }

    /**
     * Check all active sites.
     */
    public function checkAllSitesSsl(bool $forceAlert = false): array
    {
        $sites = Site::where('is_active', true)->get();
        $results = [];

        foreach ($sites as $site) {
            $results[] = $this->checkSiteSsl($site, $forceAlert);
        }

        return $results;
    }
}
