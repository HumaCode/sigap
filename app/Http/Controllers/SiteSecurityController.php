<?php

namespace App\Http\Controllers;

use App\Http\Requests\SiteSecurityRequest;
use App\Http\Resources\PaginateResource;
use App\Http\Resources\SiteSecurityResource;
use App\Services\SiteSecurityService;
use App\Models\SiteSecurity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiteSecurityController extends Controller
{
    public function __construct(protected SiteSecurityService $siteSecurityService) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'filter']);
        
        $securities = $this->siteSecurityService->getPaginatedSecurities(
            $filters,
            $request->input('per_page', 10)
        );

        $stats = [
            'avg_score' => round(SiteSecurity::avg('score') ?? 0),
            'env_exposed' => SiteSecurity::where('checks', 'like', '%"status":"fail"%')->count(),
            'csp_missing' => SiteSecurity::where('checks', 'like', '%"key":"csp"%"status":"warn"%')
                ->orWhere('checks', 'like', '%"status":"warn"%"key":"csp"%')
                ->count(),
            'ssl_warning' => SiteSecurity::where('checks', 'like', '%"key":"ssl"%"status":"warn"%')
                ->orWhere('checks', 'like', '%"status":"warn"%"key":"ssl"%')
                ->count(),
        ];

        return Inertia::render('KeamananSitus/Index', [
            'securities' => new PaginateResource($securities, SiteSecurityResource::class),
            'filters' => (object) $filters,
            'stats' => (object) $stats,
        ]);
    }

    public function scan(SiteSecurityRequest $request)
    {
        $validated = $request->validated();

        if (!empty($validated['site_id'])) {
            $this->siteSecurityService->scanSite($validated['site_id']);
            return redirect()->back()->with('success', 'Situs berhasil dipindai.');
        }

        $this->siteSecurityService->scanAllSites();
        return redirect()->back()->with('success', 'Semua situs berhasil dipindai ulang.');
    }
}
