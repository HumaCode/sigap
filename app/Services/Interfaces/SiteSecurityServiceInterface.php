<?php

namespace App\Services\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SiteSecurityServiceInterface
{
    /**
     * Dapatkan data audit keamanan situs terpaginasi sesuai filter.
     */
    public function getPaginatedSecurities(array $filters = [], int $perPage = 10): LengthAwarePaginator;

    /**
     * Dapatkan ringkasan statistik keamanan sistem (skor rata-rata, file terekspos, CSP, SSL).
     */
    public function getStats(): array;

    /**
     * Pindai ulang audit keamanan pada satu situs tertentu.
     */
    public function scanSite(string|int $siteId);

    /**
     * Pindai ulang audit keamanan seluruh situs.
     */
    public function scanAllSites();

    /**
     * Pastikan seluruh situs memiliki data audit keamanan.
     */
    public function ensureSecuritiesExist();
}
