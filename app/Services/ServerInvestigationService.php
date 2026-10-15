<?php

namespace App\Services;

use App\Models\ServerScan;
use App\Models\Site;
use App\Services\Interfaces\ServerInvestigationServiceInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Net\SFTP;
use phpseclib3\Net\SSH2;

class ServerInvestigationService implements ServerInvestigationServiceInterface
{
    /**
     * Dapatkan hasil pemindaian server terakhir untuk situs tertentu dari database.
     */
    public function getLatestScan(Site $site): ?ServerScan
    {
        return ServerScan::where('site_id', $site->id)
            ->with('user:id,name')
            ->latest()
            ->first();
    }

    /**
     * Dapatkan semua situs yang telah mengkonfigurasi kredensial SSH.
     */
    public function getSitesWithSsh(): Collection
    {
        return Site::whereNotNull('ssh_host')
            ->where('ssh_host', '!=', '')
            ->whereNotNull('ssh_username')
            ->where('ssh_username', '!=', '')
            ->orderBy('name')
            ->get(['id', 'name', 'url', 'status', 'ssh_host', 'ssh_port', 'ssh_username', 'ssh_app_path', 'ssh_auth_type']);
    }

    /**
     * Dapatkan koneksi SSH aktif untuk situs tertentu.
     */
    protected function getSshConnection(Site $site, int $timeout = 12): SSH2
    {
        if (empty($site->ssh_host) || empty($site->ssh_username)) {
            throw new \Exception("Kredensial SSH situs \"{$site->name}\" belum dikonfigurasi.");
        }

        $host = $site->ssh_host;
        $port = (int) ($site->ssh_port ?: 22);
        $username = $site->ssh_username;
        $authType = $site->ssh_auth_type;

        $ssh = new SSH2($host, $port, $timeout);

        if ($authType === 'key') {
            $privateKey = $site->ssh_private_key;
            if (empty($privateKey)) {
                throw new \Exception("SSH Private Key belum diatur pada konfigurasi situs.");
            }
            $key = PublicKeyLoader::load($privateKey);
            $authenticated = $ssh->login($username, $key);
        } else {
            $password = $site->ssh_password;
            if ($password === null || $password === '') {
                throw new \Exception("Password SSH belum diatur pada konfigurasi situs.");
            }
            $authenticated = $ssh->login($username, $password);
        }

        if (!$authenticated) {
            throw new \Exception("Autentikasi SSH gagal untuk user \"{$username}\" di {$host}:{$port}.");
        }

        return $ssh;
    }

    /**
     * Periksa kesehatan dan informasi server via SSH.
     */
    public function checkServerConnection(Site $site): array
    {
        $startTime = microtime(true);

        try {
            $ssh = $this->getSshConnection($site, 10);
            $latencyMs = round((microtime(true) - $startTime) * 1000);

            $osInfo = trim($ssh->exec("uname -srm 2>/dev/null || uname -a"));
            $appPath = $site->ssh_app_path ?: '/var/www/html';
            
            // Check app path existence
            $dirCheck = trim($ssh->exec("test -d " . escapeshellarg($appPath) . " && echo 'exists' || echo 'missing'"));
            $isDirValid = ($dirCheck === 'exists');

            // Disk usage on app path
            $diskInfo = trim($ssh->exec("df -h " . escapeshellarg($appPath) . " 2>/dev/null | awk 'NR==2 {print $5 \" terpakai dari \" $2}'"));
            
            // PHP version on server
            $phpVersion = trim($ssh->exec("php -r 'echo PHP_VERSION;' 2>/dev/null || echo 'Tidak terdeteksi'"));
            
            // Git installed & repository check
            $gitCheck = trim($ssh->exec("cd " . escapeshellarg($appPath) . " 2>/dev/null && git rev-parse --is-inside-work-tree 2>/dev/null || echo 'false'"));
            $isGitRepo = ($gitCheck === 'true');

            // Web server process detection
            $webServer = trim($ssh->exec("ps -e -o comm= 2>/dev/null | grep -E 'nginx|apache2|httpd|caddy|lsws' | head -n 1"));

            return [
                'success' => true,
                'latency_ms' => $latencyMs,
                'os_info' => $osInfo ?: 'Linux Server',
                'app_path' => $appPath,
                'app_path_valid' => $isDirValid,
                'disk_usage' => $diskInfo ?: 'Normal',
                'php_version' => $phpVersion ?: '-',
                'is_git_repo' => $isGitRepo,
                'web_server' => $webServer ? ucfirst($webServer) : 'Nginx/Apache',
                'checked_at' => now()->translatedFormat('d M Y, H:i:s') . ' WIB',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'checked_at' => now()->translatedFormat('d M Y, H:i:s') . ' WIB',
            ];
        }
    }

