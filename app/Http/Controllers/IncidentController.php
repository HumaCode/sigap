<?php

namespace App\Http\Controllers;

use App\Http\Requests\IncidentIndexRequest;
use App\Http\Requests\StoreIncidentRequest;
use App\Http\Requests\UpdateIncidentRequest;
use App\Http\Resources\IncidentResource;
use App\Http\Resources\PaginateResource;
use App\Models\Incident;
use App\Services\Interfaces\IncidentServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class IncidentController extends Controller
{
    public function __construct(protected IncidentServiceInterface $incidentService) {}

    /**
     * Display a listing of incidents with filters and stats.
     */
    public function index(IncidentIndexRequest $request): Response
    {
        Gate::authorize('viewAny', Incident::class);

        $filters = $request->filters();
        $perPage = (int) $request->input('per_page', 10);

        $incidents = $this->incidentService->getPaginatedIncidents($perPage, $filters);
        $stats = $this->incidentService->getStats();
        $user = $request->user();

        return Inertia::render('Insiden/Index', [
            'incidents' => new PaginateResource($incidents, IncidentResource::class),
            'filters'   => (object) $filters,
            'stats'     => (object) $stats,
            'can'       => [
                'resolveAll' => $user?->can('resolve-all-incidents') ?? false,
                'create'     => $user?->can('create', Incident::class) ?? false,
                'update'     => $user?->can('update', Incident::class) ?? false,
                'delete'     => $user?->can('delete', Incident::class) ?? false,
            ],
        ]);
    }

    /**
     * Mark all active / ongoing incidents as resolved.
     */
    public function markAllResolved(): RedirectResponse
    {
        Gate::authorize('resolve-all-incidents');

        try {
            $updatedCount = $this->incidentService->resolveAllActive();
            return redirect()->back()->with('success', "{$updatedCount} insiden aktif berhasil ditandai sebagai selesai.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui status insiden: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created incident.
     */
    public function store(StoreIncidentRequest $request): RedirectResponse
    {
        Gate::authorize('create', Incident::class);

        $this->incidentService->createIncident($request->validated());

        return redirect()->back()->with('success', 'Insiden baru berhasil dicatat.');
    }

    /**
     * Update the specified incident.
     */
    public function update(UpdateIncidentRequest $request, string|int $id): RedirectResponse
    {
        $incident = $this->incidentService->getIncidentById($id);
        Gate::authorize('update', $incident);

        $this->incidentService->updateIncident($id, $request->validated());

        return redirect()->back()->with('success', 'Data insiden berhasil diperbarui.');
    }

    /**
     * Remove the specified incident.
     */
    public function destroy(string|int $id): RedirectResponse
    {
        $incident = $this->incidentService->getIncidentById($id);
        Gate::authorize('delete', $incident);

        $this->incidentService->deleteIncident($id);

        return redirect()->back()->with('success', 'Insiden berhasil dihapus.');
    }
}
