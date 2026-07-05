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
        $filters = $request->only(['search', 'status']);
        $incidents = $this->incidentService->getPaginatedIncidents(10, $filters);
        $stats = $this->incidentService->getStats();

        return Inertia::render('Insiden/Index', [
            'incidents' => IncidentResource::collection($incidents),
            'filters' => $filters,
            'stats' => $stats
        ]);
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
