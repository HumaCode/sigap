<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\Shield\Role;
use App\Repositories\Interfaces\UserRepositoryInterface;

class UserRepository implements UserRepositoryInterface
{
    public function getPaginatedUsers(int $perPage = 10, array $filters = [])
    {
        $query = User::with('roles');

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['role']) && $filters['role'] !== 'all') {
            $roleName = $filters['role'];
            $query->whereHas('roles', function ($q) use ($roleName) {
                $q->where('name', $roleName);
            });
        }

        if (isset($filters['status']) && $filters['status'] !== 'all') {
            if ($filters['status'] === 'active') {
                $query->where('is_active', true);
            } elseif ($filters['status'] === 'inactive') {
                $query->where('is_active', false);
            }
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById(string $id)
    {
        return User::with('roles')->findOrFail($id);
    }

    public function create(array $data)
    {
        return User::create($data);
    }

    public function update(string $id, array $data)
    {
        $user = $this->findById($id);
        $user->update($data);
        return $user;
    }

    public function delete(string $id)
    {
        $user = $this->findById($id);
        return $user->delete();
    }

    public function toggleStatus(string $id)
    {
        $user = $this->findById($id);
        $user->is_active = !$user->is_active;
        $user->save();
        return $user;
    }

    public function getStats(): array
    {
        $userStats = User::query()
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
            ")
            ->first();

        $roleCounts = \DB::table('roles')
            ->leftJoin('model_has_roles', function ($join) {
                $join->on('roles.id', '=', 'model_has_roles.role_id')
                     ->where('model_has_roles.model_type', '=', User::class);
            })
            ->groupBy('roles.name')
            ->selectRaw('roles.name, count(model_has_roles.model_id) as count')
            ->pluck('count', 'name');

        return [
            'total'     => (int) ($userStats->total ?? 0),
            'active'    => (int) ($userStats->active ?? 0),
            'inactive'  => (int) ($userStats->inactive ?? 0),
            'dev'       => (int) ($roleCounts['dev'] ?? 0),
            'admin'     => (int) ($roleCounts['admin'] ?? 0),
            'user'      => (int) ($roleCounts['user'] ?? 0),
        ];
    }

    public function getAllRoles()
    {
        return Role::select(['id', 'name', 'slug', 'description'])->get();
    }
}
