<?php

namespace App\Repositories\Interfaces;

use App\Models\Incident;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface IncidentRepositoryInterface
{
    public function getPaginatedIncidents(int $perPage = 10, array $filters = []): LengthAwarePaginator;
    public function findById(string|int $id): Incident;
    public function create(array $data): Incident;
    public function update(string|int $id, array $data): Incident;
    public function delete(string|int $id): bool;
    public function resolveAllActive(): int;
    public function getStats(): array;
}
