<?php

namespace App\Services;

use App\Repositories\Interfaces\DetectionLogRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class DetectionLogService
{
    protected DetectionLogRepositoryInterface $detectionLogRepository;

    public function __construct(DetectionLogRepositoryInterface $detectionLogRepository)
    {
        $this->detectionLogRepository = $detectionLogRepository;
    }

    public function getPaginatedLogs(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->detectionLogRepository->getPaginated($filters, $perPage);
    }

    public function updateStatus(string $id, string $status): bool
    {
        return $this->detectionLogRepository->updateStatus($id, $status);
    }
}
