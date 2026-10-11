<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Role 'dev' (Super Administrator) memiliki akses penuh ke seluruh manajemen pengguna.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('dev')) {
            return true;
        }

        return null;
    }

    /**
     * Menentukan apakah user dapat melihat daftar akun pengguna.
     */
    public function viewAny(User $user): bool
    {
        return (bool) ($user->is_active && $user->hasAnyRole(['dev', 'admin']));
    }

    /**
     * Menentukan apakah user dapat melihat detail pengguna.
     */
    public function view(User $user, User $model): bool
    {
        return (bool) ($user->is_active && $user->hasAnyRole(['dev', 'admin']));
    }

    /**
     * Menentukan apakah user dapat mendaftarkan akun baru.
     */
    public function create(User $user): bool
    {
        return (bool) ($user->is_active && $user->hasAnyRole(['dev', 'admin']));
    }

    /**
     * Menentukan apakah user dapat memperbarui data akun pengguna.
     * Pencegahan IDOR / Escalation: Admin non-dev dilarang mengedit akun developer.
     */
    public function update(User $user, User $model): bool
    {
        if (!$user->is_active || !$user->hasAnyRole(['dev', 'admin'])) {
            return false;
        }

        // Admin biasa tidak boleh mengubah profil / hak akses akun role dev
        if ($model->hasRole('dev') && !$user->hasRole('dev')) {
            return false;
        }

        return true;
    }

    /**
     * Menentukan apakah user dapat menghapus akun pengguna.
     * Pencegahan IDOR:
     * 1. Tidak boleh menghapus diri sendiri yang sedang login.
     * 2. Admin biasa dilarang menghapus akun developer.
     * 3. Developer tidak boleh menghapus satu-satunya akun dev yang tersisa.
     */
    public function delete(User $user, User $model): bool
    {
        if (!$user->is_active || !$user->hasAnyRole(['dev', 'admin'])) {
            return false;
        }

        if ($user->id === $model->id) {
            return false;
        }

        if ($model->hasRole('dev') && !$user->hasRole('dev')) {
            return false;
        }

        if ($model->hasRole('dev') && User::role('dev')->count() <= 1) {
            return false;
        }

        return true;
    }

    /**
     * Menentukan apakah user dapat mengaktifkan / menonaktifkan status akun.
     */
    public function toggleStatus(User $user, User $model): bool
    {
        if (!$user->is_active || !$user->hasAnyRole(['dev', 'admin'])) {
            return false;
        }

        if ($user->id === $model->id) {
            return false;
        }

        if ($model->hasRole('dev') && !$user->hasRole('dev')) {
            return false;
        }

        return true;
    }
}
