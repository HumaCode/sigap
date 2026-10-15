<?php

namespace App\Services;

use App\Models\Site;
use App\Models\Incident;
use App\Models\DetectionLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DomainHealthService
{
    /**
     * Extract apex/registrable domain from a URL or hostname.
     * E.g. 'https://sicanting.pekalongankota.go.id/app' -> 'pekalongankota.go.id'
     * E.g. 'https://sub.example.com' -> 'example.com'
     */
    public function extractApexDomain(string $url): string
    {
        $parsed = parse_url($url);
        $host = strtolower($parsed['host'] ?? $url);
        $host = preg_replace('#^https?://#', '', rtrim($host, '/'));
        $host = explode('/', $host)[0];
        $host = explode(':', $host)[0];

        $parts = explode('.', $host);
        $count = count($parts);

        if ($count <= 2) {
            return $host;
        }

        // Handle second-level domains common in Indonesia: .go.id, .ac.id, .co.id, .desa.id, .mil.id, etc.
        $knownSlds = ['go.id', 'ac.id', 'co.id', 'or.id', 'web.id', 'sch.id', 'mil.id', 'desa.id', 'net.id'];
        $lastTwo = $parts[$count - 2] . '.' . $parts[$count - 1];

        if (in_array($lastTwo, $knownSlds, true) && $count >= 3) {
            return $parts[$count - 3] . '.' . $lastTwo;
        }

        // Generic fallback (.com, .net, .org, etc.)
        return $parts[$count - 2] . '.' . $parts[$count - 1];
    }

    protected array $dnsCache = [];
    protected array $whoisCache = [];

    /**
     * Check DNS records and detect potential Name Server hijacking.
     */
    public function checkDnsHealth(Site $site, string $domain): array
    {
        $currentNs = [];
        $currentA = [];
        $hasAnomaly = false;
        $oldNs = $site->dns_name_servers ?: [];

        try {
            if (isset($this->dnsCache[$domain])) {
                $currentNs = $this->dnsCache[$domain]['ns'];
                $currentA = $this->dnsCache[$domain]['a'];
            } else {
                // 1. Fetch NS records
                $nsRecords = @dns_get_record($domain, DNS_NS);
                if (is_array($nsRecords)) {
                    foreach ($nsRecords as $record) {
                        if (!empty($record['target'])) {
                            $currentNs[] = strtolower(rtrim($record['target'], '.'));
                        }
                    }
                }
                sort($currentNs);

                // 2. Fetch A records
                $aRecords = @dns_get_record($domain, DNS_A);
                if (is_array($aRecords)) {
                    foreach ($aRecords as $record) {
                        if (!empty($record['ip'])) {
                            $currentA[] = $record['ip'];
                        }
                    }
                }

                $this->dnsCache[$domain] = [
                    'ns' => $currentNs,
                    'a' => $currentA,
                ];
            }
            sort($currentA);

            // Detect NS Anomaly if previously recorded and not empty
            if (!empty($oldNs) && !empty($currentNs)) {
                $diff1 = array_diff($oldNs, $currentNs);
                $diff2 = array_diff($currentNs, $oldNs);

                if (!empty($diff1) || !empty($diff2)) {
                    $hasAnomaly = true;

                    $oldStr = implode(', ', $oldNs);
                    $newStr = implode(', ', $currentNs);

                    $alertMsg = "🚨 *ALERT: ANOMALI PERUBAHAN NAME SERVER (DNS)*\n\n" .
                        "Situs: *{$site->name}* (`{$domain}`)\n" .
                        "NS Sebelumnya: `{$oldStr}`\n" .
                        "NS Terdeteksi Baru: `{$newStr}`\n" .
                        "Waktu Deteksi: *" . now()->translatedFormat('d F Y, H:i:s') . " WIB*\n\n" .
                        "Tindakan: Segera periksa panel registrar / DNS domain Anda. Perubahan Name Server tanpa otorisasi mengindikasikan pengalihan trafik atau pembajakan domain!";

                    NotificationService::sendAlert($alertMsg);

                    // Create critical incident
                    Incident::create([
                        'site_id' => $site->id,
                        'title' => "Anomali DNS / Name Server Berubah: {$domain}",
                        'type' => 'dns_hijack',
                        'severity' => 'critical',
                        'status' => 'open',
                        'description' => "Perubahan Name Server terdeteksi pada domain {$domain}. NS lama: [{$oldStr}], NS baru: [{$newStr}].",
                        'payload' => [
                            'domain' => $domain,
                            'old_ns' => $oldNs,
                            'new_ns' => $currentNs,
                            'a_records' => $currentA,
                        ],
                        'detected_at' => now(),
                    ]);
                }
            }

            // Save records
            $site->dns_name_servers = $currentNs;
            $site->dns_records = [
                'a' => $currentA,
                'ns' => $currentNs,
            ];
            $site->dns_last_checked_at = now();
            $site->save();

            // Record DetectionLog
            DetectionLog::create([
                'site_id' => $site->id,
                'title' => "DNS Check: " . count($currentNs) . " NS | " . count($currentA) . " IP",
                'category' => 'dns',
                'context' => "Domain: {$domain} | NS: " . implode(', ', $currentNs) . ($hasAnomaly ? " | ANOMALI TERDETEKSI" : " | Normal"),
                'url_path' => $domain,
                'status' => $hasAnomaly ? 'detected' : 'resolved',
                'source' => 'DNS Health & Hijack Guard',
            ]);

        } catch (\Throwable $e) {
            Log::error("DNS check failed for {$domain}: " . $e->getMessage());
        }

        return [
            'domain' => $domain,
            'name_servers' => $currentNs,
            'a_records' => $currentA,
            'has_anomaly' => $hasAnomaly,
        ];
    }

    /**
     * Query WHOIS / RDAP to track domain expiration date.
     */
    public function queryDomainExpiry(string $domain): ?array
    {
        if (array_key_exists($domain, $this->whoisCache)) {
            return $this->whoisCache[$domain];
        }

        // 1. Try RDAP protocol first (official RFC 7482 HTTP-based JSON)
        try {
            $isIdDomain = str_ends_with($domain, '.id');
            $rdapUrl = $isIdDomain 
                ? "https://rdap.pandi.id/rdap/domain/{$domain}"
                : "https://rdap.org/domain/{$domain}";

            $response = Http::timeout(4)
                ->withoutVerifying()
                ->withHeaders(['Accept' => 'application/rdap+json, application/json'])
                ->get($rdapUrl);

            if ($response->successful()) {
                $data = $response->json();
                $expiresAt = null;
                $registrar = null;

                if (!empty($data['events'])) {
                    foreach ($data['events'] as $event) {
                        if (in_array($event['eventAction'] ?? '', ['expiration', 'registration expiration'])) {
                            $expiresAt = Carbon::parse($event['eventDate']);
                            break;
                        }
                    }
                }

                if (!empty($data['entities'])) {
                    foreach ($data['entities'] as $entity) {
                        if (in_array('registrar', $entity['roles'] ?? [])) {
                            $registrar = $entity['vcardArray'][1][1][3] ?? $entity['handle'] ?? null;
                            break;
                        }
                    }
                }

                if ($expiresAt) {
                    $res = [
                        'expires_at' => $expiresAt,
                        'registrar' => $registrar ?: ($isIdDomain ? 'PANDI (Pengelola Domain .id)' : 'ICANN Registrar'),
                        'source' => 'RDAP',
                    ];
                    $this->whoisCache[$domain] = $res;
                    return $res;
                }
            } elseif ($response->status() === 404) {
                $this->whoisCache[$domain] = null;
                return null;
            }
        } catch (\Throwable $t) {
            // Fallback to socket WHOIS
        }

        // 2. Fallback to Port 43 Socket WHOIS query
        $res = $this->querySocketWhois($domain);
        $this->whoisCache[$domain] = $res;
        return $res;
    }

    /**
     * Fallback WHOIS query via port 43.
     */
    protected function querySocketWhois(string $domain): ?array
    {
        $server = str_ends_with($domain, '.id') ? 'whois.id' : 'whois.iana.org';
        $socket = @fsockopen($server, 43, $errno, $errstr, 2.5);
        if (!$socket) {
            return null;
        }

        fputs($socket, "{$domain}\r\n");
        $response = '';
        while (!feof($socket)) {
            $response .= fgets($socket, 128);
        }
        fclose($socket);

        // Parse Expiry Date from standard WHOIS text patterns
        // E.g.: "Expiration Date: 2027-05-20" or "Registry Expiry Date: 2026-11-15T00:00:00Z"
        $patterns = [
            '#(?:Expiration Date|Registry Expiry Date|Expiry Date|paid-till|valid-until):\s*([0-9\-\:T\sZ\.]+)/?#i',
            '#Expires on\s*\.*:\s*([0-9a-zA-Z\-\s]+)#i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $response, $matches)) {
                try {
                    $dateStr = trim($matches[1]);
                    $expiresAt = Carbon::parse($dateStr);
                    return [
                        'expires_at' => $expiresAt,
                        'registrar' => str_ends_with($domain, '.id') ? 'PANDI (.id Registry)' : 'Domain Registrar',
                        'source' => 'WHOIS:43',
                    ];
                } catch (\Throwable $t) {}
            }
        }

        return null;
    }

    /**
     * Check both DNS and Domain Expiry for a given site.
     */
    public function checkSiteDomainHealth(Site $site, bool $forceAlert = false): array
    {
        $domain = $this->extractApexDomain($site->url);
        $site->domain_name = $domain;

        // 1. Check DNS
        $dnsResult = $this->checkDnsHealth($site, $domain);

        // 2. Check Expiry
        $whois = $this->queryDomainExpiry($domain);
        $daysLeft = null;
        $status = 'unknown';
        $expiresAt = null;
        $registrar = null;

        if ($whois && !empty($whois['expires_at'])) {
            $expiresAt = $whois['expires_at'];
            $registrar = $whois['registrar'] ?? null;
            $daysLeft = (int) round(($expiresAt->timestamp - time()) / 86400);

            if ($daysLeft < 0) {
                $status = 'expired';
            } elseif ($daysLeft <= 30) {
                $status = 'expiring';
            } else {
                $status = 'active';
            }

            $site->domain_expires_at = $expiresAt;
            $site->domain_days_left = $daysLeft;
            $site->domain_registrar = $registrar;
            $site->domain_status = $status;
        }

        $site->domain_last_checked_at = now();

        // Milestones for domain alerts: 0 (expired), 1 (H-1), 7 (H-7), 14 (H-14), 30 (H-30), 60 (H-60)
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
            } elseif ($daysLeft <= 60) {
                $milestoneTier = 60;
            }
        }

        $shouldSendAlert = $forceAlert || (
            $milestoneTier !== null && 
            $site->domain_alert_sent_milestone !== $milestoneTier
        );

        if ($shouldSendAlert && in_array($status, ['expiring', 'expired'])) {
            $site->domain_alert_sent_milestone = $milestoneTier;

            $statusIcon = $status === 'expired' ? '🚨' : ($milestoneTier <= 14 ? '⚠️' : 'ℹ️');
            $statusLabel = $status === 'expired' 
                ? "*TELAH KEDALUWARSA*" 
                : "*Akan Kedaluwarsa dalam {$daysLeft} Hari (H-{$milestoneTier})*";
            $expFormatted = $expiresAt ? $expiresAt->translatedFormat('d F Y') : '-';

            $alertMsg = "{$statusIcon} *PERINGATAN MASA SEWA DOMAIN PEMERINTAH*\n\n" .
                "Situs: *{$site->name}* (`{$domain}`)\n" .
                "Registrar: *{$registrar}*\n" .
                "Status: {$statusLabel}\n" .
                "Kedaluwarsa Pada: *{$expFormatted}*\n\n" .
                "Tindakan: Segera koordinasikan perpanjangan sewa domain ke instansi / penyedia domain terkait untuk mencegah domain lepas atau dibeli pihak lain (domain squatted)!";

            NotificationService::sendAlert($alertMsg);

            // Create Incident if <= 14 days
            if ($milestoneTier !== null && $milestoneTier <= 14) {
                $existingIncident = Incident::where('site_id', $site->id)
                    ->whereIn('status', ['open', 'investigating'])
                    ->where('type', 'domain_expiry')
                    ->first();

                if (!$existingIncident) {
                    Incident::create([
                        'site_id' => $site->id,
                        'title' => $status === 'expired' 
                            ? "Domain Kedaluwarsa: {$domain}" 
                            : "Domain Mendekati Kedaluwarsa (H-{$daysLeft}): {$domain}",
                        'type' => 'domain_expiry',
                        'severity' => $milestoneTier <= 3 ? 'critical' : 'high',
                        'status' => 'open',
                        'description' => "Masa aktif domain {$domain} ({$registrar}) berakhir pada {$expFormatted} (sisa {$daysLeft} hari).",
                        'payload' => [
                            'domain' => $domain,
                            'registrar' => $registrar,
                            'expires_at' => $expiresAt ? $expiresAt->toIso8601String() : null,
                            'days_left' => $daysLeft,
                        ],
                        'detected_at' => now(),
                    ]);
                }
            }
        } elseif ($status === 'active' && $site->domain_alert_sent_milestone !== null) {
            $site->domain_alert_sent_milestone = null;

            Incident::where('site_id', $site->id)
                ->whereIn('status', ['open', 'investigating'])
                ->where('type', 'domain_expiry')
                ->update(['status' => 'resolved']);
        }

        $site->save();

        return [
            'site_id' => $site->id,
            'name' => $site->name,
            'domain' => $domain,
            'status' => $status,
            'expires_at' => $expiresAt,
            'days_left' => $daysLeft,
            'registrar' => $registrar,
            'dns' => $dnsResult,
        ];
    }

    /**
     * Check all active sites.
     */
    public function checkAllSitesDomainHealth(bool $forceAlert = false): array
    {
        $sites = Site::where('is_active', true)->get();
        $results = [];

        foreach ($sites as $site) {
            $results[] = $this->checkSiteDomainHealth($site, $forceAlert);
        }

        return $results;
    }
}
