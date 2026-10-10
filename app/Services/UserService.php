<?php

namespace App\Services;

use App\Repositories\Interfaces\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    public function getPaginatedUsers(int $perPage = 10, array $filters = [])
    {
        return $this->userRepository->getPaginatedUsers($perPage, $filters);
    }

    public function getStats(): array
    {
        return $this->userRepository->getStats();
    }

    public function getRoles()
    {
        return $this->userRepository->getAllRoles();
    }

    public function getUserById(string $id)
    {
        return $this->userRepository->findById($id);
    }

    public function createUser(array $data)
    {
        $role = $data['role'] ?? 'user';
        unset($data['role']);

        $data['password'] = Hash::make($data['password']);
        $data['is_active'] = isset($data['is_active']) ? (bool)$data['is_active'] : true;

        $user = $this->userRepository->create($data);
        $user->syncRoles([$role]);

        return $user;
    }

    public function updateUser(string $id, array $data)
    {
        $role = $data['role'] ?? null;
        unset($data['role']);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = (bool)$data['is_active'];
        }

        $user = $this->userRepository->update($id, $data);

        if ($role) {
            $user->syncRoles([$role]);
        }

        return $user;
    }

    public function deleteUser(string $id)
    {
        $currentUser = Auth::user();
        if ($currentUser && $currentUser->id === $id) {
            throw new \Exception('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
        }

        $userToDelete = $this->userRepository->findById($id);
        if ($userToDelete->hasRole('dev') && \App\Models\User::role('dev')->count() <= 1) {
            throw new \Exception('Tidak dapat menghapus satu-satunya akun Developer/Superadmin.');
        }

        return $this->userRepository->delete($id);
    }

    public function toggleStatus(string $id)
    {
        $currentUser = Auth::user();
        if ($currentUser && $currentUser->id === $id) {
            throw new \Exception('Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        return $this->userRepository->toggleStatus($id);
    }
}