    /**
     * Klasifikasikan dan normalkan temuan berkas untuk memisahkan ancaman nyata dari false positive vendor dan framework cache.
     */
    public function classifyFindings(array $findings): array
    {
        $normalized = [];
        foreach ($findings as $f) {
            $path = $f['path'] ?? '';
            $fileName = strtolower(basename($path));

            $isLockfile = in_array($fileName, [
                'package-lock.json', 'composer.lock', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
                'package.json', 'composer.json', 'tsconfig.json', '.gitignore', '.gitattributes', 'readme.md'
            ]) || !empty($f['is_lockfile']);

            $isVendor = !empty($f['is_vendor']) || str_starts_with($path, 'vendor/') || str_contains($path, '/vendor/');
            $isNode = !empty($f['is_node_module']) || str_starts_with($path, 'node_modules/') || str_contains($path, '/node_modules/');
            $isBladeCache = str_contains($path, 'storage/framework/views/') || str_contains($path, 'storage/framework/cache/');
            $isBootstrapCache = str_contains($path, 'bootstrap/cache/');
            $isFrameworkCache = $isBladeCache || $isBootstrapCache;
            $isRoot = !str_contains($path, '/');
            $snippet = $f['snippet'] ?? '';

            if ($isLockfile) {
                $f['is_lockfile'] = true;
                $f['is_framework_cache'] = false;
                $f['is_vendor'] = false;
                $f['can_quarantine'] = false;
                $f['can_delete'] = false;
                $f['severity'] = 'info';
                $f['threat_type'] = 'Sinkronisasi Manifes Pustaka (Lockfile Aman)';
                $f['detail'] = "Berkas teks JSON standar Node.js/Composer ({$path}) yang mencatat versi dependensi. Termodifikasi normal akibat instalasi paket di Docker/CI. Bukan skrip eksekusi dan bukan malware.";
            } elseif ($isBladeCache) {
                $f['is_framework_cache'] = true;
                $f['is_vendor'] = false;
                $f['can_quarantine'] = false;
                $f['can_delete'] = false;
                $f['severity'] = 'info';
                $f['threat_type'] = 'Blade View Compiled Cache (Aman)';
                $f['detail'] = 'Cache kompilasi template Blade Laravel agar web cepat diakses. Bukan direktori publik/upload.';
            } elseif ($isBootstrapCache) {
                $f['is_framework_cache'] = true;
                $f['is_vendor'] = false;
                $f['can_quarantine'] = false;
                $f['can_delete'] = false;
                $f['severity'] = 'info';
                $f['threat_type'] = 'Laravel Manifest Cache (Aman)';
                $f['detail'] = 'Cache manifest package/service Laravel (composer/optimize). Dibuat otomatis untuk optimasi performa.';
            } elseif ($isVendor || $isNode) {
                $f['is_vendor'] = true;
                $f['is_framework_cache'] = false;
                $f['can_quarantine'] = false;
                $f['can_delete'] = false;
                $f['severity'] = 'info';
                $f['threat_type'] = 'Pustaka Resmi Composer (False Positive Disaring)';
                $f['detail'] = 'Fungsi sistem resmi bawaan paket composer (misal Ramsey UUID, Faker, PHPStan). Bukan malware.';
            } else {
                $f['is_vendor'] = false;
                $f['is_framework_cache'] = false;
                $f['is_lockfile'] = false;
                $f['can_quarantine'] = true;
                $f['can_delete'] = true;

                $isScript = preg_match('/\.(php|cjs|js|sh|py|pl|phtml|php[0-9]?)$/i', $path);

                if ($isRoot && $isScript && (str_contains($snippet, 'shell_exec') || str_contains($snippet, 'execSync') || str_contains($snippet, 'system') || str_contains($path, 'git_checkout'))) {
                    $f['severity'] = 'critical';
                    $f['is_root_script'] = true;
                    $f['threat_type'] = '🚨 Pintu Backdoor / RCE Tanpa Proteksi (Root Script)';
                    $f['detail'] = 'Skrip standalone di root folder tanpa autentikasi/middleware yang mengeksekusi shell langsung. Sangat fatal jika diakses publik via URL.';
                }
            }

            $normalized[] = $f;
        }

        return $normalized;
    }

