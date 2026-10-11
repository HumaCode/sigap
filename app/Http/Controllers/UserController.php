<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Interfaces\UserServiceInterface;
use App\Http\Requests\UserIndexRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\PaginateResource;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        protected UserServiceInterface $userService
    ) {}

    /**
     * Display a paginated listing of users with stats and role options.
     */
    public function index(UserIndexRequest $request): Response
    {
        $filters = $request->filters();
        $perPage = (int) $request->input('per_page', 10);
        
        $users = $this->userService->getPaginatedUsers($perPage, $filters);
        $stats = $this->userService->getStats();
        $roles = $this->userService->getRoles();

        return Inertia::render('Pengguna/Index', [
            'users'   => new PaginateResource($users, UserResource::class),
            'filters' => $filters,
            'stats'   => $stats,
            'roles'   => $roles,
            'can'     => [
                'create' => $request->user()?->can('create', User::class) ?? false,
            ],
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(StoreUserRequest $request)
    {
        try {
            $user = $this->userService->createUser($request->validated());
            return redirect()->back()->with('success', "Akun pengguna '{$user->name}' berhasil ditambahkan.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan pengguna: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UpdateUserRequest $request, string $id)
    {
        try {
            $user = $this->userService->updateUser($id, $request->validated());
            return redirect()->back()->with('success', "Data pengguna '{$user->name}' berhasil diperbarui.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui pengguna: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(string $id)
    {
        try {
            $targetUser = $this->userService->getUserById($id);
            Gate::authorize('delete', $targetUser);

            $this->userService->deleteUser($id);
            return redirect()->back()->with('success', "Akun pengguna '{$targetUser->name}' berhasil dihapus.");
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return redirect()->back()->with('error', 'Anda tidak memiliki hak akses untuk menghapus pengguna ini.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Toggle active/inactive status of the specified user.
     */
    public function toggleStatus(string $id)
    {
        try {
            $targetUser = $this->userService->getUserById($id);
            Gate::authorize('toggleStatus', $targetUser);

            $user = $this->userService->toggleStatus($id);
            $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';
            return redirect()->back()->with('success', "Akun pengguna '{$user->name}' berhasil {$statusText}.");
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return redirect()->back()->with('error', 'Anda tidak memiliki hak akses untuk mengubah status pengguna ini.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
