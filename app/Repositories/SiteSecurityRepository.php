<?php

namespace App\Repositories;

use App\Models\SiteSecurity;
use App\Repositories\Interfaces\SiteSecurityRepositoryInterface;

class SiteSecurityRepository implements SiteSecurityRepositoryInterface
{
    public function __construct(protected SiteSecurity $model) {}

    public function getPaginatedSecurities(array $filters, int $perPage = 10)
    {
        $query = $this->model->with('site');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('site', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('url', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['filter']) && $filters['filter'] !== 'all') {
            $filter = $filters['filter'];
            if ($filter === 'critical') {
                $query->where('grade', 'F');
            } elseif ($filter === 'warn') {
                $query->whereIn('grade', ['B', 'C']);
            } elseif ($filter === 'clean') {
                $query->where('grade', 'A');
            }
        }

        return $query->latest()->paginate($perPage);
    }

    public function all()
    {
        return $this->model->with('site')->get();
    }

    public function find(string $id)
    {
        return $this->model->with('site')->findOrFail($id);
    }

    public function updateOrCreateForSite(string $siteId, array $data)
    {
        return $this->model->updateOrCreate(
            ['site_id' => $siteId],
            $data
        );
    }
}
