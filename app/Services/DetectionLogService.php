<?php

namespace App\Services;

use App\Repositories\Interfaces\DetectionLogRepositoryInterface;
use App\Services\Interfaces\DetectionLogServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DetectionLogService implements DetectionLogServiceInterface
{
    protected DetectionLogRepositoryInterface $detectionLogRepository;

    public function __construct(DetectionLogRepositoryInterface $detectionLogRepository)
    {
        $this->detectionLogRepository = $detectionLogRepository;
    }

    public function getPaginatedLogs(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->detectionLogRepository->getPaginated($filters, $perPage);
    }

    public function getStats(array $filters = []): array
    {
        return $this->detectionLogRepository->getStats($filters);
    }

    public function updateStatus(string|int $id, string $status): bool
    {
        return $this->detectionLogRepository->updateStatus($id, $status);
    }

    public function markAllReviewed(): int
    {
        return $this->detectionLogRepository->markAllReviewed();
    }
}
