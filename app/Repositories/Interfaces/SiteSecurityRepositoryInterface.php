<?php

namespace App\Repositories\Interfaces;

interface SiteSecurityRepositoryInterface
{
    public function getPaginatedSecurities(array $filters, int $perPage = 10);
    public function all();
    public function find(string $id);
    public function updateOrCreateForSite(string $siteId, array $data);
}
