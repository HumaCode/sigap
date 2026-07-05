<?php

namespace App\Services;

use App\Repositories\Interfaces\SiteSecurityRepositoryInterface;
use App\Models\Site;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SiteSecurityService
{
    public function __construct(protected SiteSecurityRepositoryInterface $siteSecurityRepository) {}

    public function getPaginatedSecurities(array $filters, int $perPage = 10)
    {
        // Auto-seed security findings for existing sites if none exist
        $this->ensureSecuritiesExist();

        return $this->siteSecurityRepository->getPaginatedSecurities($filters, $perPage);
    }

    public function ensureSecuritiesExist()
    {
        $sites = Site::all();
        foreach ($sites as $site) {
            // Check if site security report exists
            $exists = \App\Models\SiteSecurity::where('site_id', $site->id)->exists();
            if (!$exists) {
                $this->scanSite($site->id);
            }
        }
    }

    public function scanAllSites()
    {
        $sites = Site::all();
        foreach ($sites as $site) {
            $this->scanSite($site->id);
        }
    }

    public function scanSite(string $siteId)
    {
        $site = Site::findOrFail($siteId);
        
        $score = 100;
        $issuesCount = 0;
        $checks = [];

        // Normalize URL
        $url = $site->url;
        if (!Str::startsWith($url, ['http://', 'https://'])) {
            $url = 'https://' . $url;
        }

        // 1. Probe Exposed Files (.env, .git)
        $envStatus = 'ok';
        $envDesc = 'File konfigurasi (.env) tidak dapat diakses dari luar.';
        $envFix = null;
        try {
            // Request /.env file
            $envUrl = rtrim($url, '/') . '/.env';
            $response = Http::timeout(5)->get($envUrl);
            if ($response->successful() && (Str::contains($response->body(), 'DB_') || Str::contains($response->body(), 'APP_ENV'))) {
                $envStatus = 'fail';
                $envDesc = 'PERINGATAN KRITIS: File konfigurasi (.env) terdeteksi terekspos ke publik dan dapat diunduh langsung!';
                $envFix = 'Blokir akses ke file .env menggunakan konfigurasi web server (.htaccess untuk Apache, atau aturan deny all di Nginx location block) dan rotasikan seluruh kredensial database/API key yang bocor.';
                $score -= 35;
                $issuesCount++;
            }
        } catch (\Exception $e) {
            // Timeout or connection error, default to ok or check offline
        }

        $gitStatus = 'ok';
        $gitDesc = 'Direktori riwayat repositori (.git) aman.';
        $gitFix = null;
        try {
            // Request /.git/config or check directory
            $gitUrl = rtrim($url, '/') . '/.git/config';
            $response = Http::timeout(5)->get($gitUrl);
            if ($response->successful() && Str::contains($response->body(), '[core]')) {
                $gitStatus = 'fail';
                $gitDesc = 'PERINGATAN KRITIS: Direktori repositori (.git) terdeteksi terekspos. Struktur source code dan riwayat commit dapat diunduh!';
                $gitFix = 'Hapus direktori .git dari document root web server atau tambahkan aturan deny untuk folder tersembunyi pada konfigurasi web server.';
                $score -= 30;
                $issuesCount++;
            }
        } catch (\Exception $e) {
            // Ignore connection issues
        }

        // Add file probe checks
        $checks[] = [
            'key' => 'env',
            'title' => 'Deteksi File .env Terekspos',
            'status' => $envStatus,
            'desc' => $envDesc,
            'fix' => $envFix
        ];
        $checks[] = [
            'key' => 'git',
            'title' => 'Deteksi Direktori .git Terekspos',
            'status' => $gitStatus,
            'desc' => $gitDesc,
            'fix' => $gitFix
        ];

        // 2. Fetch headers and check security headers
        $cspStatus = 'warn';
        $cspDesc = 'Header Content-Security-Policy tidak ditemukan pada respons server.';
        $cspFix = 'Konfigurasikan header Content-Security-Policy (CSP) pada web server atau middleware aplikasi untuk membatasi sumber eksekusi skrip.';

        $xframeStatus = 'warn';
        $xframeDesc = 'Header X-Frame-Options tidak ditemukan. Situs rentan terhadap serangan clickjacking.';
        $xframeFix = 'Tambahkan header X-Frame-Options dengan nilai SAMEORIGIN atau DENY pada konfigurasi web server (Apache/Nginx) atau middleware aplikasi.';

        $hstsStatus = 'warn';
        $hstsDesc = 'Header Strict-Transport-Security (HSTS) tidak aktif.';
        $hstsFix = 'Tambahkan header Strict-Transport-Security: max-age=31536000; includeSubDomains pada respons HTTPS.';

        try {
            $response = Http::timeout(5)->head($url);
            $headers = array_change_key_case($response->headers(), CASE_LOWER);

            if (isset($headers['content-security-policy'])) {
                $cspStatus = 'ok';
                $cspDesc = 'Header Content-Security-Policy terkonfigurasi dengan baik.';
                $cspFix = null;
            } else {
                $score -= 10;
                $issuesCount++;
            }

            if (isset($headers['x-frame-options'])) {
                $xframeStatus = 'ok';
                $xframeDesc = 'Header X-Frame-Options aktif (SAMEORIGIN/DENY).';
                $xframeFix = null;
            } else {
                $score -= 10;
                $issuesCount++;
            }

            if (isset($headers['strict-transport-security'])) {
                $hstsStatus = 'ok';
                $hstsDesc = 'Header Strict-Transport-Security (HSTS) aktif untuk perlindungan HTTPS.';
                $hstsFix = null;
            } else {
                $score -= 10;
                $issuesCount++;
            }
        } catch (\Exception $e) {
            // Connection failed: reduce score slightly for unreachable sites or apply warning
            $score -= 10;
        }

        $checks[] = [
            'key' => 'csp',
            'title' => 'Header Content-Security-Policy (CSP)',
            'status' => $cspStatus,
            'desc' => $cspDesc,
            'fix' => $cspFix
        ];
        $checks[] = [
            'key' => 'xframe',
            'title' => 'Header X-Frame-Options (Clickjacking)',
            'status' => $xframeStatus,
            'desc' => $xframeDesc,
            'fix' => $xframeFix
        ];
        $checks[] = [
            'key' => 'hsts',
            'title' => 'Header Strict-Transport-Security (HSTS)',
            'status' => $hstsStatus,
            'desc' => $hstsDesc,
            'fix' => $hstsFix
        ];

        // 3. SSL Expiry Check
        $sslStatus = 'ok';
        $sslDesc = 'Sertifikat SSL valid dan aman.';
        $sslFix = null;

        $parsedUrl = parse_url($url);
        $host = $parsedUrl['host'] ?? null;

        if ($host) {
            try {
                $g = stream_context_create([
                    "ssl" => [
                        "capture_peer_cert" => true,
                        "verify_peer" => false,
                        "verify_peer_name" => false
                    ]
                ]);
                $r = stream_socket_client(
                    "ssl://" . $host . ":443",
                    $errno,
                    $errstr,
                    5,
                    STREAM_CLIENT_CONNECT,
                    $g
                );
                
                if ($r) {
                    $cont = stream_context_get_params($r);
                    $cert = openssl_x509_parse($cont["options"]["ssl"]["peer_certificate"]);
                    
                    if (isset($cert['validTo_time_t'])) {
                        $validTo = $cert['validTo_time_t'];
                        $daysLeft = round(($validTo - time()) / 86400);
                        
                        if ($daysLeft < 0) {
                            $sslStatus = 'fail';
                            $sslDesc = 'Sertifikat SSL telah KEDALUWARSA. Koneksi tidak lagi aman!';
                            $sslFix = 'Segera perbarui sertifikat SSL domain Anda untuk menghindari pemblokiran akses browser oleh pengguna.';
                            $score -= 20;
                            $issuesCount++;
                        } elseif ($daysLeft <= 14) {
                            $sslStatus = 'warn';
                            $sslDesc = "Sertifikat SSL akan kedaluwarsa dalam {$daysLeft} hari.";
                            $sslFix = 'Perbarui sertifikat SSL sesegera mungkin sebelum tanggal kedaluwarsa tiba.';
                            $score -= 10;
                            $issuesCount++;
                        } else {
                            $sslDesc = "Sertifikat SSL valid dan aktif hingga " . date('j M Y', $validTo) . ".";
                        }
                    }
                } else {
                    $sslStatus = 'fail';
                    $sslDesc = 'Gagal melakukan verifikasi sertifikat SSL pada port 443.';
                    $sslFix = 'Pastikan port 443 terbuka dan SSL terpasang dengan benar di web server.';
                    $score -= 15;
                    $issuesCount++;
                }
            } catch (\Exception $e) {
                // SSL verify check failure (likely self-signed or unreachable)
                $sslStatus = 'warn';
                $sslDesc = 'Sertifikat SSL tidak terdeteksi atau menggunakan Self-Signed Certificate.';
                $sslFix = 'Pasang sertifikat SSL yang valid dari otoritas sertifikat terpercaya (mis. Let\'s Encrypt).';
                $score -= 10;
                $issuesCount++;
            }
        }

        $checks[] = [
            'key' => 'ssl',
            'title' => 'Pemeriksaan Sertifikat SSL',
            'status' => $sslStatus,
            'desc' => $sslDesc,
            'fix' => $sslFix
        ];

        // Ensure score is within 0-100 range
        $score = max(0, min(100, $score));

        // Determine grade based on score
        if ($score >= 90) {
            $grade = 'A';
        } elseif ($score >= 75) {
            $grade = 'B';
        } elseif ($score >= 60) {
            $grade = 'C';
        } else {
            $grade = 'F';
        }

        return $this->siteSecurityRepository->updateOrCreateForSite($siteId, [
            'score' => $score,
            'grade' => $grade,
            'issues_count' => $issuesCount,
            'checks' => $checks,
            'last_scanned_at' => now(),
        ]);
    }
}
