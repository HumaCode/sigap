<?php

namespace App\Services\Interfaces;

use App\Models\Incident;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface IncidentServiceInterface
{
    public function getPaginatedIncidents(int $perPage = 10, array $filters = []): LengthAwarePaginator;
    public function getIncidentById(string|int $id): Incident;
    public function createIncident(array $data): Incident;
    public function updateIncident(string|int $id, array $data): Incident;
    public function deleteIncident(string|int $id): bool;
    public function resolveAllActive(): int;
    public function getStats(): array;
}
