<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use App\Models\SiteSecurity;

interface SiteSecurityRepositoryInterface
{
    public function getPaginatedSecurities(array $filters = [], int $perPage = 10): LengthAwarePaginator;
    public function all(): Collection;
    public function find(string $id): SiteSecurity;
    public function updateOrCreateForSite(string $siteId, array $data): SiteSecurity;
    public function getStats(): array;
}
