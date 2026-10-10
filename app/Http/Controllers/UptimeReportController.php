<?php

namespace App\Http\Controllers;

use App\Services\UptimeReportService;
use App\Http\Resources\PaginateResource;
use App\Http\Resources\SiteResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class UptimeReportController extends Controller
{
    protected $uptimeReportService;

    public function __construct(UptimeReportService $uptimeReportService)
    {
        $this->uptimeReportService = $uptimeReportService;
    }

    public function index(Request $request)
    {
        Gate::authorize('view-uptime-reports');

        $filters = $request->only(['search', 'category', 'range']);
        $sites = $this->uptimeReportService->getPaginatedSites($request->input('per_page', 10), $filters);
        $stats = $this->uptimeReportService->getSummaryStats($filters);
        $user = $request->user();

        return Inertia::render('Laporan/Index', [
            'sites' => new PaginateResource($sites, SiteResource::class),
            'filters' => $filters,
            'stats' => $stats,
            'can' => [
                'export' => $user?->can('export-uptime-reports') ?? false,
                'viewDetail' => $user?->can('view-uptime-audit-detail') ?? false,
            ]
        ]);
    }
}
