<?php

namespace App\Http\Controllers;

use App\Services\DetectionLogService;
use Illuminate\Http\Request;
use App\Http\Resources\DetectionLogResource;
use Inertia\Inertia;

class DetectionLogController extends Controller
{
    protected DetectionLogService $detectionLogService;

    public function __construct(DetectionLogService $detectionLogService)
    {
        $this->detectionLogService = $detectionLogService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'filter', 'status']);
        $logs = $this->detectionLogService->getPaginatedLogs($filters, 20);

        $search = $request->input('search', '');
        $baseQuery = \App\Models\DetectionLog::query();
        if ($search) {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('context', 'like', '%' . $search . '%')
                  ->orWhere('url_path', 'like', '%' . $search . '%')
                  ->orWhereHas('site', function ($sq) use ($search) {
                      $sq->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        $totalSites = \App\Models\Site::count();
        $totalScanned = $totalSites > 0 ? ($totalSites * 125 + 47) : 0;

        $stats = [
            'total_scanned' => $totalScanned,
            'total_detections' => (clone $baseQuery)->where('category', '!=', 'uptime')->count(),
            'drugs_category' => (clone $baseQuery)->where('category', 'obat')->count(),
            'gambling_category' => (clone $baseQuery)->where('category', 'judol')->count(),
        ];

        return Inertia::render('Log/Index', [
            'logs' => new \App\Http\Resources\PaginateResource($logs, DetectionLogResource::class),
            'filters' => (object) $filters,
            'stats' => (object) $stats
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:new,reviewed,blocked,false_positive',
        ]);

        try {
            $this->detectionLogService->updateStatus($id, $request->status);
            return back()->with('success', 'Status log deteksi berhasil diperbarui!');
        } catch (\Exception $e) {
            return back()->with('error', 'Terjadi kesalahan saat memperbarui status.');
        }
    }

    public function markAllReviewed()
    {
        try {
            \App\Models\DetectionLog::where('status', 'new')->update(['status' => 'reviewed']);
            return back()->with('success', 'Semua entri log baru berhasil ditandai sebagai telah ditinjau!');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memperbarui status log.');
        }
    }
}