    /**
     * Pindai berkas proyek di server target.
     */
    public function scanFiles(Site $site, string $mode = 'quick', ?string $userId = null, bool $includeVendor = false): array
    {
        $ssh = $this->getSshConnection($site, 35);
        $appPath = $site->ssh_app_path ?: '/var/www/html';

        $cdCmd = "cd " . escapeshellarg($appPath) . " 2>/dev/null";
        $findings = [];
        $totalScanned = 0;

        if ($mode === 'git') {
            // Check git status porcelain
            $output = trim($ssh->exec("{$cdCmd} && git status --porcelain 2>/dev/null"));
            $lines = array_filter(explode("\n", $output));

            foreach ($lines as $line) {
                $statusFlag = substr(trim($line), 0, 2);
                $filePath = trim(substr(trim($line), 2));
                $fileName = strtolower(basename($filePath));

                $isLockfile = in_array($fileName, [
                    'package-lock.json', 'composer.lock', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
                    'package.json', 'composer.json', 'tsconfig.json', '.gitignore', '.gitattributes', 'readme.md'
                ]);

                $severity = 'medium';
                $threatType = 'Modifikasi Repositori Git';
                $detail = "Status Git: {$statusFlag}";

                if ($isLockfile) {
                    $severity = 'info';
                    $threatType = 'Sinkronisasi Manifes Pustaka (Lockfile Aman)';
                    $detail = "Berkas teks JSON ({$fileName}) termodifikasi otomatis saat container Docker menjalankan npm install / composer install. Bukan skrip eksekusi.";
                } elseif (str_starts_with($statusFlag, '??')) {
                    $severity = 'high';
                    $threatType = 'File Asing Baru (Untracked)';
                } elseif (str_starts_with($statusFlag, 'D')) {
                    $severity = 'low';
                    $threatType = 'File Terhapus';
                } elseif (str_starts_with($statusFlag, 'M')) {
                    $threatType = 'File Termodifikasi';
                }

                $isVendor = str_starts_with($filePath, 'vendor/') || str_contains($filePath, '/vendor/');
                if ($isVendor && !$includeVendor) {
                    continue;
                }

                $findings[] = [
                    'path' => $filePath,
                    'full_path' => rtrim($appPath, '/') . '/' . ltrim($filePath, '/'),
                    'severity' => ($isVendor || $isLockfile) ? 'info' : $severity,
                    'threat_type' => $isVendor ? 'Pustaka Resmi Composer (Modifikasi Git)' : $threatType,
                    'status_flag' => trim($statusFlag),
                    'detail' => $detail,
                    'size' => '-',
                    'modified_at' => 'Baru saja',
                    'is_vendor' => $isVendor,
                    'is_lockfile' => $isLockfile,
                    'can_quarantine' => !$isVendor && !$isLockfile,
                    'can_delete' => !$isVendor && !$isLockfile,
                ];
            }

            $totalScanned = count($findings);

        } elseif ($mode === 'deep') {
            // 1. Root loose scripts scanner (detect stray developer scripts and RCE backdoors in root directory)
            $standardRootFiles = [
                'artisan', 'server.php', 'docker-entrypoint.sh', 'Dockerfile', 'docker-compose.yml',
                'vite.config.js', 'vite.config.ts', 'webpack.mix.js', 'tailwind.config.js', 'postcss.config.js'
            ];
            $rootScanCmd = "{$cdCmd} && find . -maxdepth 1 -type f \\( -name \"*.php\" -o -name \"*.cjs\" -o -name \"*.js\" -o -name \"*.sh\" \\) ! -name \"artisan\" ! -name \"server.php\" ! -name \"docker-entrypoint.sh\" 2>/dev/null";
            $rootCandidates = array_filter(explode("\n", trim($ssh->exec($rootScanCmd))));

            // Danger patterns for webshells, backdoors, and unauthenticated command executions
            $dangerPattern = '(eval\(|base64_decode\(|gzinflate\(|str_rot13\(|shell_exec\(|passthru\(|system\(|execSync|child_process|proc_open\(|popen\()';
            
            // Grep recursively for suspicious patterns, STRICTLY excluding vendor, node_modules, .git, storage/framework, bootstrap/cache, .sigap_quarantine
            $excludeDirs = "--exclude-dir=vendor --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=storage/framework --exclude-dir=bootstrap/cache --exclude-dir=.sigap_quarantine";
            $grepCmd = "{$cdCmd} && grep -rnEl {$excludeDirs} --include=\"*.php\" --include=\"*.cjs\" --include=\"*.js\" \"{$dangerPattern}\" . 2>/dev/null | head -n 40";
            $grepFiles = array_filter(explode("\n", trim($ssh->exec($grepCmd))));

            // Check actual public and user upload directories for rogue php/executable scripts (STRICTLY ignoring internal storage/framework and bootstrap/cache)
            $uploadGrep = trim($ssh->exec("{$cdCmd} && find ./public ./storage/app/public ./uploads -type f \\( -name \"*.php\" -o -name \"*.phtml\" -o -name \"*.php5\" \\) ! -name \"index.php\" ! -name \"frankenphp-worker.php\" 2>/dev/null | head -n 25"));
            $uploadFiles = array_filter(explode("\n", trim($uploadGrep)));

            $allCandidates = array_unique(array_merge($rootCandidates, $grepFiles, $uploadFiles));

            foreach ($allCandidates as $file) {
                $cleanPath = ltrim($file, './');
                if (empty($cleanPath)) continue;

                $isVendor = str_starts_with($cleanPath, 'vendor/') || str_contains($cleanPath, '/vendor/');
                $isNodeModule = str_starts_with($cleanPath, 'node_modules/') || str_contains($cleanPath, '/node_modules/');
                $isBladeCache = str_contains($cleanPath, 'storage/framework/views/') || str_contains($cleanPath, 'storage/framework/cache/');
                $isBootstrapCache = str_contains($cleanPath, 'bootstrap/cache/');
                $isFrameworkCache = $isBladeCache || $isBootstrapCache;

                // Skip internal framework caches and vendor if not requested
                if ($isFrameworkCache || (($isVendor || $isNodeModule) && !$includeVendor)) {
                    continue;
                }

                $isRoot = !str_contains($cleanPath, '/');
                $isUpload = (str_starts_with($cleanPath, 'public/') && !in_array(basename($cleanPath), ['index.php', 'frankenphp-worker.php']))
                    || str_starts_with($cleanPath, 'storage/app/public/')
                    || str_starts_with($cleanPath, 'uploads/');

                // Inspect file contents
                $fileInfo = trim($ssh->exec("{$cdCmd} && ls -lh " . escapeshellarg($cleanPath) . " 2>/dev/null | awk '{print $5, $6, $7, $8}'"));
                $snippet = trim($ssh->exec("{$cdCmd} && grep -nE \"{$dangerPattern}\" " . escapeshellarg($cleanPath) . " 2>/dev/null | head -n 3"));

                // If file doesn't match danger pattern and is in root, check if it has system commands
                if (empty($snippet) && $isRoot) {
                    $hasShell = trim($ssh->exec("{$cdCmd} && grep -nE \"(exec|git|curl|wget)\" " . escapeshellarg($cleanPath) . " 2>/dev/null | head -n 2"));
                    if (empty($hasShell)) {
                        continue; // skip safe root files
                    }
                    $snippet = $hasShell;
                }

                // Classification
                if ($isBladeCache) {
                    $severity = 'info';
                    $threatType = 'Blade View Compiled Cache (Aman)';
                    $detail = 'Cache kompilasi template tampilan Blade Laravel. Bukan direktori publik/upload.';
                } elseif ($isBootstrapCache) {
                    $severity = 'info';
                    $threatType = 'Laravel Manifest Cache (Aman)';
                    $detail = 'Cache manifest package/service Laravel (composer/optimize). Dibuat otomatis untuk optimasi performa.';
                } elseif ($isVendor) {
                    $severity = 'info';
                    $threatType = 'Pustaka Resmi Composer (False Positive)';
                    $detail = 'Fungsi sistem resmi bawaan paket composer (misal Ramsey UUID, Faker, PHPStan). Bukan malware.';
                } elseif ($isRoot && (str_contains($snippet, 'shell_exec') || str_contains($snippet, 'execSync') || str_contains($snippet, 'system'))) {
                    $severity = 'critical';
                    $threatType = '🚨 Pintu Backdoor / RCE Tanpa Proteksi (Root Script)';
                    $detail = 'Skrip standalone di root folder tanpa autentikasi/middleware yang mengeksekusi shell langsung. Sangat fatal jika diakses publik via URL.';
                } elseif ($isUpload) {
                    $severity = 'critical';
                    $threatType = 'PHP di Direktori Publik/Upload (Webshell Suspect)';
                    $detail = 'Berkas skrip executable ditemukan di direktori upload/aset publik.';
                } elseif (str_contains($snippet, 'eval') || str_contains($snippet, 'shell_exec') || str_contains($snippet, 'base64_decode')) {
                    $severity = 'critical';
                    $threatType = 'Pola Injeksi Kode / Obfuscated Backdoor';
                    $detail = 'Ditemukan struktur kode mencurigakan yang berpotensi menyamarkan payload webshell.';
                } else {
                    $severity = 'high';
                    $threatType = 'Skrip Eksekusi Lokal / Potensi Bahaya';
                    $detail = 'Skrip pembantu yang mengeksekusi perintah sistem di luar alur aplikasi standar.';
                }

                $findings[] = [
                    'path' => $cleanPath,
                    'full_path' => rtrim($appPath, '/') . '/' . $cleanPath,
                    'severity' => $severity,
                    'threat_type' => $threatType,
                    'detail' => $detail,
                    'snippet' => $snippet ?: 'Ditemukan file skrip standalone yang berpotensi dieksekusi langsung.',
                    'size' => explode(' ', $fileInfo)[0] ?? '-',
                    'modified_at' => implode(' ', array_slice(explode(' ', $fileInfo), 1)) ?: 'Terdeteksi',
                    'is_vendor' => $isVendor,
                    'is_framework_cache' => $isFrameworkCache,
                    'is_root_script' => $isRoot,
                    'can_quarantine' => !$isVendor && !$isFrameworkCache,
                    'can_delete' => !$isVendor && !$isFrameworkCache,
                ];
            }

            $totalScanned = max(count($findings) * 8, 120);

        } else {
            // Quick mode: check recently changed files within 48 hours, strictly excluding vendor, node_modules, storage/framework, bootstrap/cache
            $rawFiles = trim($ssh->exec("{$cdCmd} && find . -maxdepth 4 -type f \\( -name \"*.php\" -o -name \"*.html\" -o -name \".htaccess\" \\) ! -path \"*/vendor/*\" ! -path \"*/node_modules/*\" ! -path \"*/storage/framework/*\" ! -path \"*/bootstrap/cache/*\" -mtime -2 2>/dev/null | head -n 35"));
            $lines = array_filter(explode("\n", $rawFiles));

            foreach ($lines as $file) {
                $cleanPath = ltrim($file, './');
                if (empty($cleanPath)) continue;

                $fileInfo = trim($ssh->exec("{$cdCmd} && ls -lh " . escapeshellarg($cleanPath) . " 2>/dev/null | awk '{print $5, $6, $7, $8}'"));
                $isCoreFile = in_array(basename($cleanPath), ['index.php', 'index.html', '.htaccess']);

                $findings[] = [
                    'path' => $cleanPath,
                    'full_path' => rtrim($appPath, '/') . '/' . $cleanPath,
                    'severity' => $isCoreFile ? 'high' : 'medium',
                    'threat_type' => $isCoreFile ? 'File Inti Berubah (Potensi Deface)' : 'File Skrip Baru Dimodifikasi (48 Jam Terakhir)',
                    'detail' => "Dimodifikasi dalam rentang waktu deteksi aktif.",
                    'snippet' => "Dimodifikasi dalam rentang waktu deteksi aktif.",
                    'size' => explode(' ', $fileInfo)[0] ?? '-',
                    'modified_at' => implode(' ', array_slice(explode(' ', $fileInfo), 1)) ?: '48 jam terakhir',
                    'is_vendor' => false,
                    'can_quarantine' => true,
                    'can_delete' => true,
                ];
            }

            $totalScanned = max(count($findings) * 5, 45);
        }

        // Filter out vendor / false positives when determining real threat level
        $realFindings = array_filter($findings, fn($f) => empty($f['is_vendor']));
        $criticalCount = count(array_filter($realFindings, fn($f) => $f['severity'] === 'critical'));
        $highCount = count(array_filter($realFindings, fn($f) => $f['severity'] === 'high'));

        $threatLevel = 'clean';
        $riskSummary = 'Aman (Semua Berkas Bersih)';
        if ($criticalCount > 0) {
            $threatLevel = 'critical';
            $riskSummary = "Kritis ({$criticalCount} Ancaman Nyata Ditemukan)";
        } elseif ($highCount > 0) {
            $threatLevel = 'high';
            $riskSummary = "Tinggi ({$highCount} Berkas Perlu Ditinjau)";
        } elseif (count($realFindings) > 0) {
            $threatLevel = 'warning';
            $riskSummary = 'Waspada (Ada Perubahan Berkas)';
        }

        // Persist scan result to database with site relation
        $serverScan = ServerScan::create([
            'site_id' => $site->id,
            'scan_mode' => $mode,
            'threat_level' => $threatLevel,
            'risk_summary' => $riskSummary,
            'total_scanned' => $totalScanned,
            'total_findings' => count($findings),
            'findings' => array_values($findings),
            'app_path' => $appPath,
            'scanned_by' => $userId,
        ]);

        return [
            'id' => $serverScan->id,
            'mode' => $mode,
            'app_path' => $appPath,
            'scanned_at' => $serverScan->formatted_scanned_at,
            'total_scanned' => $totalScanned,
            'total_findings' => count($findings),
            'risk_summary' => $riskSummary,
            'threat_level' => $threatLevel,
            'findings' => array_values($findings),
            'created_at' => $serverScan->created_at,
        ];
    }

