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
        $filters = $request->only(['search', 'filter']);
        $logs = $this->detectionLogService->getPaginatedLogs($filters, 15);

        // Dummy stats for the UI
        $stats = [
            'total_scanned' => 4812,
            'total_detections' => 14,
            'drugs_category' => 5,
            'gambling_category' => 7,
        ];

        return Inertia::render('Log/Index', [
            'logs' => DetectionLogResource::collection($logs),
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
}
