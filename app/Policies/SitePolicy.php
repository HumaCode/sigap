<?php

namespace App\Policies;

use App\Models\Site;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SitePolicy
{
    use HandlesAuthorization;

    /**
     * Perform pre-authorization checks.
     * Role 'dev' (Super Administrator) memiliki akses penuh ke seluruh aksi.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('dev')) {
            return true;
        }

        return null;
    }

    /**
     * Menentukan apakah user dapat melihat daftar situs.
     */
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    /**
     * Menentukan apakah user dapat melihat detail situs.
     */
    public function view(User $user, Site $site): bool
    {
        return $user->is_active;
    }

    /**
     * Menentukan apakah user dapat mendaftarkan situs baru.
     */
    public function create(User $user): bool
    {
        return $user->is_active && $user->hasAnyRole(['dev', 'admin']);
    }

    /**
     * Menentukan apakah user dapat memperbarui data situs.
     */
    public function update(User $user, Site $site): bool
    {
        return $user->is_active && $user->hasAnyRole(['dev', 'admin']);
    }

    /**
     * Menentukan apakah user dapat menghapus pemantauan situs.
     * Hanya role 'dev' yang diizinkan menghapus data situs secara permanen.
     */
    public function delete(User $user, Site $site): bool
    {
        return $user->is_active && $user->hasRole('dev');
    }

    /**
     * Menentukan apakah user dapat memicu pengecekan HTTP / Ping Uptime.
     */
    public function checkUptime(User $user, ?Site $site = null): bool
    {
        return $user->is_active && $user->hasAnyRole(['dev', 'admin']);
    }

    /**
     * Menentukan apakah user dapat menguji dan mengelola koneksi SSH server.
     */
    public function manageSsh(User $user, ?Site $site = null): bool
    {
        return $user->is_active && $user->hasRole('dev');
    }
}
