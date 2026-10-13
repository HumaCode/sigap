<?php

namespace App\Services;

use App\Models\Site;
use App\Models\SiteBackup;
use Illuminate\Support\Str;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Net\SFTP;
use phpseclib3\Net\SSH2;

class BackupService
{
    /**
     * Create an SSH2 connection for a given site.
     */
    protected function getSshConnection(Site $site): SSH2
    {
        if (empty($site->ssh_host) || empty($site->ssh_username)) {
            throw new \Exception("Kredensial SSH situs \"{$site->name}\" belum lengkap (Host atau Username kosong).");
        }

        $host = $site->ssh_host;
        $port = (int)($site->ssh_port ?: 22);
        $username = $site->ssh_username;
        $authType = $site->ssh_auth_type;

        $ssh = new SSH2($host, $port, 15);

        if ($authType === 'key') {
            $privateKey = $site->ssh_private_key;
            if (!$privateKey) {
                throw new \Exception("SSH Private Key kosong.");
            }
            $key = PublicKeyLoader::load($privateKey);
            $authenticated = $ssh->login($username, $key);
        } else {
            $password = $site->ssh_password;
            $authenticated = $ssh->login($username, $password);
        }

        if (!$authenticated) {
            throw new \Exception("Autentikasi SSH gagal untuk user \"{$username}\" di {$host}:{$port}.");
        }

        return $ssh;
    }

    /**
     * Create an SFTP connection for a given site.
     */
    protected function getSftpConnection(Site $site): SFTP
    {
        if (empty($site->ssh_host) || empty($site->ssh_username)) {
            throw new \Exception("Kredensial SSH situs \"{$site->name}\" belum lengkap.");
        }

        $host = $site->ssh_host;
        $port = (int)($site->ssh_port ?: 22);
        $username = $site->ssh_username;
        $authType = $site->ssh_auth_type;

        $sftp = new SFTP($host, $port, 20);

        if ($authType === 'key') {
            $key = PublicKeyLoader::load($site->ssh_private_key);
            $authenticated = $sftp->login($username, $key);
        } else {
            $authenticated = $sftp->login($username, $site->ssh_password);
        }

        if (!$authenticated) {
            throw new \Exception("Autentikasi SFTP gagal untuk user \"{$username}\".");
        }

        return $sftp;
    }

    /**
     * Create a new backup archive of the remote site directory via SSH.
     */
    public function createBackup(Site $site, ?string $notes = null, string $type = 'manual', ?string $userId = null): SiteBackup
    {
        $appPath = rtrim($site->ssh_app_path ?: '', '/');
        if (empty($appPath)) {
            throw new \Exception("Path aplikasi server belum ditentukan pada situs \"{$site->name}\".");
        }

        $ssh = $this->getSshConnection($site);
        $ssh->setTimeout(300); // 5 minutes timeout for archiving large project files

        // Generate backup filename & directory
        $parentDir = dirname($appPath);
        $cleanSlug = Str::slug($site->name, '_') ?: 'site';
        $timestamp = now()->format('Ymd_His');
        $filename = "backup_{$cleanSlug}_{$timestamp}.tar.gz";

        $compositeScript = <<<BASH
if [ ! -d "{$appPath}" ]; then
    echo "SIGAP_ERR|Direktori aplikasi ({$appPath}) tidak ditemukan di server."
    exit 1
fi

if mkdir -p "{$parentDir}/sigap_backups" 2>/dev/null && [ -w "{$parentDir}/sigap_backups" ]; then
    BDIR="{$parentDir}/sigap_backups"
else
    BDIR="{$appPath}/.sigap_backups"
    mkdir -p "\$BDIR" 2>/dev/null
    echo 'Deny from all' > "\$BDIR/.htaccess" 2>/dev/null
fi

TARGET="\$BDIR/{$filename}"
cd "{$appPath}" && tar -czf "\$TARGET" --exclude="./sigap_backups" --exclude="./.sigap_backups" --exclude="./.git" --exclude="./node_modules" . 2>&1

if [ -f "\$TARGET" ]; then
    SIZE=$(stat -c %s "\$TARGET" 2>/dev/null || ls -l "\$TARGET" | awk '{print $5}')
    echo "SIGAP_OK|\$TARGET|\$SIZE"
else
    echo "SIGAP_ERR|Gagal membuat file arsip tar di \$TARGET"
fi
BASH;

        $output = trim($ssh->exec($compositeScript));

        if (!str_contains($output, 'SIGAP_OK|')) {
            throw new \Exception("Gagal membuat arsip backup di server. Keterangan: " . $output);
        }

        $pos = strpos($output, 'SIGAP_OK|');
        $resultLine = substr($output, $pos);
        $parts = explode('|', $resultLine);
        $remoteFilePath = trim($parts[1] ?? "{$parentDir}/sigap_backups/{$filename}");
        $fileSize = (int)trim($parts[2] ?? 0);

        // Save record into database
        $backup = SiteBackup::create([
            'site_id' => $site->id,
            'filename' => $filename,
            'file_path' => $remoteFilePath,
            'file_size' => $fileSize,
            'backup_type' => $type,
            'status' => 'completed',
            'notes' => $notes,
            'created_by' => $userId,
        ]);

        // Optional notification to Telegram
        try {
            $formattedSize = $backup->formatted_size;
            NotificationService::sendAlert(
                "💾 *CADANGAN SITUS BERHASIL DIBUAT*\n" .
                "Situs: *{$site->name}* ({$site->url})\n" .
                "File: `{$filename}`\n" .
                "Ukuran: *{$formattedSize}*\n" .
                "Tipe: *" . ucfirst($type) . "*\n" .
                "Waktu: *" . now()->format('d F Y, H:i:s') . " WIB*"
            );
        } catch (\Throwable $t) {
            // Ignore notification failure
        }

        return $backup;
    }

