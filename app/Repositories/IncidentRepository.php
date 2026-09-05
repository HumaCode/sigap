<?php

namespace App\Repositories;

use App\Models\Incident;
use App\Repositories\Interfaces\IncidentRepositoryInterface;

class IncidentRepository implements IncidentRepositoryInterface
{
    public function getPaginatedIncidents(int $perPage = 10, array $filters = [])
    {
        $query = Incident::with('site');

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%' . $filters['search'] . '%')
                  ->orWhereHas('site', function ($sq) use ($filters) {
                      $sq->where('name', 'like', '%' . $filters['search'] . '%');
                  });
            });
        }

        if (!empty($filters['type']) && $filters['type'] !== 'all') {
            $query->where('type', $filters['type']);
        } else {
            // Default: Skip routine site down/uptime checks to focus feed on security incidents
            $query->whereNotIn('type', ['down', 'uptime']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById(string $id)
    {
        return Incident::with('site')->findOrFail($id);
    }

    public function create(array $data)
    {
        return Incident::create($data);
    }

    public function update(string $id, array $data)
    {
        $incident = $this->findById($id);
        $incident->update($data);
        return $incident;
    }

    public function delete(string $id)
    {
        $incident = $this->findById($id);
        return $incident->delete();
    }

    public function getStats()
    {
        return [
            'total' => Incident::count(),
            'critical' => Incident::whereIn('severity', ['critical', 'high'])->whereNotIn('status', ['resolved', 'false_positive'])->count(),
            'resolved' => Incident::where('status', 'resolved')->count(),
            'open' => Incident::where('status', 'open')->count(),
            'investigating' => Incident::whereIn('status', ['investigating', 'acknowledged'])->count(),
            'active' => Incident::whereNotIn('status', ['resolved', 'false_positive'])->count(),
        ];
    }
}