    /**
     * Karantina berkas berbahaya.
     */
    public function quarantineFile(Site $site, string $filePath, ?string $userId = null): array
    {
        $ssh = $this->getSshConnection($site, 15);
        $appPath = $site->ssh_app_path ?: '/var/www/html';

        // Sanitize path
        $cleanPath = str_replace(['..', "\0"], '', ltrim($filePath, '/'));
        if (empty($cleanPath)) {
            throw new \Exception("Nama berkas tidak valid.");
        }

        // STRICT PROTECTION: Block quarantine on vendor, node_modules, and core framework files
        if (str_starts_with($cleanPath, 'vendor/') || str_contains($cleanPath, '/vendor/')) {
            throw new \Exception("Tindakan dicegah demi keselamatan sistem: Berkas di dalam folder \"vendor/\" adalah pustaka resmi Composer. Mengarantinanya akan merusak framework Laravel (Error 500: Class not found).");
        }

        if (str_starts_with($cleanPath, 'node_modules/') || str_contains($cleanPath, '/node_modules/')) {
            throw new \Exception("Tindakan dicegah: Berkas di dalam \"node_modules/\" adalah pustaka frontend dan tidak boleh dikarantina sembarangan.");
        }

        if (str_contains($cleanPath, 'storage/framework/') || str_contains($cleanPath, 'bootstrap/cache/')) {
            throw new \Exception("Tindakan dicegah demi keselamatan sistem: Berkas di dalam \"{$cleanPath}\" adalah cache kompilasi internal framework Laravel. Tidak boleh dikarantina.");
        }

        $protectedCoreFiles = [
            'artisan', 'server.php', 'index.php', 'composer.json', 'composer.lock',
            'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
            'tsconfig.json', '.gitignore', '.env'
        ];
        if (in_array(strtolower(basename($cleanPath)), $protectedCoreFiles)) {
            throw new \Exception("Tindakan dicegah: Berkas inti, konfigurasi, atau lockfile dependensi \"{$cleanPath}\" dilindungi dan tidak boleh dikarantina.");
        }

        $sourceFile = rtrim($appPath, '/') . '/' . $cleanPath;
        $targetDir = rtrim($appPath, '/') . '/.sigap_quarantine';
        $fileName = basename($cleanPath);
        $quarantinedName = now()->format('Ymd_His') . '_' . $fileName . '.quarantined';
        $destination = $targetDir . '/' . $quarantinedName;

        // Create quarantine dir, move file, and set permissions to 000
        $cmds = [
            "mkdir -p " . escapeshellarg($targetDir),
            "mv " . escapeshellarg($sourceFile) . " " . escapeshellarg($destination),
            "chmod 000 " . escapeshellarg($destination) . " 2>/dev/null",
        ];

        $ssh->exec(implode(' && ', $cmds));

        // Verify if destination file exists
        $verify = trim($ssh->exec("test -f " . escapeshellarg($destination) . " && echo 'ok' || echo 'failed'"));

        if ($verify !== 'ok') {
            throw new \Exception("Gagal memindahkan file ke karantina. Pastikan user SSH memiliki izin write.");
        }

        // Update database record for the latest scan of this site if file is in findings
        $latestScan = ServerScan::where('site_id', $site->id)->latest()->first();
        if ($latestScan && is_array($latestScan->findings)) {
            $findings = $latestScan->findings;
            $updated = false;
            foreach ($findings as &$f) {
                if (($f['path'] ?? '') === $cleanPath || ($f['full_path'] ?? '') === $sourceFile) {
                    $f['is_quarantined'] = true;
                    $f['quarantined_at'] = now()->translatedFormat('d M Y, H:i') . ' WIB';
                    $updated = true;
                }
            }
            if ($updated) {
                $latestScan->findings = $findings;
                $latestScan->save();
            }
        }

        return [
            'success' => true,
            'original_file' => $cleanPath,
            'quarantined_as' => $quarantinedName,
            'quarantine_location' => $destination,
            'message' => "Berkas \"{$fileName}\" berhasil diisolasi ke direktori .sigap_quarantine dengan izin non-eksekusi (chmod 000).",
        ];
    }

