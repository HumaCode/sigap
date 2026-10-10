<?php

namespace App\Services\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UptimeReportServiceInterface
{
    public function getPaginatedSites(int $perPage = 10, array $filters = []): LengthAwarePaginator;

    public function getSummaryStats(array $filters = []): array;
}
