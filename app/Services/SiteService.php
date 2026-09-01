<?php

namespace App\Services;

use App\Repositories\Interfaces\SiteRepositoryInterface;

class SiteService
{
    public function __construct(
        protected SiteRepositoryInterface $siteRepository,
        protected UptimeCheckService $uptimeCheckService
    ) {}

    public function getSites($perPage = 10, $search = '', $filter = 'all')
    {
        return $this->siteRepository->getAllPaginated($perPage, $search, $filter);
    }

    public function createSite(array $data)
    {
        if (isset($data['ssh_password']) && empty($data['ssh_password'])) {
            unset($data['ssh_password']);
        }
        if (isset($data['ssh_private_key']) && empty($data['ssh_private_key'])) {
            unset($data['ssh_private_key']);
        }
        
        $site = $this->siteRepository->create($data);

        // Instantly perform HTTP Health Check for the newly added site
        try {
            $this->uptimeCheckService->checkSite($site);
        } catch (\Exception $e) {
            // Ignore failure during creation flow
        }

        return $site;
    }

    public function updateSite($id, array $data)
    {
        if (isset($data['ssh_password']) && ($data['ssh_password'] === '********' || empty($data['ssh_password']))) {
            unset($data['ssh_password']);
        }
        if (isset($data['ssh_private_key']) && ($data['ssh_private_key'] === '********' || empty($data['ssh_private_key']))) {
            unset($data['ssh_private_key']);
        }

        $site = $this->siteRepository->update($id, $data);

        // Re-check HTTP status immediately after update
        try {
            $this->uptimeCheckService->checkSite($site);
        } catch (\Exception $e) {
            // Ignore failure
        }

        return $site;
    }

    public function deleteSite($id)
    {
        return $this->siteRepository->delete($id);
    }
}