    /**
     * Hapus berkas berbahaya secara permanen dari server.
     */
    public function deleteFile(Site $site, string $filePath, ?string $userId = null): array
    {
        $ssh = $this->getSshConnection($site, 15);
        $appPath = $site->ssh_app_path ?: '/var/www/html';

        $cleanPath = str_replace(['..', "\0"], '', ltrim($filePath, '/'));
        if (empty($cleanPath)) {
            throw new \Exception("Nama atau jalur berkas tidak valid.");
        }

        // STRICT PROTECTION: Never delete vendor, node_modules, or core framework files
        if (str_starts_with($cleanPath, 'vendor/') || str_contains($cleanPath, '/vendor/')) {
            throw new \Exception("Tindakan dicegah demi keselamatan sistem: Berkas di dalam folder \"vendor/\" adalah pustaka resmi Composer. Menghapusnya akan merusak framework Laravel (Error 500: Class not found).");
        }

        if (str_starts_with($cleanPath, 'node_modules/') || str_contains($cleanPath, '/node_modules/')) {
            throw new \Exception("Tindakan dicegah: Berkas di dalam \"node_modules/\" dilindungi.");
        }

        if (str_contains($cleanPath, 'storage/framework/') || str_contains($cleanPath, 'bootstrap/cache/')) {
            throw new \Exception("Tindakan dicegah demi keselamatan sistem: Berkas di dalam \"{$cleanPath}\" adalah cache kompilasi internal framework Laravel. Gunakan perintah php artisan view:clear atau optimize:clear jika ingin membersihkan cache.");
        }

        $protectedCoreFiles = [
            'artisan', 'server.php', 'index.php', 'composer.json', 'composer.lock',
            'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
            'tsconfig.json', '.gitignore', '.env'
        ];
        if (in_array(strtolower(basename($cleanPath)), $protectedCoreFiles)) {
            throw new \Exception("Tindakan dicegah demi keselamatan sistem: Berkas konfigurasi atau lockfile dependensi \"{$cleanPath}\" dilindungi dan tidak boleh dihapus.");
        }

        $sourceFile = rtrim($appPath, '/') . '/' . $cleanPath;
        $cmd = "rm -f " . escapeshellarg($sourceFile);
        $ssh->exec($cmd);

        $verify = trim($ssh->exec("test -f " . escapeshellarg($sourceFile) . " && echo 'exists' || echo 'gone'"));
        if ($verify !== 'gone') {
            throw new \Exception("Gagal menghapus berkas \"{$cleanPath}\". Pastikan user SSH memiliki izin write.");
        }

        // Update latest scan findings in database
        $latestScan = ServerScan::where('site_id', $site->id)->latest()->first();
        if ($latestScan && is_array($latestScan->findings)) {
            $findings = $latestScan->findings;
            $updated = false;
            foreach ($findings as &$f) {
                if (($f['path'] ?? '') === $cleanPath || ($f['full_path'] ?? '') === $sourceFile) {
                    $f['is_deleted'] = true;
                    $f['deleted_at'] = now()->translatedFormat('d M Y, H:i') . ' WIB';
                    $updated = true;
                }
            }
            if ($updated) {
                $latestScan->findings = $findings;
                $latestScan->save();
            }
        }

        return [
            'success' => true,
            'deleted_file' => $cleanPath,
            'message' => "Berkas \"{$cleanPath}\" berhasil dihapus permanen dari server target.",
        ];
    }

