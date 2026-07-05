<?php

namespace App\Http\Controllers;

use App\Services\UptimeReportService;
use App\Http\Resources\SiteResource;
use Illuminate\Http\Request;
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
        $filters = $request->only(['search', 'category', 'range']);
        $sites = $this->uptimeReportService->getPaginatedSites(10, $filters);
        $stats = $this->uptimeReportService->getSummaryStats($filters);

        return Inertia::render('Laporan/Index', [
            'sites' => SiteResource::collection($sites),
            'filters' => $filters,
            'stats' => $stats,
        ]);
    }
}
