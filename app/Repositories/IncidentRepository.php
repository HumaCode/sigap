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

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById(int $id)
    {
        return Incident::with('site')->findOrFail($id);
    }

    public function create(array $data)
    {
        return Incident::create($data);
    }

    public function update(int $id, array $data)
    {
        $incident = $this->findById($id);
        $incident->update($data);
        return $incident;
    }

    public function delete(int $id)
    {
        $incident = $this->findById($id);
        return $incident->delete();
    }

    public function getStats()
    {
        return [
            'total' => Incident::count(),
            'critical' => Incident::where('severity', 'critical')->count(),
            'resolved' => Incident::where('status', 'resolved')->count(),
            'open' => Incident::where('status', 'open')->count(),
        ];
    }
}