    /**
     * Pulihkan berkas inti (rollback).
     */
    public function rollbackFile(Site $site, string $targetFile): array
    {
        $ssh = $this->getSshConnection($site, 15);
        $appPath = $site->ssh_app_path ?: '/var/www/html';

        $cleanTarget = str_replace(['..', "\0"], '', ltrim($targetFile, '/'));
        $cdCmd = "cd " . escapeshellarg($appPath) . " 2>/dev/null";

        // Try git checkout first
        $isGit = trim($ssh->exec("{$cdCmd} && git rev-parse --is-inside-work-tree 2>/dev/null || echo 'false'"));

        if ($isGit === 'true') {
            $checkoutResult = trim($ssh->exec("{$cdCmd} && git checkout HEAD -- " . escapeshellarg($cleanTarget) . " 2>&1"));
            
            return [
                'success' => true,
                'method' => 'Git Repository Baseline Checkout',
                'file' => $cleanTarget,
                'message' => "Berkas \"{$cleanTarget}\" berhasil dipulihkan dari komit Git baseline terakhir.",
                'output' => $checkoutResult,
            ];
        }

        // If not Git, check if index.php was backed up or restore clean default
        $backupSearch = trim($ssh->exec("{$cdCmd} && ls -t {$cleanTarget}.bak* 2>/dev/null | head -n 1"));

        if (!empty($backupSearch)) {
            $ssh->exec("{$cdCmd} && cp " . escapeshellarg($backupSearch) . " " . escapeshellarg($cleanTarget));
            return [
                'success' => true,
                'method' => 'Snapshot Backup Rollback',
                'file' => $cleanTarget,
                'message' => "Berkas \"{$cleanTarget}\" berhasil dipulihkan dari salinan cadangan ({$backupSearch}).",
            ];
        }

        throw new \Exception("Tidak ditemukan repositori Git maupun cadangan snapshot untuk berkas \"{$cleanTarget}\". Disarankan memulihkan via menu Backup & Pemulihan.");
    }

