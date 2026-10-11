<?php

namespace App\Services;

use App\Models\Incident;
use App\Repositories\Interfaces\IncidentRepositoryInterface;
use App\Services\Interfaces\IncidentServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class IncidentService implements IncidentServiceInterface
{
    public function __construct(protected IncidentRepositoryInterface $repository) {}

    public function getPaginatedIncidents(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getPaginatedIncidents($perPage, $filters);
    }

    public function getIncidentById(string|int $id): Incident
    {
        return $this->repository->findById($id);
    }

    public function createIncident(array $data): Incident
    {
        return $this->repository->create($data);
    }

    public function updateIncident(string|int $id, array $data): Incident
    {
        return $this->repository->update($id, $data);
    }

    public function deleteIncident(string|int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function resolveAllActive(): int
    {
        return $this->repository->resolveAllActive();
    }

    public function getStats(): array
    {
        return $this->repository->getStats();
    }
}
