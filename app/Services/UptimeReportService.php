<?php

namespace App\Services;

use App\Repositories\Interfaces\UptimeReportRepositoryInterface;

class UptimeReportService
{
    protected $repository;

    public function __construct(UptimeReportRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function getPaginatedSites(int $perPage = 10, array $filters = [])
    {
        return $this->repository->getPaginatedSites($perPage, $filters);
    }

    public function getSummaryStats(array $filters = [])
    {
        return $this->repository->getSummaryStats($filters);
    }
}
