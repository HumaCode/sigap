<?php

namespace App\Services\Interfaces;

use App\Models\Site;
use Illuminate\Support\Collection;

interface ServerInvestigationServiceInterface
{
    /**
     * Dapatkan semua situs yang telah mengkonfigurasi kredensial SSH.
     */
    public function getSitesWithSsh(): Collection;

    /**
     * Periksa kesehatan dan informasi server via SSH (koneksi, OS, disk, PHP, Git).
     */
    public function checkServerConnection(Site $site): array;

    /**
     * Dapatkan hasil pemindaian server terakhir untuk situs tertentu dari database.
     */
    public function getLatestScan(Site $site): ?\App\Models\ServerScan;

    /**
     * Pindai berkas proyek di server target untuk menemukan webshell, backdoor, atau perubahan berkas.
     * Mode: 'quick' (24-48 jam), 'deep' (heuristik regex webshell), 'git' (perubahan repositori git).
     */
    public function scanFiles(Site $site, string $mode = 'quick', ?string $userId = null, bool $includeVendor = false): array;

    /**
     * Karantina berkas berbahaya (pindahkan ke .sigap_quarantine dengan izin 000).
     */
    public function quarantineFile(Site $site, string $filePath, ?string $userId = null): array;

    /**
     * Hapus berkas berbahaya secara permanen dari server (dicegah untuk berkas vendor atau sistem inti).
     */
    public function deleteFile(Site $site, string $filePath, ?string $userId = null): array;

    /**
     * Pulihkan berkas inti (misal index.php) dari cadangan atau git checkout.
     */
    public function rollbackFile(Site $site, string $targetFile): array;

    /**
     * Aktifkan atau nonaktifkan mode darurat (maintenance mode) di server target.
     */
    public function toggleMaintenance(Site $site, bool $enable): array;

    /**
     * Analisis berkas log web server (Nginx/Apache) untuk forensik IP penyerang dan jejak exploit.
     */
    public function analyzeLogs(Site $site, ?string $customLogPath = null): array;

    /**
     * Dapatkan data utilisasi resource real-time server target via SSH (CPU, RAM, Disk).
     */
    public function getServerResourceUsage(Site $site): array;
}
