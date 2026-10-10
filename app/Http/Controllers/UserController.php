<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\PaginateResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'role', 'status']);
        $users = $this->userService->getPaginatedUsers(10, $filters);
        $stats = $this->userService->getStats();
        $roles = $this->userService->getRoles();

        return Inertia::render('Pengguna/Index', [
            'users'   => new PaginateResource($users, UserResource::class),
            'filters' => $filters,
            'stats'   => $stats,
            'roles'   => $roles,
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        try {
            $this->userService->createUser($request->validated());
            return redirect()->back()->with('success', 'Pengguna baru berhasil ditambahkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan pengguna: ' . $e->getMessage());
        }
    }

    public function update(UpdateUserRequest $request, string $id)
    {
        try {
            $this->userService->updateUser($id, $request->validated());
            return redirect()->back()->with('success', 'Data pengguna berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui pengguna: ' . $e->getMessage());
        }
    }

    public function destroy(string $id)
    {
        try {
            $this->userService->deleteUser($id);
            return redirect()->back()->with('success', 'Pengguna berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function toggleStatus(string $id)
    {
        try {
            $user = $this->userService->toggleStatus($id);
            $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';
            return redirect()->back()->with('success', "Akun pengguna {$user->name} berhasil {$statusText}.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
