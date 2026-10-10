<?php

namespace App\Services;

use App\Repositories\Interfaces\UptimeReportRepositoryInterface;
use App\Services\Interfaces\UptimeReportServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UptimeReportService implements UptimeReportServiceInterface
{
    protected UptimeReportRepositoryInterface $repository;

    public function __construct(UptimeReportRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function getPaginatedSites(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getPaginatedSites($perPage, $filters);
    }

    public function getSummaryStats(array $filters = []): array
    {
        return $this->repository->getSummaryStats($filters);
    }
}
