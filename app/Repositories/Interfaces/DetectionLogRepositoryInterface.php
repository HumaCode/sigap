<?php

namespace App\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DetectionLogRepositoryInterface
{
    public function getPaginated(array $filters = [], int $perPage = 20): LengthAwarePaginator;

    public function getStats(array $filters = []): array;

    public function updateStatus(string|int $id, string $status): bool;

    public function markAllReviewed(): int;
}
