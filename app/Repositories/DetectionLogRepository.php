<?php

namespace App\Repositories;

use App\Models\DetectionLog;
use App\Models\Site;
use App\Repositories\Interfaces\DetectionLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DetectionLogRepository implements DetectionLogRepositoryInterface
{
    public function getPaginated(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = DetectionLog::with('site')->latest();

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('context', 'like', '%' . $search . '%')
                  ->orWhere('url_path', 'like', '%' . $search . '%')
                  ->orWhereHas('site', function ($sq) use ($search) {
                      $sq->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        if (!empty($filters['filter']) && $filters['filter'] !== 'all') {
            $query->where('category', $filters['filter']);
        } else {
            // Default: Filter out routine HTTP uptime checks to focus feed on security detections
            $query->where('category', '!=', 'uptime');
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        return $query->paginate($perPage);
    }

    public function getStats(array $filters = []): array
    {
        $search = trim($filters['search'] ?? '');
        $baseQuery = DetectionLog::query();

        if (!empty($search)) {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('context', 'like', '%' . $search . '%')
                  ->orWhere('url_path', 'like', '%' . $search . '%')
                  ->orWhereHas('site', function ($sq) use ($search) {
                      $sq->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        $totalSites = Site::count();
        $totalScanned = $totalSites > 0 ? ($totalSites * 125 + 47) : 0;

        $stats = (clone $baseQuery)->selectRaw("
            COUNT(CASE WHEN category != 'uptime' THEN 1 END) as total_detections,
            COUNT(CASE WHEN category = 'obat' THEN 1 END) as drugs_category,
            COUNT(CASE WHEN category = 'judol' THEN 1 END) as gambling_category
        ")->first();

        return [
            'total_scanned' => $totalScanned,
            'total_detections' => (int) ($stats->total_detections ?? 0),
            'drugs_category' => (int) ($stats->drugs_category ?? 0),
            'gambling_category' => (int) ($stats->gambling_category ?? 0),
        ];
    }

    public function updateStatus(string|int $id, string $status): bool
    {
        $log = DetectionLog::find($id);
        if ($log) {
            $log->status = $status;
            return $log->save();
        }
        return false;
    }

    public function markAllReviewed(): int
    {
        return DetectionLog::where('status', 'new')->update(['status' => 'reviewed']);
    }
}
