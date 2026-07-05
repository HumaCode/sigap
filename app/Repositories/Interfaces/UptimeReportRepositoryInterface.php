<?php

namespace App\Repositories\Interfaces;

interface UptimeReportRepositoryInterface
{
    public function getPaginatedSites(int $perPage = 10, array $filters = []);
    public function getSummaryStats(array $filters = []);
}
