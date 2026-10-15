<?php

namespace App\Services;

use App\Models\Site;
use App\Models\Incident;
use App\Models\DetectionLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PortExposureService
{
    /**
     * Daftar port berbahaya / internal yang tidak boleh terekspos ke internet publik.
     */
    public const CRITICAL_PORTS = [
        3306 => ['name' => 'MySQL / MariaDB Database', 'risk' => 'critical', 'desc' => 'Database SQL terekspos. Rentan brute force kredensial root dan kebocoran data massal.'],
        6379 => ['name' => 'Redis In-Memory Key-Value', 'risk' => 'critical', 'desc' => 'Instans Redis tanpa autentikasi dapat dieksploitasi untuk Remote Code Execution (RCE).'],
        27017 => ['name' => 'MongoDB NoSQL Database', 'risk' => 'critical', 'desc' => 'Database MongoDB terekspos. Sering menjadi sasaran ransomware penghapusan data.'],
        5432 => ['name' => 'PostgreSQL Database', 'risk' => 'high', 'desc' => 'Service database PostgreSQL terbuka langsung ke jaringan internet.'],
        9200 => ['name' => 'Elasticsearch REST API', 'risk' => 'high', 'desc' => 'REST endpoint Elasticsearch dapat diakses publik tanpa autentikasi.'],
        11211 => ['name' => 'Memcached Cache Service', 'risk' => 'high', 'desc' => 'Memcached UDP/TCP rentan dimanfaatkan sebagai amplifier serangan DDoS.'],
        23 => ['name' => 'Telnet Plaintext CLI', 'risk' => 'critical', 'desc' => 'Protokol usang tanpa enkripsi. Seluruh traffic login dikirim dalam teks biasa (plaintext).'],
        21 => ['name' => 'FTP File Transfer Protocol', 'risk' => 'medium', 'desc' => 'Service FTP mengirimkan kredensial dalam bentuk plaintext.'],
        8080 => ['name' => 'Alternative HTTP / Proxy / Jenkins', 'risk' => 'medium', 'desc' => 'Port web sekunder atau panel admin terekspos.'],
    ];

    /**
     * Daftar file sensitif yang sering tertinggal di document root web server.
     */
    public const SENSITIVE_FILES = [
        '/.env' => ['label' => 'Environment Config (.env)', 'risk' => 'critical', 'match' => 'APP_KEY='],
        '/.git/HEAD' => ['label' => 'Git Repository Manifest (/.git/HEAD)', 'risk' => 'critical', 'match' => 'ref: refs/'],
        '/.git/config' => ['label' => 'Git Repository Config (/.git/config)', 'risk' => 'critical', 'match' => '[core]'],
        '/phpinfo.php' => ['label' => 'PHP Configuration Probe (/phpinfo.php)', 'risk' => 'high', 'match' => 'PHP Version'],
        '/info.php' => ['label' => 'PHP Info Diagnostic (/info.php)', 'risk' => 'high', 'match' => 'PHP Version'],
        '/wp-config.php.bak' => ['label' => 'WordPress Backup Credentials (/wp-config.php.bak)', 'risk' => 'critical', 'match' => 'DB_PASSWORD'],
        '/storage/logs/laravel.log' => ['label' => 'Laravel Application Log (/storage/logs/laravel.log)', 'risk' => 'medium', 'match' => 'local.ERROR'],
    ];

    /**
     * Pindai port terbuka pada host situs.
     */
    public function scanPorts(string $host): array
    {
        $openPorts = [];

        foreach (self::CRITICAL_PORTS as $port => $info) {
            $connection = @fsockopen($host, $port, $errno, $errstr, 1.2);
            if (is_resource($connection)) {
                fclose($connection);

                $ufwMitigation = "sudo ufw deny from any to any port {$port} proto tcp";
                $iptablesMitigation = "sudo iptables -A INPUT -p tcp --dport {$port} -j DROP";

                $openPorts[] = [
                    'port' => $port,
                    'service' => $info['name'],
                    'risk' => $info['risk'],
                    'description' => $info['desc'],
                    'recommendation' => "Blokir port {$port} menggunakan firewall: `{$ufwMitigation}` atau batasi akses hanya dari IP internal terpercaya.",
                    'mitigation_ufw' => $ufwMitigation,
                    'mitigation_iptables' => $iptablesMitigation,
                ];
            }
        }

        return $openPorts;
    }

    /**
     * Pindai file sensitif yang terekspos ke publik.
     */
    public function scanSensitiveFiles(string $baseUrl): array
    {
        $exposedFiles = [];
        $urlClean = rtrim($baseUrl, '/');
        if (!Str::startsWith($urlClean, ['http://', 'https://'])) {
            $urlClean = 'https://' . $urlClean;
        }

        foreach (self::SENSITIVE_FILES as $path => $info) {
            $targetUrl = $urlClean . $path;

            try {
                $response = Http::withoutVerifying()
                    ->withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SIGAP-SecurityAudit/1.0',
                    ])
                    ->connectTimeout(5)
                    ->timeout(8)
                    ->get($targetUrl);

                if ($response->successful()) {
                    $body = $response->body();
                    if (str_contains($body, $info['match'])) {
                        $exposedFiles[] = [
                            'path' => $path,
                            'url' => $targetUrl,
                            'label' => $info['label'],
                            'risk' => $info['risk'],
                            'status_code' => $response->status(),
                            'snippet' => substr(strip_tags($body), 0, 150),
                            'recommendation' => "Blokir akses file tersembunyi via Nginx (`location ~ /\\.(env|git) { deny all; }`) atau hapus file backup dari document root server.",
                        ];
                    }
                }
            } catch (\Throwable $t) {
                // Ignore connection errors
            }
        }

        return $exposedFiles;
    }

    /**
     * Jalankan audit lengkap eksposur port dan file sensitif untuk situs tertentu.
     */
    public function auditSiteSecurityExposure(Site $site, bool $forceAlert = false): array
    {
        $parsed = parse_url($site->url);
        $host = $parsed['host'] ?? $site->url;
        $host = preg_replace('#^https?://#', '', rtrim($host, '/'));
        $host = explode('/', $host)[0];
        $host = explode(':', $host)[0];

        // 1. Scan open ports
        $openPorts = $this->scanPorts($host);

        // 2. Scan sensitive files
        $exposedFiles = $this->scanSensitiveFiles($site->url);

        // 3. Simpan hasil ke database
        $site->open_ports = $openPorts;
        $site->sensitive_files_exposed = $exposedFiles;
        $site->ports_last_scanned_at = now();
        $site->save();

        $criticalPortCount = count(array_filter($openPorts, fn($p) => $p['risk'] === 'critical'));
        $criticalFileCount = count(array_filter($exposedFiles, fn($f) => $f['risk'] === 'critical'));

        $hasCriticalThreat = ($criticalPortCount > 0 || $criticalFileCount > 0);

        // 4. Kirim notifikasi jika ditemukan eksposur berbahaya
        if ($hasCriticalThreat) {
            $portsList = implode(', ', array_map(fn($p) => "{$p['port']} ({$p['service']})", $openPorts));
            $filesList = implode(', ', array_map(fn($f) => $f['path'], $exposedFiles));

            $alertMsg = "⚠️ *PERINGATAN: EKSPOSUR PORT & FILE SENSITIF TERBUKA*\n\n" .
                "Situs: *{$site->name}* (`{$site->url}`)\n" .
                "Host / IP: `{$host}`\n" .
                ($portsList ? "Port Berbahaya Terbuka: *{$portsList}*\n" : "") .
                ($filesList ? "File Sensitif Terekspos: *{$filesList}*\n" : "") .
                "Waktu Deteksi: *" . now()->translatedFormat('d F Y, H:i:s') . " WIB*\n\n" .
                "Rekomendasi Firewall: Segera aktifkan UFW/iptables untuk menutup port internal dan blokir akses ke file .env/.git!";

            NotificationService::sendAlert($alertMsg);

            // Buat Insiden Otomatis
            $existingIncident = Incident::where('site_id', $site->id)
                ->whereIn('status', ['open', 'investigating'])
                ->where('type', 'service_exposure')
                ->first();

            if (!$existingIncident) {
                Incident::create([
                    'site_id' => $site->id,
                    'title' => "Eksposur Service/Port Berbahaya: {$site->name}",
                    'type' => 'service_exposure',
                    'severity' => 'critical',
                    'status' => 'open',
                    'description' => "Terdeteksi port/service internal terbuka ke publik (" . ($portsList ?: 'N/A') . ") dan/atau file sensitif terekspos (" . ($filesList ?: 'N/A') . ").",
                    'payload' => [
                        'host' => $host,
                        'open_ports' => $openPorts,
                        'exposed_files' => $exposedFiles,
                    ],
                    'detected_at' => now(),
                ]);
            }

            // Catat log deteksi
            DetectionLog::create([
                'site_id' => $site->id,
                'title' => "Port/File Exposure Alert: " . count($openPorts) . " Port | " . count($exposedFiles) . " File",
                'category' => 'security',
                'context' => "Host: {$host} | Ports: {$portsList} | Files: {$filesList}",
                'url_path' => $site->url,
                'status' => 'danger',
                'source' => 'Port & Service Exposure Guard',
            ]);
        }

        return [
            'site_id' => $site->id,
            'name' => $site->name,
            'host' => $host,
            'open_ports_count' => count($openPorts),
            'open_ports' => $openPorts,
            'exposed_files_count' => count($exposedFiles),
            'exposed_files' => $exposedFiles,
            'has_critical' => $hasCriticalThreat,
            'scanned_at' => now()->translatedFormat('d M Y, H:i:s') . ' WIB',
        ];
    }

    /**
     * Audit seluruh situs aktif.
     */
    public function auditAllSitesExposure(): array
    {
        $sites = Site::where('is_active', true)->get();
        $results = [];

        foreach ($sites as $site) {
            $results[] = $this->auditSiteSecurityExposure($site);
        }

        return $results;
    }
}
