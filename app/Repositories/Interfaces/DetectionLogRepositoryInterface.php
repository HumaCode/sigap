<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DetectionLogRepositoryInterface
{
    public function getPaginated(array $filters = [], int $perPage = 10): LengthAwarePaginator;
    public function updateStatus(string $id, string $status): bool;
}
