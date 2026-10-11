<?php

namespace App\Http\Controllers;

use App\Http\Requests\SiteSecurityIndexRequest;
use App\Http\Requests\SiteSecurityRequest;
use App\Http\Resources\PaginateResource;
use App\Http\Resources\SiteSecurityResource;
use App\Services\Interfaces\SiteSecurityServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SiteSecurityController extends Controller
{
    public function __construct(protected SiteSecurityServiceInterface $siteSecurityService) {}

    /**
     * Display a paginated listing of site security audits and system stats.
     */
    public function index(SiteSecurityIndexRequest $request): Response
    {
        $filters = $request->filters();
        $perPage = (int) $request->input('per_page', 10);

        $securities = $this->siteSecurityService->getPaginatedSecurities($filters, $perPage);
        $stats = $this->siteSecurityService->getStats();
        $user = $request->user();

        return Inertia::render('KeamananSitus/Index', [
            'securities' => new PaginateResource($securities, SiteSecurityResource::class),
            'filters' => (object) $filters,
            'stats' => (object) $stats,
            'can' => [
                'scan' => $user?->can('scan-site-security') ?? false,
            ],
        ]);
    }

    /**
     * Trigger security scan for a specific site or all registered sites.
     */
    public function scan(SiteSecurityRequest $request): RedirectResponse
    {
        Gate::authorize('scan-site-security');
        $validated = $request->validated();

        if (!empty($validated['site_id'])) {
            $this->siteSecurityService->scanSite($validated['site_id']);
            return redirect()->back()->with('success', 'Situs berhasil dipindai ulang.');
        }

        $this->siteSecurityService->scanAllSites();
        return redirect()->back()->with('success', 'Seluruh situs berhasil dipindai ulang.');
    }
}
