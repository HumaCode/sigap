<?php

namespace App\Repositories;

use App\Models\Site;
use App\Repositories\Interfaces\UptimeReportRepositoryInterface;

class UptimeReportRepository implements UptimeReportRepositoryInterface
{
    public function getPaginatedSites(int $perPage = 10, array $filters = [])
    {
        $query = Site::query();

        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('url', 'like', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['category']) && $filters['category'] !== 'Semua Kategori Situs') {
            $query->where('category', $filters['category']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getSummaryStats(array $filters = [])
    {
        $query = Site::query();
        
        if (!empty($filters['category']) && $filters['category'] !== 'Semua Kategori Situs') {
            $query->where('category', $filters['category']);
        }

        $totalSites = $query->count();
        // Mocked uptime data since uptime column doesn't exist yet
        $avgUptime = 99.4;
        
        // Mock SLA
        $sitesMetSla = (int)($totalSites * 0.9);
        $sitesMissedSla = $totalSites - $sitesMetSla;

        return [
            'avg_uptime' => $avgUptime,
            'total_sites' => $totalSites,
            'sites_met_sla' => $sitesMetSla,
            'sites_missed_sla' => $sitesMissedSla,
            'total_downtime' => rand(50, 300), // Dummy data for downtime minutes
            'avg_response_time' => rand(100, 500), // Dummy data for response time ms
        ];
    }
}
