<?php

namespace App\Repositories;

use App\Models\DetectionLog;
use App\Repositories\Interfaces\DetectionLogRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class DetectionLogRepository implements DetectionLogRepositoryInterface
{
    public function getPaginated(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = DetectionLog::with('site')->orderBy('created_at', 'desc');

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('context', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('url_path', 'like', '%' . $filters['search'] . '%')
                  ->orWhereHas('site', function ($sq) use ($filters) {
                      $sq->where('name', 'like', '%' . $filters['search'] . '%');
                  });
            });
        }

        if (!empty($filters['filter']) && $filters['filter'] !== 'all') {
            $query->where('category', $filters['filter']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function updateStatus(string $id, string $status): bool
    {
        $log = DetectionLog::find($id);
        if ($log) {
            $log->status = $status;
            return $log->save();
        }
        return false;
    }
}
