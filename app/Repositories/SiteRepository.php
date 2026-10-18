<?php

namespace App\Repositories;

use App\Models\Site;
use App\Repositories\Interfaces\SiteRepositoryInterface;

class SiteRepository implements SiteRepositoryInterface
{
    public function getAllPaginated($perPage = 10, $search = '', $filter = 'all')
    {
        $query = Site::query()->withCount([
            'incidents',
            'detectionLogs as uptime_total_checks_30d' => function ($q) {
                $q->where('category', 'uptime')
                  ->where('created_at', '>=', now()->subDays(30));
            },
            'detectionLogs as uptime_successful_checks_30d' => function ($q) {
                $q->where('category', 'uptime')
                  ->where('status', 'resolved')
                  ->where('created_at', '>=', now()->subDays(30));
            }
        ]);

        $search = trim((string) $search);
        if ($search !== '') {
            $searchLower = strtolower($search);
            $query->where(function ($q) use ($search, $searchLower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(url) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(category) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(COALESCE(pic_name, "")) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(COALESCE(domain_name, "")) LIKE ?', ["%{$searchLower}%"]);
            });
        }

        if (in_array($filter, ['up', 'down', 'warn', 'paused'])) {
            if ($filter === 'paused') {
                $query->where(function ($q) {
                    $q->where('is_active', false)->orWhere('status', 'paused');
                });
            } else {
                $query->where('status', $filter)->where('is_active', true);
            }
        }

        return $query->latest()->paginate($perPage)->withQueryString();
    }
    
    public function create(array $data) { return Site::create($data); }
    public function update($id, array $data) { 
        $site = Site::findOrFail($id);
        $site->update($data);
        return $site;
    }
    public function delete($id) { return Site::destroy($id); }
    public function find($id) { return Site::findOrFail($id); }
}
