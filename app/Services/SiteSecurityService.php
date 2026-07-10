<?php

namespace App\Services;

use App\Repositories\Interfaces\SiteSecurityRepositoryInterface;
use App\Models\Site;
use App\Models\Keyword;
use App\Models\DetectionLog;
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

    /**
     * Get randomized headers to rotate User-Agent and bypass basic WAF blocks.
     */
    private function getRandomHeaders(): array
    {
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
        ];

        return [
            'User-Agent' => $userAgents[array_rand($userAgents)],
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control' => 'no-cache',
            'Pragma' => 'no-cache',
            'Referer' => 'https://www.google.com/',
        ];
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

        $parsedUrl = parse_url($url);
        $host = $parsedUrl['host'] ?? null;
        
        $isReachable = false;
        $reachabilityError = 'Situs tidak dapat dihubungi atau offline.';

        if ($host) {
            $ip = @gethostbyname($host);
            $isValidIp = filter_var($host, FILTER_VALIDATE_IP);
            
            if ($isValidIp || ($ip && $ip !== $host)) {
                // Host resolved. Try a quick request with 5s timeout and verifying disabled
                try {
                    $response = Http::withoutVerifying()
                        ->withHeaders($this->getRandomHeaders())
                        ->timeout(5)
                        ->get($url);
                    $isReachable = true;
                } catch (\Exception $e) {
                    $reachabilityError = 'Koneksi gagal: ' . $e->getMessage();
                }
            } else {
                $reachabilityError = 'Domain tidak terdaftar atau gagal melakukan resolusi DNS.';
            }
        } else {
            $reachabilityError = 'Format URL tidak valid.';
        }

        // If site is completely unreachable, fail all checks with clear reason
        if (!$isReachable) {
            $failDesc = 'Pemindaian gagal: ' . $reachabilityError;
            $failFix = 'Pastikan situs online, domain aktif, dan web server berjalan.';
            
            $checks[] = [
                'key' => 'env',
                'title' => 'Deteksi File .env Terekspos',
                'status' => 'fail',
                'desc' => $failDesc,
                'fix' => $failFix
            ];
            $checks[] = [
                'key' => 'git',
                'title' => 'Deteksi Direktori .git Terekspos',
                'status' => 'fail',
                'desc' => $failDesc,
                'fix' => $failFix
            ];
            $checks[] = [
                'key' => 'csp',
                'title' => 'Header Content-Security-Policy (CSP)',
                'status' => 'fail',
                'desc' => $failDesc,
                'fix' => $failFix
            ];
            $checks[] = [
                'key' => 'xframe',
                'title' => 'Header X-Frame-Options (Clickjacking)',
                'status' => 'fail',
                'desc' => $failDesc,
                'fix' => $failFix
            ];
            $checks[] = [
                'key' => 'hsts',
                'title' => 'Header Strict-Transport-Security (HSTS)',
                'status' => 'fail',
                'desc' => $failDesc,
                'fix' => $failFix
            ];
            $checks[] = [
                'key' => 'ssl',
                'title' => 'Pemeriksaan Sertifikat SSL',
                'status' => 'fail',
                'desc' => $failDesc,
                'fix' => 'Pastikan domain aktif dan port 443 terbuka.'
            ];

            // Send notification for unreachable website
            \App\Services\NotificationService::sendAlert(
                "🚨 *SITUS OFFLINE / TIDAK DAPAT DIHUBUNGI*\n" .
                "Situs: *{$site->name}* ({$site->url})\n" .
                "Keterangan: {$reachabilityError}\n" .
                "Tindakan: Periksa konfigurasi DNS dan status web server."
            );

            return $this->siteSecurityRepository->updateOrCreateForSite($siteId, [
                'score' => 0,
                'grade' => 'F',
                'issues_count' => 6,
                'checks' => $checks,
                'last_scanned_at' => now(),
            ]);
        }

        // 1. Probe Exposed Files (.env, .git)
        $envStatus = 'ok';
        $envDesc = 'File konfigurasi (.env) tidak dapat diakses dari luar.';
        $envFix = null;
        try {
            // Request /.env file
            $envUrl = rtrim($url, '/') . '/.env';
            $response = Http::withoutVerifying()
                ->withHeaders($this->getRandomHeaders())
                ->timeout(5)
                ->get($envUrl);
            if ($response->successful() && (Str::contains($response->body(), 'DB_') || Str::contains($response->body(), 'APP_ENV'))) {
                $envStatus = 'fail';
                $envDesc = 'PERINGATAN KRITIS: File konfigurasi (.env) terdeteksi terekspos ke publik dan dapat diunduh langsung!';
                $envFix = 'Blokir akses ke file .env menggunakan konfigurasi web server (.htaccess untuk Apache, atau aturan deny all di Nginx location block) dan rotasikan seluruh kredensial database/API key yang bocor.';
                $score -= 35;
                $issuesCount++;

                // Send notification
                \App\Services\NotificationService::sendAlert(
                    "⚠️ *TEMUAN KRITIS: FILE .env TEREKSPOS*\n" .
                    "Situs: *{$site->name}* ({$site->url})\n" .
                    "Keterangan: File konfigurasi (.env) dapat diakses publik.\n" .
                    "Rekomendasi Tindakan: {$envFix}"
                );
            }
        } catch (\Exception $e) {
            // Ignore connection errors since reachability was verified
        }

        $gitStatus = 'ok';
        $gitDesc = 'Direktori riwayat repositori (.git) aman.';
        $gitFix = null;
        try {
            // Request /.git/config or check directory
            $gitUrl = rtrim($url, '/') . '/.git/config';
            $response = Http::withoutVerifying()
                ->withHeaders($this->getRandomHeaders())
                ->timeout(5)
                ->get($gitUrl);
            if ($response->successful() && Str::contains($response->body(), '[core]')) {
                $gitStatus = 'fail';
                $gitDesc = 'PERINGATAN KRITIS: Direktori repositori (.git) terdeteksi terekspos. Struktur source code dan riwayat commit dapat diunduh!';
                $gitFix = 'Hapus direktori .git dari document root web server atau tambahkan aturan deny untuk folder tersembunyi pada konfigurasi web server.';
                $score -= 30;
                $issuesCount++;

                // Send notification
                \App\Services\NotificationService::sendAlert(
                    "⚠️ *TEMUAN KRITIS: REPOSITORI .git TEREKSPOS*\n" .
                    "Situs: *{$site->name}* ({$site->url})\n" .
                    "Keterangan: Direktori .git terekspos ke publik.\n" .
                    "Rekomendasi Tindakan: {$gitFix}"
                );
            }
        } catch (\Exception $e) {
            // Ignore connection errors
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
            $response = Http::withoutVerifying()
                ->withHeaders($this->getRandomHeaders())
                ->timeout(5)
                ->head($url);
            $headers = array_change_key_case($response->headers(), CASE_LOWER);

            // Audit Content-Security-Policy
            if (isset($headers['content-security-policy'])) {
                $cspValue = is_array($headers['content-security-policy']) ? implode('; ', $headers['content-security-policy']) : $headers['content-security-policy'];
                if (Str::contains($cspValue, "'unsafe-inline'") && Str::contains($cspValue, "'unsafe-eval'")) {
                    $cspStatus = 'warn';
                    $cspDesc = 'Header Content-Security-Policy ditemukan, namun menggunakan directive yang lemah (\'unsafe-inline\' / \'unsafe-eval\').';
                    $cspFix = 'Batasi penggunaan \'unsafe-inline\' dan \'unsafe-eval\' pada script-src untuk mencegah serangan Cross-Site Scripting (XSS).';
                    $score -= 5;
                    $issuesCount++;
                } else {
                    $cspStatus = 'ok';
                    $cspDesc = 'Header Content-Security-Policy aktif dengan kebijakan yang kuat.';
                    $cspFix = null;
                }
            } else {
                $score -= 10;
                $issuesCount++;
            }

            // Audit X-Frame-Options
            if (isset($headers['x-frame-options'])) {
                $xframeValue = is_array($headers['x-frame-options']) ? implode('', $headers['x-frame-options']) : $headers['x-frame-options'];
                $xframeValueUpper = strtoupper(trim($xframeValue));
                if ($xframeValueUpper === 'SAMEORIGIN' || $xframeValueUpper === 'DENY') {
                    $xframeStatus = 'ok';
                    $xframeDesc = "Header X-Frame-Options aktif dengan konfigurasi aman ({$xframeValueUpper}).";
                    $xframeFix = null;
                } else {
                    $xframeStatus = 'warn';
                    $xframeDesc = "Header X-Frame-Options ditemukan dengan nilai yang kurang aman ({$xframeValue}).";
                    $xframeFix = 'Gunakan nilai SAMEORIGIN atau DENY pada header X-Frame-Options untuk mencegah Clickjacking.';
                    $score -= 5;
                    $issuesCount++;
                }
            } else {
                $score -= 10;
                $issuesCount++;
            }

            // Audit Strict-Transport-Security (HSTS)
            if (isset($headers['strict-transport-security'])) {
                $hstsValue = is_array($headers['strict-transport-security']) ? implode('; ', $headers['strict-transport-security']) : $headers['strict-transport-security'];
                $hstsLower = strtolower($hstsValue);
                preg_match('/max-age=(\d+)/', $hstsLower, $matches);
                $maxAge = isset($matches[1]) ? (int)$matches[1] : 0;
                
                if ($maxAge < 31536000) {
                    $hstsStatus = 'warn';
                    $hstsDesc = 'Header HSTS aktif, namun durasi max-age kurang dari 1 tahun (31.536.000 detik).';
                    $hstsFix = 'Tingkatkan nilai max-age pada header Strict-Transport-Security minimal menjadi 31536000 (1 tahun).';
                    $score -= 5;
                    $issuesCount++;
                } elseif (!Str::contains($hstsLower, 'includesubdomains')) {
                    $hstsStatus = 'warn';
                    $hstsDesc = 'Header HSTS aktif, namun tidak melindungi sub-domain (includeSubDomains tidak disertakan).';
                    $hstsFix = 'Tambahkan directive includeSubDomains pada header Strict-Transport-Security.';
                    $score -= 5;
                    $issuesCount++;
                } else {
                    $hstsStatus = 'ok';
                    $hstsDesc = 'Header Strict-Transport-Security (HSTS) aktif dengan konfigurasi penuh.';
                    $hstsFix = null;
                }
            } else {
                $score -= 10;
                $issuesCount++;
            }
        } catch (\Exception $e) {
            // If header request fails but site was verified, still treat security headers as missing warnings
            $score -= 30;
            $issuesCount += 3;
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
                    $cert = @openssl_x509_parse($cont["options"]["ssl"]["peer_certificate"]);
                    
                    if (isset($cert['validTo_time_t'])) {
                        $validTo = $cert['validTo_time_t'];
                        $daysLeft = round(($validTo - time()) / 86400);
                        
                        if ($daysLeft < 0) {
                            $sslStatus = 'fail';
                            $sslDesc = 'Sertifikat SSL telah KEDALUWARSA. Koneksi tidak lagi aman!';
                            $sslFix = 'Segera perbarui sertifikat SSL domain Anda untuk menghindari pemblokiran akses browser oleh pengguna.';
                            $score -= 20;
                            $issuesCount++;

                            // Send notification
                            \App\Services\NotificationService::sendAlert(
                                "🚨 *SERUS: SERTIFIKAT SSL KEDALUWARSA*\n" .
                                "Situs: *{$site->name}* ({$site->url})\n" .
                                "Keterangan: Sertifikat SSL telah kedaluwarsa.\n" .
                                "Tindakan: {$sslFix}"
                            );
                        } elseif ($daysLeft <= 14) {
                            $sslStatus = 'warn';
                            $sslDesc = "Sertifikat SSL akan kedaluwarsa dalam {$daysLeft} hari.";
                            $sslFix = 'Perbarui sertifikat SSL sesegera mungkin sebelum tanggal kedaluwarsa tiba.';
                            $score -= 10;
                            $issuesCount++;

                            // Send notification
                            \App\Services\NotificationService::sendAlert(
                                "⚠️ *PERINGATAN: SERTIFIKAT SSL HAMPIR KEDALUWARSA*\n" .
                                "Situs: *{$site->name}* ({$site->url})\n" .
                                "Keterangan: SSL akan kedaluwarsa dalam {$daysLeft} hari.\n" .
                                "Tindakan: {$sslFix}"
                            );
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

        // Run SSH scan if configured
        $this->scanSiteViaSsh($site, $checks, $score, $issuesCount);

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

        $securityResult = $this->siteSecurityRepository->updateOrCreateForSite($siteId, [
            'score' => $score,
            'grade' => $grade,
            'issues_count' => $issuesCount,
            'checks' => $checks,
            'last_scanned_at' => now(),
        ]);

        // Auto-scan for keywords and save findings to detection_logs
        if ($isReachable) {
            $this->scanForKeywords($site, $url);
        }

        return $securityResult;
    }

    /**
     * Scan site homepage for active keywords and auto-save new findings to detection_logs.
     * Skips duplicates that were already logged within the last 7 days.
     */
    /**
     * Scan site homepage for active keywords and auto-save new findings to detection_logs.
     * Also dynamically extracts and auto-registers new suspicious words/phrases into the keywords dictionary.
     */
    private function scanForKeywords(Site $site, string $url): void
    {
        // 1. Fetch active keywords from DB
        $dbKeywords = Keyword::where('is_active', true)->get();

        try {
            $response = Http::withoutVerifying()
                ->timeout(8)
                ->withHeaders($this->getRandomHeaders())
                ->get($url);

            if (!$response->successful()) {
                return;
            }

            $htmlBody = $response->body();
            // Strip script/style tags for cleaner text matching
            $cleanText = preg_replace('/<(script|style)[^>]*>.*?<\/\1>/si', '', $htmlBody);
            $plainText = strip_tags($cleanText);

        } catch (\Exception $e) {
            return;
        }

        // --- PART A: Heuristic Regex Scan to Extract Suspicious Words dynamically ---
        $judolRoots = ['slot', 'gacor', 'judi', 'casino', 'togel', 'maxwin', 'sbobet', 'poker', 'depo', 'betting', 'linkalternatif', 'apk-download'];
        $obatRoots = ['tramadol', 'hexymer', 'aborsi', 'cytotec'];
        
        $allRoots = array_merge($judolRoots, $obatRoots);
        
        // Match any word/phrase containing the suspicious roots, including surrounding alphanumeric/hyphen characters
        $pattern = '/(?:^|[^a-zA-Z0-9_-])([a-zA-Z0-9_-]*?(?:' . implode('|', $allRoots) . ')[a-zA-Z0-9_-]*?)(?:[^a-zA-Z0-9_-]|$)/i';

        if (preg_match_all($pattern, $plainText, $matches)) {
            $matchedWords = array_unique(array_map('strtolower', $matches[1]));
            
            foreach ($matchedWords as $word) {
                // Determine category
                $category = 'judol';
                foreach ($obatRoots as $obatRoot) {
                    if (Str::contains($word, $obatRoot)) {
                        $category = 'obat';
                        break;
                    }
                }

                // Check if this specific word is already in the keywords table
                $existsInDb = Keyword::whereRaw('LOWER(keyword) = ?', [$word])->exists();
                if (!$existsInDb) {
                    // Auto-register to the kamus kata kunci
                    $cleanUrl = str_replace(['http://', 'https://'], '', $site->url);
                    Keyword::create([
                        'keyword' => $word,
                        'category' => $category,
                        'type' => 'text',
                        'is_active' => true,
                        'description' => 'Terdeteksi di situs: ' . $site->name . ' (' . $cleanUrl . ') (Halaman: /)',
                        'created_by' => null, // Auto-added by scanner
                    ]);
                }

                // Log and trigger alert
                $this->logAndAlertKeywordMatch($site, $word, $category, $plainText);
            }
        }

        // --- PART B: Scan using existing active database keywords (Custom checks) ---
        foreach ($dbKeywords as $keyword) {
            $matched   = false;
            $matchedKw = $keyword->keyword;
            $actualMatch = $matchedKw;

            if ($keyword->type === 'regex') {
                // Regex match
                $pattern = $matchedKw;
                if (@preg_match($pattern, $plainText, $matches) === 1) {
                    $matched = true;
                    $actualMatch = $matches[0] ?? $matchedKw;
                }
            } else {
                // Plain case-insensitive match
                if (Str::contains(Str::lower($plainText), Str::lower($matchedKw))) {
                    $matched = true;
                    $actualMatch = $matchedKw;
                }
            }

            if ($matched) {
                // If it's a new match from user regex, save the plain text version to the dictionary too
                if ($keyword->type === 'regex') {
                    $existsInDb = Keyword::whereRaw('LOWER(keyword) = ?', [Str::lower($actualMatch)])->exists();
                    if (!$existsInDb) {
                        $cleanUrl = str_replace(['http://', 'https://'], '', $site->url);
                        Keyword::create([
                            'keyword' => $actualMatch,
                            'category' => $keyword->category,
                            'type' => 'text',
                            'is_active' => true,
                            'description' => 'Tangkapan pola regex "' . $keyword->keyword . '" di situs: ' . $site->name . ' (' . $cleanUrl . ') (Halaman: /)',
                            'created_by' => null,
                        ]);
                    }
                }

                $this->logAndAlertKeywordMatch($site, $actualMatch, $keyword->category, $plainText);
            }
        }
    }

    /**
     * Helper to log detection and trigger alerts.
     */
    private function logAndAlertKeywordMatch(Site $site, string $keyword, string $category, string $plainText): void
    {
        // Avoid duplicate logs within 7 days for the same keyword on the same site
        $alreadyLogged = DetectionLog::where('site_id', $site->id)
            ->where('title', 'like', '%' . $keyword . '%')
            ->where('created_at', '>=', now()->subDays(7))
            ->exists();

        if ($alreadyLogged) {
            return;
        }

        // Extract surrounding context snippet (~160 chars around match)
        $pos     = stripos($plainText, $keyword);
        $start   = max(0, $pos - 60);
        $snippet = '...' . substr($plainText, $start, 160) . '...';
        $context = '<mark>' . e($keyword) . '</mark> ditemukan dalam konten halaman: ' . e($snippet);

        DetectionLog::create([
            'site_id'  => $site->id,
            'title'    => 'Kata kunci "' . $keyword . '" terdeteksi saat pemindaian keamanan',
            'category' => $category,
            'context'  => $context,
            'url_path' => '/',
            'status'   => 'new',
            'source'   => 'Security Scanner',
        ]);

        // Send notification for new keyword detection
        $categoryName = $category === 'judol' ? 'Judi Online' : ($category === 'obat' ? 'Obat Terlarang' : ($category === 'hidden' ? 'Teks Tersembunyi' : 'Halaman Baru'));
        \App\Services\NotificationService::sendAlert(
            "🚨 *DETEKSI KONTEN MENCURIGAKAN*\n" .
            "Situs: *{$site->name}* ({$site->url})\n" .
            "Kategori: *{$categoryName}*\n" .
            "Kata Kunci Terdeteksi: `{$keyword}`\n" .
            "Potongan Teks: \"{$snippet}\"\n" .
            "Tindakan: Segera periksa konten website dan hapus script/teks sisipan."
        );
    }

    /**
     * Run SSH security audits on the remote server.
     */
    private function scanSiteViaSsh(Site $site, array &$checks, int &$score, int &$issuesCount): void
    {
        if (empty($site->ssh_host)) {
            return;
        }

        $host = $site->ssh_host;
        $port = $site->ssh_port ?: 22;
        $username = $site->ssh_username;
        $authType = $site->ssh_auth_type;
        $appPath = rtrim($site->ssh_app_path, '/');

        if (empty($username) || empty($appPath)) {
            $checks[] = [
                'key' => 'ssh_connection',
                'title' => 'Status Koneksi SSH',
                'status' => 'fail',
                'desc' => 'Konfigurasi SSH tidak lengkap (username atau path aplikasi kosong).',
                'fix' => 'Lengkapi konfigurasi SSH pada pengaturan data website.'
            ];
            $score -= 10;
            $issuesCount++;
            return;
        }

        try {
            $ssh = new \phpseclib3\Net\SSH2($host, $port, 10); // 10s connection timeout
            
            // Authenticate
            $authenticated = false;
            if ($authType === 'key') {
                $privateKey = $site->ssh_private_key;
                if (!$privateKey) {
                    throw new \Exception("SSH Private Key kosong.");
                }
                try {
                    $key = \phpseclib3\Crypt\PublicKeyLoader::load($privateKey);
                    $authenticated = $ssh->login($username, $key);
                } catch (\Exception $keyEx) {
                    throw new \Exception("Gagal memuat SSH Private Key: " . $keyEx->getMessage());
                }
            } else {
                $password = $site->ssh_password;
                $authenticated = $ssh->login($username, $password);
            }

            if (!$authenticated) {
                throw new \Exception("Autentikasi gagal. Username/password/key tidak cocok.");
            }

            // Connection successful! Add Check item
            $checks[] = [
                'key' => 'ssh_connection',
                'title' => 'Status Koneksi SSH',
                'status' => 'ok',
                'desc' => 'Koneksi SSH berhasil terhubung dan terautentikasi.',
                'fix' => null
            ];

            // 1. Audit File Permissions (e.g. check .env file permissions)
            $envPermsCmd = "stat -c '%a' " . escapeshellarg($appPath . '/.env') . " 2>/dev/null";
            $envPerms = trim($ssh->exec($envPermsCmd));
            
            if (empty($envPerms)) {
                $lsOut = trim($ssh->exec("ls -l " . escapeshellarg($appPath . '/.env') . " 2>/dev/null"));
                if (!empty($lsOut)) {
                    $parts = explode(' ', preg_replace('/\s+/', ' ', $lsOut));
                    $envPerms = $parts[0] ?? '';
                }
            }

            $permStatus = 'ok';
            $permDesc = 'Izin file konfigurasi sensitif (.env) di server sudah aman.';
            $permFix = null;

            if (!empty($envPerms)) {
                if (is_numeric($envPerms)) {
                    $permsInt = (int)$envPerms;
                    $othersWritable = ($permsInt % 10) & 2;
                    $groupWritable = (($permsInt / 10) % 10) & 2;
                    if ($permsInt === 777 || $permsInt === 666 || $othersWritable || $groupWritable) {
                        $permStatus = 'fail';
                        $permDesc = "PERINGATAN SSH: File .env memiliki izin akses terlalu terbuka ({$envPerms}). Siapapun di server dapat mengubahnya!";
                        $permFix = "Jalankan perintah 'chmod 600 " . $appPath . "/.env' di server Anda.";
                        $score -= 15;
                        $issuesCount++;
                    } elseif ($permsInt > 640) {
                        $permStatus = 'warn';
                        $permDesc = "PERINGATAN SSH: File .env memiliki izin akses ({$envPerms}). Direkomendasikan lebih diperketat.";
                        $permFix = "Jalankan perintah 'chmod 600 " . $appPath . "/.env' di server Anda.";
                        $score -= 5;
                        $issuesCount++;
                    }
                } else {
                    if (strpos($envPerms, 'w', 5) !== false) {
                        $permStatus = 'fail';
                        $permDesc = "PERINGATAN SSH: File .env memiliki izin akses terlalu terbuka ({$envPerms}).";
                        $permFix = "Jalankan perintah 'chmod 600 " . $appPath . "/.env' di server Anda.";
                        $score -= 15;
                        $issuesCount++;
                    }
                }
            }

            $checks[] = [
                'key' => 'ssh_permissions',
                'title' => 'Audit Izin File Sensitif (SSH)',
                'status' => $permStatus,
                'desc' => $permDesc,
                'fix' => $permFix
            ];

            // 2. Scan for Malware & Web Shells
            $malwareCmd = "find " . escapeshellarg($appPath) . " -type f -name \"*.php\" ! -path \"*/vendor/*\" ! -path \"*/node_modules/*\" ! -path \"*/storage/*\" | xargs grep -lE \"(eval|base64_decode|shell_exec|passthru|system|exec)\s*\\(\" 2>/dev/null";
            $malwareOut = trim($ssh->exec($malwareCmd));
            
            $webshellStatus = 'ok';
            $webshellDesc = 'Tidak ditemukan file script/malware mencurigakan di direktori website.';
            $webshellFix = null;

            if (!empty($malwareOut)) {
                $lines = explode("\n", $malwareOut);
                $lines = array_filter(array_map('trim', $lines));
                
                if (count($lines) > 0) {
                    $webshellStatus = 'fail';
                    $fileList = implode(', ', array_slice($lines, 0, 3));
                    if (count($lines) > 3) {
                        $fileList .= '... dan ' . (count($lines) - 3) . ' file lainnya';
                    }
                    $webshellDesc = "PERINGATAN KRITIS: Terdeteksi " . count($lines) . " file script PHP mencurigakan yang mengandung fungsi eksekusi sistem/obfuscated code (misal: " . $fileList . ").";
                    $webshellFix = "Periksa file-file tersebut. Jika itu bukan file buatan Anda atau bagian dari framework, hapus file tersebut segera karena berisiko tinggi sebagai backdoor/web shell.";
                    $score -= 30;
                    $issuesCount++;

                    // Send Telegram alert
                    \App\Services\NotificationService::sendAlert(
                        "🚨 *TEMUAN KRITIS: BACKDOOR / WEB SHELL TERDETEKSI VIA SSH*\n" .
                        "Situs: *{$site->name}* ({$site->url})\n" .
                        "Keterangan: Terdeteksi " . count($lines) . " file mencurigakan mengandung fungsi berbahaya.\n" .
                        "File Contoh: " . $fileList . "\n" .
                        "Tindakan: Segera periksa dan bersihkan file backdoor tersebut."
                    );
                }
            }

            $checks[] = [
                'key' => 'ssh_webshell',
                'title' => 'Deteksi File Malware / Web Shell (SSH)',
                'status' => $webshellStatus,
                'desc' => $webshellDesc,
                'fix' => $webshellFix
            ];

            // 3. Core File Integrity
            $gitCheckCmd = "cd " . escapeshellarg($appPath) . " && git rev-parse --is-inside-work-tree 2>/dev/null";
            $isGit = trim($ssh->exec($gitCheckCmd)) === 'true';

            $integrityStatus = 'ok';
            $integrityDesc = 'Integritas file repositori aman.';
            $integrityFix = null;

            if ($isGit) {
                $gitStatusCmd = "cd " . escapeshellarg($appPath) . " && git status --porcelain 2>/dev/null";
                $gitStatusOut = trim($ssh->exec($gitStatusCmd));
                if (!empty($gitStatusOut)) {
                    $statusLines = explode("\n", $gitStatusOut);
                    $statusLines = array_filter(array_map('trim', $statusLines));
                    
                    $modified = 0;
                    foreach ($statusLines as $line) {
                        if (Str::startsWith($line, ['M ', ' M'])) {
                            $modified++;
                        }
                    }

                    if ($modified > 0) {
                        $integrityStatus = 'warn';
                        $integrityDesc = "PERINGATAN SSH: Terdeteksi {$modified} file core terdaftar yang dimodifikasi di server produksi.";
                        $integrityFix = "Jalankan 'git diff' di server untuk meninjau perubahan file core tersebut dan pastikan perubahan tersebut sah.";
                        $score -= 10;
                        $issuesCount++;
                    }
                }
            } else {
                $recentFilesCmd = "find " . escapeshellarg($appPath) . " -type f -name \"*.php\" -mtime -1 ! -path \"*/vendor/*\" ! -path \"*/node_modules/*\" ! -path \"*/storage/*\" 2>/dev/null | wc -l";
                $recentFilesCount = (int)trim($ssh->exec($recentFilesCmd));
                if ($recentFilesCount > 5) {
                    $integrityStatus = 'warn';
                    $integrityDesc = "INFORMASI SSH: Terdeteksi {$recentFilesCount} file PHP baru/diubah dalam 24 jam terakhir (Situs tidak menggunakan Git).";
                    $integrityFix = "Pastikan perubahan ini merupakan bagian dari pembaruan aplikasi resmi Anda.";
                }
            }

            $checks[] = [
                'key' => 'ssh_integrity',
                'title' => 'Pemeriksaan Integritas Core File (SSH)',
                'status' => $integrityStatus,
                'desc' => $integrityDesc,
                'fix' => $integrityFix
            ];

        } catch (\Exception $ex) {
            $checks[] = [
                'key' => 'ssh_connection',
                'title' => 'Status Koneksi SSH',
                'status' => 'fail',
                'desc' => 'Gagal terhubung ke server via SSH: ' . $ex->getMessage(),
                'fix' => 'Periksa kembali Host, Port, Username, dan Password/Key SSH di data website Anda. Pastikan port SSH terbuka di firewall server tujuan.'
            ];
            $score -= 15;
            $issuesCount++;
            
            $checks[] = [
                'key' => 'ssh_permissions',
                'title' => 'Audit Izin File Sensitif (SSH)',
                'status' => 'warn',
                'desc' => 'Tidak dapat melakukan audit izin file karena koneksi SSH gagal.',
                'fix' => null
            ];
            $checks[] = [
                'key' => 'ssh_webshell',
                'title' => 'Deteksi File Malware / Web Shell (SSH)',
                'status' => 'warn',
                'desc' => 'Tidak dapat melakukan pemindaian webshell karena koneksi SSH gagal.',
                'fix' => null
            ];
            $checks[] = [
                'key' => 'ssh_integrity',
                'title' => 'Pemeriksaan Integritas Core File (SSH)',
                'status' => 'warn',
                'desc' => 'Tidak dapat melakukan audit integritas file karena koneksi SSH gagal.',
                'fix' => null
            ];
        }
    }
}