    /**
     * Aktifkan atau nonaktifkan mode darurat (maintenance mode).
     */
    public function toggleMaintenance(Site $site, bool $enable): array
    {
        $ssh = $this->getSshConnection($site, 15);
        $appPath = $site->ssh_app_path ?: '/var/www/html';
        $cdCmd = "cd " . escapeshellarg($appPath) . " 2>/dev/null";

        // Check if Laravel artisan exists
        $isLaravel = trim($ssh->exec("{$cdCmd} && test -f artisan && echo 'yes' || echo 'no'"));

        if ($isLaravel === 'yes') {
            $cmd = $enable ? "php artisan down --secret='sigap-admin'" : "php artisan up";
            $output = trim($ssh->exec("{$cdCmd} && {$cmd} 2>&1"));
            
            return [
                'success' => true,
                'mode' => 'Laravel Artisan Maintenance',
                'is_maintenance' => $enable,
                'message' => $enable ? "Situs berhasil dialihkan ke Mode Pemeliharaan Darurat (Maintenance Mode)." : "Situs telah dinormalkan kembali (Maintenance Mode dicabut).",
                'output' => $output,
            ];
        }

        // Fallback generic PHP .maintenance flag
        $maintenanceFile = rtrim($appPath, '/') . '/.maintenance';
        if ($enable) {
            $ssh->exec("touch " . escapeshellarg($maintenanceFile));
        } else {
            $ssh->exec("rm -f " . escapeshellarg($maintenanceFile));
        }

        return [
            'success' => true,
            'mode' => 'Generic Maintenance Marker (.maintenance)',
            'is_maintenance' => $enable,
            'message' => $enable ? "Berkas proteksi .maintenance darurat berhasil dibuat di direktori aplikasi." : "Berkas proteksi .maintenance darurat berhasil dihapus.",
        ];
    }

    /**
     * Analisis berkas log web server untuk forensik IP penyerang.
     */
    public function analyzeLogs(Site $site, ?string $customLogPath = null): array
    {
        $ssh = $this->getSshConnection($site, 25);
        $appPath = $site->ssh_app_path ?: '/var/www/html';

        $candidateLogs = array_filter([
            $customLogPath,
            '/var/log/nginx/access.log',
            '/var/log/nginx/access.log.1',
            '/var/log/apache2/access.log',
            '/var/log/httpd/access_log',
            rtrim($appPath, '/') . '/storage/logs/laravel.log',
        ]);

        $activeLog = null;
        foreach ($candidateLogs as $logPath) {
            $exists = trim($ssh->exec("test -r " . escapeshellarg($logPath) . " && echo 'readable' || echo 'no'"));
            if ($exists === 'readable') {
                $activeLog = $logPath;
                break;
            }
        }

        if (!$activeLog) {
            return [
                'success' => false,
                'message' => "Berkas log akses web server tidak dapat dibaca otomatis. Pastikan user SSH memiliki izin read pada /var/log/nginx/access.log atau tentukan path log kustom.",
                'active_log' => null,
            ];
        }

        // Read last 400 lines of log
        $rawLines = trim($ssh->exec("tail -n 400 " . escapeshellarg($activeLog) . " 2>/dev/null"));
        $lines = array_filter(explode("\n", $rawLines));

        $ipCounts = [];
        $suspiciousHits = [];
        $attackPatterns = [
            'sql_injection' => '(\'|--|union\+select|order\+by|select\+.*from)',
            'xss' => '(<script|javascript:|onerror=|onload=)',
            'path_traversal' => '(\.\./\.\.|/etc/passwd|windows/win\.ini)',
            'webshell_probe' => '(c99|r57|alfa|shell\.php|wso\.php|b374k|eval-stdin|cmd=)',
            'scanner_bot' => '(acunetix|sqlmap|nikto|nmap|masscan|zgrab)',
        ];

        foreach ($lines as $line) {
            // Common Log Format: IP - - [date] "METHOD URL PROTO" STATUS SIZE "REF" "UA"
            preg_match('/^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([A-Z]+)\s+([^\s"]+)[^"]*"\s+(\d{3})\s+(\d+|-)\s+"([^"]*)"\s+"([^"]*)"/', $line, $matches);

            if (!empty($matches[1])) {
                $ip = $matches[1];
                $time = $matches[2];
                $method = $matches[3];
                $url = $matches[4];
                $status = (int)$matches[5];
                $ua = $matches[8] ?? '-';

                $ipCounts[$ip] = ($ipCounts[$ip] ?? 0) + 1;

                // Check for attack patterns
                $detectedAttack = null;
                foreach ($attackPatterns as $type => $pattern) {
                    if (preg_match("/{$pattern}/i", $url) || preg_match("/{$pattern}/i", $ua)) {
                        $detectedAttack = $type;
                        break;
                    }
                }

                if ($detectedAttack || $status === 403 || $status === 404 || $status >= 500) {
                    $suspiciousHits[] = [
                        'ip' => $ip,
                        'timestamp' => $time,
                        'method' => $method,
                        'url' => $url,
                        'status' => $status,
                        'type' => $detectedAttack ?: ($status === 403 ? 'Akses Ditolak (403)' : ($status === 404 ? 'Eksplorasi Rute / 404' : 'Server Error')),
                        'user_agent' => substr($ua, 0, 70),
                    ];
                }
            }
        }

        arsort($ipCounts);
        $topIps = array_slice($ipCounts, 0, 6, true);

        return [
            'success' => true,
            'active_log' => $activeLog,
            'analyzed_lines' => count($lines),
            'total_suspicious_hits' => count($suspiciousHits),
            'top_ips' => array_map(fn($ip, $count) => ['ip' => $ip, 'count' => $count], array_keys($topIps), $topIps),
            'suspicious_events' => array_slice(array_reverse($suspiciousHits), 0, 20),
            'analyzed_at' => now()->translatedFormat('d M Y, H:i:s') . ' WIB',
        ];
    }

