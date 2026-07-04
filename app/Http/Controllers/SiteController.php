<?php

namespace App\Http\Controllers;

use App\Http\Requests\SiteRequest;
use App\Http\Resources\PaginateResource;
use App\Http\Resources\SiteResource;
use App\Services\SiteService;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function __construct(protected SiteService $siteService) {}

    public function index(Request $request)
    {
        $sites = $this->siteService->getSites(
            $request->input('per_page', 10),
            $request->input('search', ''),
            $request->input('filter', 'all')
        );

        $stats = [
            'total' => \App\Models\Site::count(),
            'up' => \App\Models\Site::where('status', 'up')->count(),
            'down' => \App\Models\Site::where('status', 'down')->count(),
            'warn' => \App\Models\Site::where('status', 'warn')->count(),
            'paused' => \App\Models\Site::where('status', 'paused')->count(),
        ];

        return inertia('Sites/Index', [
            'sites' => new PaginateResource($sites, SiteResource::class),
            'filters' => $request->only(['search', 'filter']),
            'stats' => $stats
        ]);
    }

    public function store(SiteRequest $request)
    {
        $this->siteService->createSite($request->validated());
        return redirect()->route('sites.index')->with('success', 'Situs berhasil didaftarkan');
    }

    public function update(SiteRequest $request, $id)
    {
        $this->siteService->updateSite($id, $request->validated());
        return redirect()->route('sites.index')->with('success', 'Situs berhasil diperbarui');
    }

    public function destroy($id)
    {
        $this->siteService->deleteSite($id);
        return redirect()->route('sites.index')->with('success', 'Situs berhasil dihapus');
    }
}
