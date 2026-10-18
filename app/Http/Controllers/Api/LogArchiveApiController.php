<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ResponseHelper;
use App\Http\Controllers\Controller;
use App\Models\LogArchive;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LogArchiveApiController extends Controller
{
    /**
     * Get list of monthly log archives (read-only for mobile).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $scope = strtolower(trim($request->input('scope', 'all')));
        $period = trim($request->input('period', ''));
        $search = trim($request->input('search', ''));
        $perPage = min(50, max(1, (int) $request->input('per_page', 15)));

        $query = LogArchive::with('creator:id,name,email');

        // Filter by scope
        if ($scope !== 'all' && in_array($scope, ['activity', 'detection', 'incident'])) {
            $query->where('scope', $scope);
        }

        // Filter by period (YYYY-MM or YYYY)
        if (!empty($period)) {
            $query->where('period', 'like', "{$period}%");
        }

        // Search in title or notes
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('period', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Summary counts
        $totalCount = LogArchive::count();
        $activityScopeCount = LogArchive::where('scope', 'activity')->count();
        $detectionScopeCount = LogArchive::where('scope', 'detection')->count();
        $incidentScopeCount = LogArchive::where('scope', 'incident')->count();
        $allScopeCount = LogArchive::where(function ($q) {
            $q->where('scope', 'all')->orWhereNull('scope');
        })->count();

        $archives = $query->latest('period')->latest('id')->paginate($perPage);

        $data = $archives->getCollection()->map(function (LogArchive $arch) {
            return $this->formatArchiveResource($arch);
        });

        return ResponseHelper::success('Daftar berkas arsip dan laporan eksekutif berhasil dimuat.', [
            'archives' => $data,
            'pagination' => [
                'current_page' => $archives->currentPage(),
                'last_page' => $archives->lastPage(),
                'per_page' => $archives->perPage(),
                'total' => $archives->total(),
                'has_more' => $archives->hasMorePages(),
            ],
            'summary' => [
                'total' => $totalCount,
                'scopes' => [
                    'all' => $allScopeCount,
                    'activity' => $activityScopeCount,
                    'detection' => $detectionScopeCount,
                    'incident' => $incidentScopeCount,
                ],
            ],
        ]);
    }

    /**
     * Get detail of a single log archive.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $archive = LogArchive::with('creator:id,name,email')->find($id);

        if (!$archive) {
            return ResponseHelper::error('Berkas arsip tidak ditemukan.', 404);
        }

        return ResponseHelper::success('Detail berkas arsip berhasil dimuat.', [
            'archive' => $this->formatArchiveResource($archive),
        ]);
    }

    /**
     * Stream or download PDF Executive Report.
     *
     * @param string $id
     * @param Request $request
     * @return BinaryFileResponse|JsonResponse
     */
    public function downloadPdf(string $id, Request $request): BinaryFileResponse|JsonResponse
    {
        $archive = LogArchive::find($id);

        if (!$archive) {
            return ResponseHelper::error('Berkas arsip tidak ditemukan.', 404);
        }

        $fullPath = storage_path('app/' . $archive->pdf_path);
        if (!file_exists($fullPath)) {
            return ResponseHelper::error('File PDF laporan tidak ditemukan di server.', 404);
        }

        $filename = basename($fullPath);
        $preview = $request->boolean('preview', false) || $request->header('Accept') === 'application/pdf';

        if ($preview) {
            return response()->file($fullPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $filename . '"',
            ]);
        }

        return response()->download($fullPath, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * Download Raw CSV ZIP Archive.
     *
     * @param string $id
     * @return BinaryFileResponse|JsonResponse
     */
    public function downloadCsv(string $id): BinaryFileResponse|JsonResponse
    {
        $archive = LogArchive::find($id);

        if (!$archive) {
            return ResponseHelper::error('Berkas arsip tidak ditemukan.', 404);
        }

        $fullPath = storage_path('app/' . $archive->csv_path);
        if (!file_exists($fullPath)) {
            return ResponseHelper::error('File ZIP arsip tidak ditemukan di server.', 404);
        }

        return response()->download($fullPath, basename($fullPath), [
            'Content-Type' => 'application/zip',
        ]);
    }

    /**
     * Helper to format LogArchive model to standard API resource.
     *
     * @param LogArchive $arch
     * @return array
     */
    private function formatArchiveResource(LogArchive $arch): array
    {
        try {
            $carbonPeriod = Carbon::createFromFormat('Y-m', $arch->period);
            $periodLabel = $carbonPeriod->translatedFormat('F Y');
        } catch (\Throwable) {
            $periodLabel = $arch->period;
        }

        $scope = $arch->scope ?? 'all';
        $scopeLabel = match ($scope) {
            'activity' => 'Log Aktivitas',
            'detection' => 'Detection Log',
            'incident' => 'Insiden',
            default => 'Semua Log & Insiden',
        };

        $totalRecords = ($arch->activity_log_count ?? 0)
            + ($arch->detection_log_count ?? 0)
            + ($arch->incident_count ?? 0);

        return [
            'id' => (string) $arch->id,
            'period' => $arch->period,
            'period_label' => $periodLabel,
            'title' => $arch->title,
            'scope' => $scope,
            'scope_label' => $scopeLabel,
            'activity_log_count' => (int) ($arch->activity_log_count ?? 0),
            'detection_log_count' => (int) ($arch->detection_log_count ?? 0),
            'incident_count' => (int) ($arch->incident_count ?? 0),
            'total_records' => $totalRecords,
            'pdf' => [
                'url' => route('api.v1.log-archives.pdf', $arch->id),
                'size' => $arch->formatted_pdf_size,
                'bytes' => (int) ($arch->pdf_size ?? 0),
            ],
            'csv_zip' => [
                'url' => route('api.v1.log-archives.csv', $arch->id),
                'size' => $arch->formatted_csv_size,
                'bytes' => (int) ($arch->csv_size ?? 0),
            ],
            'status' => $arch->status ?? 'completed',
            'notes' => $arch->notes,
            'created_by' => $arch->creator ? [
                'id' => $arch->creator->id,
                'name' => $arch->creator->name,
                'email' => $arch->creator->email,
            ] : null,
            'created_at' => $arch->created_at?->format('Y-m-d H:i:s'),
            'created_at_human' => $arch->created_at?->translatedFormat('d M Y, H:i') . ' WIB',
        ];
    }
}