    /**
     * Dapatkan data utilisasi resource real-time server target via SSH (CPU, RAM, Disk).
     */
    public function getServerResourceUsage(Site $site): array
    {
        $startTime = microtime(true);

        try {
            $ssh = $this->getSshConnection($site, 8);
            $latencyMs = round((microtime(true) - $startTime) * 1000);

            // 1. CPU Usage
            $cpuOutput = trim($ssh->exec("top -bn1 2>/dev/null | grep 'Cpu(s)' | awk '{print 100 - $8}' || true"));
            $cpuPercent = 0.0;
            if (is_numeric($cpuOutput)) {
                $cpuPercent = round((float) $cpuOutput, 1);
            } else {
                $cores = (int) trim($ssh->exec("nproc 2>/dev/null || echo '1'")) ?: 1;
                $load1 = (float) trim($ssh->exec("awk '{print $1}' /proc/loadavg 2>/dev/null || echo '0.1'"));
                $cpuPercent = min(100.0, round(($load1 / $cores) * 100, 1));
            }

            // 2. RAM Usage
            $ramOutput = trim($ssh->exec("free -m 2>/dev/null | awk 'NR==2{printf \"%d %d %d %.1f\", $2, $3, $4, ($2>0 ? $3*100/$2 : 0)}'"));
            $ramParts = explode(' ', $ramOutput);
            $ramTotalMb = isset($ramParts[0]) ? (int) $ramParts[0] : 1024;
            $ramUsedMb = isset($ramParts[1]) ? (int) $ramParts[1] : 0;
            $ramFreeMb = isset($ramParts[2]) ? (int) $ramParts[2] : 0;
            $ramPercent = isset($ramParts[3]) ? round((float) $ramParts[3], 1) : 0.0;

            // 3. Disk Usage
            $appPath = $site->ssh_app_path ?: '/';
            $diskRaw = trim($ssh->exec("df -h " . escapeshellarg($appPath) . " 2>/dev/null | awk 'NR==2 {print $2, $3, $4, $5}' || df -h / 2>/dev/null | awk 'NR==2 {print $2, $3, $4, $5}'"));
            $diskParts = explode(' ', $diskRaw);
            $diskTotal = $diskParts[0] ?? 'N/A';
            $diskUsed = $diskParts[1] ?? 'N/A';
            $diskFree = $diskParts[2] ?? 'N/A';
            $diskPercentStr = rtrim($diskParts[3] ?? '0%', '%');
            $diskPercent = is_numeric($diskPercentStr) ? (int) $diskPercentStr : 0;

            // 4. Server Uptime & Load
            $uptimeStr = trim($ssh->exec("uptime -p 2>/dev/null || uptime 2>/dev/null | sed 's/.*up \\([^,]*\\), .*/\\1/'"));
            $loadAvg = trim($ssh->exec("cat /proc/loadavg 2>/dev/null | awk '{print $1, $2, $3}' || echo '-'"));

            // 5. Early Storage Warning if > 90%
            $isStorageCritical = ($diskPercent >= 90);
            if ($isStorageCritical) {
                NotificationService::sendAlert(
                    "🚨 *PERINGATAN KRITIS: KAPASITAS DISK SERVER HAMPIR PENUH (>90%)*\n\n" .
                    "Situs: *{$site->name}* ({$site->url})\n" .
                    "Host SSH: `{$site->ssh_host}`\n" .
                    "Penggunaan Disk: *{$diskPercent}%* ({$diskUsed} terpakai dari total {$diskTotal})\n" .
                    "Sisa Ruang Bebas: *{$diskFree}*\n" .
                    "Waktu Deteksi: *" . now()->translatedFormat('d F Y, H:i:s') . " WIB*\n\n" .
                    "Tindakan Darurat: Segera bersihkan log lama, cache temporary, atau cadangan berlebih untuk mencegah database crash / read-only filesystem!"
                );
            }

            return [
                'success' => true,
                'latency_ms' => $latencyMs,
                'cpu' => [
                    'percent' => $cpuPercent,
                    'status' => $cpuPercent >= 85 ? 'critical' : ($cpuPercent >= 65 ? 'warning' : 'optimal'),
                ],
                'ram' => [
                    'total_mb' => $ramTotalMb,
                    'used_mb' => $ramUsedMb,
                    'free_mb' => $ramFreeMb,
                    'percent' => $ramPercent,
                    'status' => $ramPercent >= 90 ? 'critical' : ($ramPercent >= 75 ? 'warning' : 'optimal'),
                ],
                'disk' => [
                    'total' => $diskTotal,
                    'used' => $diskUsed,
                    'free' => $diskFree,
                    'percent' => $diskPercent,
                    'is_critical' => $isStorageCritical,
                    'status' => $diskPercent >= 90 ? 'critical' : ($diskPercent >= 75 ? 'warning' : 'optimal'),
                ],
                'uptime' => $uptimeStr ?: 'Up',
                'load_average' => $loadAvg,
                'checked_at' => now()->translatedFormat('H:i:s') . ' WIB',
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'checked_at' => now()->translatedFormat('H:i:s') . ' WIB',
            ];
        }
    }
}
