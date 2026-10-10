<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UptimeReportRepositoryInterface
{
    public function getPaginatedSites(int $perPage = 10, array $filters = []): LengthAwarePaginator;
    public function getSummaryStats(array $filters = []): array;
}
