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
        return [
            'total'     => User::count(),
            'active'    => User::where('is_active', true)->count(),
            'inactive'  => User::where('is_active', false)->count(),
            'dev'       => User::role('dev')->count(),
            'admin'     => User::role('admin')->count(),
            'user'      => User::role('user')->count(),
        ];
    }

    public function getAllRoles()
    {
        return Role::select(['id', 'name', 'slug', 'description'])->get();
    }
}
