<?php

namespace App\Policies;

use App\Models\SiteSecurity;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SiteSecurityPolicy
{
    use HandlesAuthorization;

    /**
     * Role 'dev' (Super Administrator) memiliki otorisasi penuh.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('dev')) {
            return true;
        }

        return null;
    }

    /**
     * Menentukan apakah pengguna dapat melihat daftar audit keamanan situs.
     */
    public function viewAny(User $user): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * Menentukan apakah pengguna dapat melihat detail audit suatu situs.
     */
    public function view(User $user, ?SiteSecurity $security = null): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * Menentukan apakah pengguna dapat menjalankan pemindaian audit keamanan situs.
     */
    public function scan(User $user): bool
    {
        return (bool) ($user->is_active && $user->hasAnyRole(['dev', 'admin', 'operator']));
    }
}
