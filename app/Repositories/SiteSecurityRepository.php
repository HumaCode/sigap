<?php

namespace App\Repositories;

use App\Models\SiteSecurity;
use App\Repositories\Interfaces\SiteSecurityRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SiteSecurityRepository implements SiteSecurityRepositoryInterface
{
    public function __construct(protected SiteSecurity $model) {}

    public function getPaginatedSecurities(array $filters = [], int $perPage = 10): LengthAwarePaginator
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

        return $query->latest('updated_at')->paginate($perPage);
    }

    public function all(): Collection
    {
        return $this->model->with('site')->get();
    }

    public function find(string $id): SiteSecurity
    {
        return $this->model->with('site')->findOrFail($id);
    }

    public function updateOrCreateForSite(string $siteId, array $data): SiteSecurity
    {
        return $this->model->updateOrCreate(
            ['site_id' => $siteId],
            $data
        );
    }

    public function getStats(): array
    {
        $allSecurities = $this->model->select(['id', 'score', 'checks'])->get();
        $totalSec = $allSecurities->count();

        $exposedEnv = 0;
        $missingCsp = 0;
        $sslWarning = 0;

        foreach ($allSecurities as $sec) {
            if (is_array($sec->checks)) {
                foreach ($sec->checks as $c) {
                    $key = $c['key'] ?? '';
                    $status = $c['status'] ?? '';
                    $desc = $c['desc'] ?? '';
                    if (str_contains($desc, 'Pemindaian gagal')) {
                        continue;
                    }
                    if ($key === 'env' && $status === 'fail') {
                        $exposedEnv++;
                    }
                    if ($key === 'csp' && $status === 'warn') {
                        $missingCsp++;
                    }
                    if ($key === 'ssl' && ($status === 'warn' || $status === 'fail')) {
                        $sslWarning++;
                    }
                }
            }
        }

        return [
            'avg_score' => $totalSec > 0 ? (int) round($allSecurities->avg('score')) : 0,
            'env_exposed' => $exposedEnv,
            'csp_missing' => $missingCsp,
            'ssl_warning' => $sslWarning,
        ];
    }
}
