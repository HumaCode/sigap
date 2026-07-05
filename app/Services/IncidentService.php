<?php

namespace App\Services;

use App\Repositories\Interfaces\IncidentRepositoryInterface;

class IncidentService
{
    protected $repository;

    public function __construct(IncidentRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function getPaginatedIncidents(int $perPage = 10, array $filters = [])
    {
        return $this->repository->getPaginatedIncidents($perPage, $filters);
    }

    public function getIncidentById(int $id)
    {
        return $this->repository->findById($id);
    }

    public function createIncident(array $data)
    {
        return $this->repository->create($data);
    }

    public function updateIncident(int $id, array $data)
    {
        return $this->repository->update($id, $data);
    }

    public function deleteIncident(int $id)
    {
        return $this->repository->delete($id);
    }

    public function getStats()
    {
        return $this->repository->getStats();
    }
}
