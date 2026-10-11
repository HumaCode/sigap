<?php

namespace App\Repositories;

use App\Models\Incident;
use App\Repositories\Interfaces\IncidentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class IncidentRepository implements IncidentRepositoryInterface
{
    public function getPaginatedIncidents(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        $query = Incident::with('site');

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%')
                  ->orWhereHas('site', function ($sq) use ($search) {
                      $sq->where('name', 'like', '%' . $search . '%')
                        ->orWhere('url', 'like', '%' . $search . '%');
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
            if ($filters['status'] === 'critical') {
                $query->whereIn('severity', ['critical', 'high'])
                      ->whereNotIn('status', ['resolved', 'false_positive']);
            } elseif ($filters['status'] === 'investigating') {
                $query->whereIn('status', ['investigating', 'acknowledged']);
            } else {
                $query->where('status', $filters['status']);
            }
        }

        return $query->latest('detected_at')->latest('id')->paginate($perPage);
    }

    public function findById(string|int $id): Incident
    {
        return Incident::with('site')->findOrFail($id);
    }

    public function create(array $data): Incident
    {
        return Incident::create($data);
    }

    public function update(string|int $id, array $data): Incident
    {
        $incident = $this->findById($id);
        $incident->update($data);
        return $incident;
    }

    public function delete(string|int $id): bool
    {
        $incident = $this->findById($id);
        return (bool) $incident->delete();
    }

    public function resolveAllActive(): int
    {
        return Incident::whereIn('status', ['open', 'investigating', 'acknowledged'])
            ->update(['status' => 'resolved']);
    }

    public function getStats(): array
    {
        // Execute a single aggregated SQL query instead of multiple roundtrips
        $stats = Incident::whereNotIn('type', ['down', 'uptime'])
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN severity IN ('critical', 'high') AND status NOT IN ('resolved', 'false_positive') THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as `open`,
                SUM(CASE WHEN status IN ('investigating', 'acknowledged') THEN 1 ELSE 0 END) as investigating,
                SUM(CASE WHEN status NOT IN ('resolved', 'false_positive') THEN 1 ELSE 0 END) as active
            ")->first();

        return [
            'total'         => (int) ($stats->total ?? 0),
            'critical'      => (int) ($stats->critical ?? 0),
            'resolved'      => (int) ($stats->resolved ?? 0),
            'open'          => (int) ($stats->open ?? 0),
            'investigating' => (int) ($stats->investigating ?? 0),
            'active'        => (int) ($stats->active ?? 0),
        ];
    }
}
