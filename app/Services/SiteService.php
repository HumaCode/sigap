<?php

namespace App\Services;

use App\Repositories\Interfaces\SiteRepositoryInterface;

class SiteService
{
    public function __construct(protected SiteRepositoryInterface $siteRepository) {}

    public function getSites($perPage = 10, $search = '', $filter = 'all')
    {
        return $this->siteRepository->getAllPaginated($perPage, $search, $filter);
    }

    public function createSite(array $data)
    {
        return $this->siteRepository->create($data);
    }

    public function updateSite($id, array $data)
    {
        return $this->siteRepository->update($id, $data);
    }

    public function deleteSite($id)
    {
        return $this->siteRepository->delete($id);
    }
}
