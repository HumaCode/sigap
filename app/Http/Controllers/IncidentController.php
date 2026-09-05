<?php

namespace App\Http\Controllers;

use App\Services\IncidentService;
use App\Http\Requests\StoreIncidentRequest;
use App\Http\Requests\UpdateIncidentRequest;
use App\Http\Resources\IncidentResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IncidentController extends Controller
{
    protected $incidentService;

    public function __construct(IncidentService $incidentService)
    {
        $this->incidentService = $incidentService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'type']);
        $incidents = $this->incidentService->getPaginatedIncidents(10, $filters);
        $stats = $this->incidentService->getStats();

        return Inertia::render('Insiden/Index', [
            'incidents' => new \App\Http\Resources\PaginateResource($incidents, IncidentResource::class),
            'filters' => $filters,
            'stats' => $stats
        ]);
    }

    public function markAllResolved()
    {
        try {
            \App\Models\Incident::whereIn('status', ['open', 'investigating', 'acknowledged'])->update(['status' => 'resolved']);
            return redirect()->back()->with('success', 'Semua insiden aktif berhasil ditandai sebagai selesai.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui insiden.');
        }
    }

    public function store(StoreIncidentRequest $request)
    {
        $this->incidentService->createIncident($request->validated());

        return redirect()->back()->with('success', 'Incident created successfully.');
    }

    public function update(UpdateIncidentRequest $request, $id)
    {
        $this->incidentService->updateIncident($id, $request->validated());

        return redirect()->back()->with('success', 'Incident updated successfully.');
    }

    public function destroy($id)
    {
        $this->incidentService->deleteIncident($id);

        return redirect()->back()->with('success', 'Incident deleted successfully.');
    }
}
