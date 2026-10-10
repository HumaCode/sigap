<?php

namespace App\Policies;

use App\Models\DetectionLog;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class DetectionLogPolicy
{
    use HandlesAuthorization;

    /**
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
     * Menentukan apakah user dapat melihat daftar log deteksi.
     */
    public function viewAny(User $user): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * Menentukan apakah user dapat melihat detail suatu log deteksi.
     */
    public function view(User $user, ?DetectionLog $log = null): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * Menentukan apakah user dapat memperbarui status temuan log (Blokir, False Positive, Reviewed).
     */
    public function updateStatus(User $user, ?DetectionLog $log = null): bool
    {
        return (bool) ($user->is_active && $user->hasAnyRole(['dev', 'admin', 'operator']));
    }

    /**
     * Menentukan apakah user dapat menandai seluruh log baru sebagai telah ditinjau.
     */
    public function markAllReviewed(User $user): bool
    {
        return (bool) ($user->is_active && $user->hasAnyRole(['dev', 'admin', 'operator']));
    }
}
