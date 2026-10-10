<?php

namespace App\Http\Controllers;

use App\Http\Requests\DetectionLogIndexRequest;
use App\Http\Requests\UpdateDetectionLogStatusRequest;
use App\Http\Resources\DetectionLogResource;
use App\Http\Resources\PaginateResource;
use App\Services\Interfaces\DetectionLogServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DetectionLogController extends Controller
{
    protected DetectionLogServiceInterface $detectionLogService;

    public function __construct(DetectionLogServiceInterface $detectionLogService)
    {
        $this->detectionLogService = $detectionLogService;
    }

    public function index(DetectionLogIndexRequest $request): Response
    {
        $filters = $request->filters();
        $perPage = (int) $request->input('per_page', 20);

        $logs = $this->detectionLogService->getPaginatedLogs($filters, $perPage);
        $stats = $this->detectionLogService->getStats($filters);
        $user = $request->user();

        return Inertia::render('Log/Index', [
            'logs' => new PaginateResource($logs, DetectionLogResource::class),
            'filters' => (object) $filters,
            'stats' => (object) $stats,
            'can' => [
                'manageStatus' => $user?->can('manage-detection-status') ?? false,
                'markAllReviewed' => $user?->can('mark-all-detection-logs') ?? false,
            ],
        ]);
    }

    public function updateStatus(UpdateDetectionLogStatusRequest $request, string|int $id): RedirectResponse
    {
        try {
            $this->detectionLogService->updateStatus($id, $request->input('status'));
            return back()->with('success', 'Status log deteksi berhasil diperbarui!');
        } catch (\Exception $e) {
            return back()->with('error', 'Terjadi kesalahan saat memperbarui status.');
        }
    }

    public function markAllReviewed(): RedirectResponse
    {
        \Illuminate\Support\Facades\Gate::authorize('mark-all-detection-logs');

        try {
            $this->detectionLogService->markAllReviewed();
            return back()->with('success', 'Semua entri log baru berhasil ditandai sebagai telah ditinjau!');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memperbarui status log.');
        }
    }
}
