<?php

namespace App\Services\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DetectionLogServiceInterface
{
    public function getPaginatedLogs(array $filters = [], int $perPage = 20): LengthAwarePaginator;

    public function getStats(array $filters = []): array;

    public function updateStatus(string|int $id, string $status): bool;

    public function markAllReviewed(): int;
}
