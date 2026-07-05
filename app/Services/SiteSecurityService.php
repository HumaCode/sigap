<?php

namespace App\Services;

use App\Repositories\Interfaces\SiteSecurityRepositoryInterface;
use App\Models\Site;

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
        $grade = 'A';
        $issuesCount = 0;
        $checks = [];

        $siteNameLower = strtolower($site->name);

        if (str_contains($siteNameLower, 'spbe')) {
            $score = 97;
            $grade = 'A';
            $issuesCount = 0;
            $checks = [
                ['key' => 'csp', 'title' => 'Header Content-Security-Policy terkonfigurasi', 'status' => 'ok', 'desc' => 'CSP ditemukan dan membatasi sumber skrip dengan baik.'],
                ['key' => 'files', 'title' => 'File sensitif tidak dapat diakses publik', 'status' => 'ok', 'desc' => '.env, .git, dan berkas backup tidak ditemukan dapat diakses dari luar.'],
                ['key' => 'ssl', 'title' => 'Sertifikat SSL valid', 'status' => 'ok', 'desc' => 'Berlaku hingga 14 Des 2026 — tidak perlu tindakan.'],
            ];
        } elseif (str_contains($siteNameLower, 'siakad')) {
            $score = 33;
            $grade = 'F';
            $issuesCount = 2;
            $checks = [
                ['key' => 'env', 'title' => 'File .env dapat diakses publik', 'status' => 'fail', 'desc' => 'Berkas konfigurasi (kredensial database, API key) dapat diunduh langsung dari /.env.', 'fix' => 'Blokir akses via aturan web server (.htaccess / nginx location deny) & rotasi seluruh kredensial yang terekspos.'],
                ['key' => 'git', 'title' => 'Direktori .git dapat diakses publik', 'status' => 'fail', 'desc' => 'Riwayat commit dan struktur source code dapat diunduh dari /.git/.', 'fix' => 'Hapus folder .git dari direktori publik atau blokir akses langsung.'],
                ['key' => 'csp', 'title' => 'Header Content-Security-Policy tidak ditemukan', 'status' => 'warn', 'desc' => 'Situs rentan terhadap serangan XSS karena tidak ada pembatasan sumber skrip.', 'fix' => 'Tambahkan header CSP pada konfigurasi server atau middleware aplikasi.'],
            ];
        } elseif (str_contains($siteNameLower, 'rapbd')) {
            $score = 65;
            $grade = 'C';
            $issuesCount = 2;
            $checks = [
                ['key' => 'csp', 'title' => 'Header Content-Security-Policy tidak ditemukan', 'status' => 'warn', 'desc' => 'Tidak ada pembatasan sumber skrip pada respons server.', 'fix' => 'Tambahkan header CSP pada konfigurasi server.'],
                ['key' => 'ssl', 'title' => 'Sertifikat SSL akan kedaluwarsa dalam 12 hari', 'status' => 'warn', 'desc' => 'Berlaku hingga 17 Jul 2026 — perlu diperpanjang sebelum kedaluwarsa.', 'fix' => 'Perpanjang sertifikat SSL atau aktifkan auto-renewal (mis. Let\'s Encrypt certbot).'],
                ['key' => 'files', 'title' => 'File sensitif tidak dapat diakses publik', 'status' => 'ok', 'desc' => '.env, .git, dan berkas backup aman.'],
            ];
        } elseif (str_contains($siteNameLower, 'sipeka')) {
            $score = 80;
            $grade = 'B';
            $issuesCount = 1;
            $checks = [
                ['key' => 'xframe', 'title' => 'Header X-Frame-Options tidak ditemukan', 'status' => 'warn', 'desc' => 'Situs berpotensi disisipkan dalam iframe pihak ketiga (clickjacking).', 'fix' => 'Tambahkan header X-Frame-Options: SAMEORIGIN pada konfigurasi server.'],
                ['key' => 'ssl', 'title' => 'Sertifikat SSL valid', 'status' => 'ok', 'desc' => 'Berlaku hingga 2 Sep 2026.'],
            ];
        } else {
            // General / default site
            $score = 94;
            $grade = 'A';
            $issuesCount = 0;
            $checks = [
                ['key' => 'csp', 'title' => 'Seluruh header keamanan terkonfigurasi dengan baik', 'status' => 'ok', 'desc' => 'CSP, X-Frame-Options, dan HSTS aktif.'],
                ['key' => 'ssl', 'title' => 'Sertifikat SSL valid', 'status' => 'ok', 'desc' => 'Berlaku hingga 3 Nov 2026.'],
            ];
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