    /**
     * Restore site files from a backup archive via SSH.
     */
    public function restoreBackup(SiteBackup $backup): bool
    {
        $site = $backup->site;
        if (!$site) {
            throw new \Exception("Situs terkait arsip backup ini tidak ditemukan.");
        }

        $appPath = rtrim($site->ssh_app_path ?: '', '/');
        if (empty($appPath)) {
            throw new \Exception("Path aplikasi situs belum diatur.");
        }

        $ssh = $this->getSshConnection($site);
        $ssh->setTimeout(300);

        $restoreScript = <<<BASH
if [ ! -f "{$backup->file_path}" ]; then
    echo "SIGAP_ERR|File arsip tidak ditemukan"
    exit 1
fi
mkdir -p "{$appPath}"
tar -xzf "{$backup->file_path}" -C "{$appPath}" 2>&1
echo "SIGAP_RESTORE_OK"
BASH;

        $output = trim($ssh->exec($restoreScript));
        if (!str_contains($output, 'SIGAP_RESTORE_OK')) {
            throw new \Exception("Gagal memulihkan arsip: " . $output);
        }

        $backup->update([
            'status' => 'restored',
            'restored_at' => now(),
        ]);

        try {
            NotificationService::sendAlert(
                "🔄 *PEMULIHAN SITUS (RESTORE) BERHASIL*\n" .
                "Situs: *{$site->name}* ({$site->url})\n" .
                "Dari Arsip: `{$backup->filename}`\n" .
                "Waktu: *" . now()->format('d F Y, H:i:s') . " WIB*"
            );
        } catch (\Throwable $t) {}

        return true;
    }

    /**
     * Download backup file from remote server via SFTP.
     */
    public function streamDownload(SiteBackup $backup, bool $isAjax = false)
    {
        $site = $backup->site;
        if (!$site) {
            abort(404, "Situs tidak ditemukan.");
        }

        $sftp = $this->getSftpConnection($site);
        $sftp->setTimeout(600); // 10 minutes timeout for large file stream
        $remotePath = $backup->file_path;

        if (!$sftp->file_exists($remotePath)) {
            abort(404, "File arsip tidak ditemukan di server remote.");
        }

        $fileSize = $backup->file_size ?: $sftp->filesize($remotePath);
        $filename = $backup->filename;

        // When requested via AJAX (Axios), use 'inline' and 'application/octet-stream' so download managers (like IDM)
        // do not intercept the XHR request and replace it with HTTP 204 No Content.
        $disposition = $isAjax ? 'inline' : 'attachment; filename="' . $filename . '"';
        $contentType = $isAjax ? 'application/octet-stream' : 'application/gzip';

        return response()->stream(function () use ($sftp, $remotePath) {
            set_time_limit(0);
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
            $sftp->get($remotePath, function ($chunk) {
                echo $chunk;
                flush();
            });
        }, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => $disposition,
            'Content-Length' => $fileSize,
            'Access-Control-Expose-Headers' => 'Content-Length, Content-Disposition',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Delete backup archive from remote server and remove record.
     */
    public function deleteBackup(SiteBackup $backup): bool
    {
        $site = $backup->site;
        if ($site && !empty($site->ssh_host)) {
            try {
                $ssh = $this->getSshConnection($site);
                $ssh->exec("rm -f " . escapeshellarg($backup->file_path));
            } catch (\Throwable $t) {
                // If SSH delete fails, proceed to remove DB record
            }
        }

        return (bool)$backup->delete();
    }
}
