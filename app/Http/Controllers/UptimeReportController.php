<?php

namespace App\Http\Controllers;

use App\Http\Requests\UptimeReportIndexRequest;
use App\Http\Resources\PaginateResource;
use App\Http\Resources\SiteResource;
use App\Services\Interfaces\UptimeReportServiceInterface;
use Inertia\Inertia;
use Inertia\Response;

class UptimeReportController extends Controller
{
    protected UptimeReportServiceInterface $uptimeReportService;

    public function __construct(UptimeReportServiceInterface $uptimeReportService)
    {
        $this->uptimeReportService = $uptimeReportService;
    }

    public function index(UptimeReportIndexRequest $request): Response
    {
        $filters = $request->filters();
        $perPage = (int) $request->input('per_page', 10);

        $sites = $this->uptimeReportService->getPaginatedSites($perPage, $filters);
        $stats = $this->uptimeReportService->getSummaryStats($filters);
        $user = $request->user();

        return Inertia::render('Laporan/Index', [
            'sites' => new PaginateResource($sites, SiteResource::class),
            'filters' => $filters,
            'stats' => $stats,
            'can' => [
                'export' => $user?->can('export-uptime-reports') ?? false,
                'viewDetail' => $user?->can('view-uptime-audit-detail') ?? false,
            ],
        ]);
    }

    public function export(UptimeReportIndexRequest $request, \App\Services\ExportService $exportService): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $user = $request->user();
        if (!$user || !$user->can('export-uptime-reports')) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengunduh laporan.');
        }

        return $exportService->exportUptime($request->filters());
    }
}
