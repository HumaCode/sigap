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

        $allSecurities = SiteSecurity::all();
        $totalSec = $allSecurities->count();
        
        $exposedEnv = 0;
        $missingCsp = 0;
        $sslWarning = 0;

        foreach ($allSecurities as $sec) {
            if (is_array($sec->checks)) {
                foreach ($sec->checks as $c) {
                    $key = $c['key'] ?? '';
                    $status = $c['status'] ?? '';
                    $desc = $c['desc'] ?? '';
                    if (str_contains($desc, 'Pemindaian gagal')) {
                        continue;
                    }
                    if ($key === 'env' && $status === 'fail') {
                        $exposedEnv++;
                    }
                    if ($key === 'csp' && $status === 'warn') {
                        $missingCsp++;
                    }
                    if ($key === 'ssl' && ($status === 'warn' || $status === 'fail')) {
                        $sslWarning++;
                    }
                }
            }
        }

        $stats = [
            'avg_score' => $totalSec > 0 ? round($allSecurities->avg('score')) : 0,
            'env_exposed' => $exposedEnv,
            'csp_missing' => $missingCsp,
            'ssl_warning' => $sslWarning,
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
