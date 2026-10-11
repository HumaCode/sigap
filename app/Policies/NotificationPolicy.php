<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Auth\Access\HandlesAuthorization;

class NotificationPolicy
{
    use HandlesAuthorization;

    /**
     * Role 'dev' memiliki akses luas.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('dev')) {
            return true;
        }

        return null;
    }

    /**
     * Pengguna aktif dapat melihat notifikasi miliknya.
     */
    public function viewAny(User $user): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * IDOR Protection: Pengguna hanya boleh menandai notifikasi miliknya sendiri.
     */
    public function markAsRead(User $user, DatabaseNotification $notification): bool
    {
        return (bool) ($user->is_active && (string) $notification->notifiable_id === (string) $user->id);
    }

    /**
     * IDOR Protection: Pengguna hanya boleh menghapus notifikasi miliknya sendiri.
     */
    public function delete(User $user, DatabaseNotification $notification): bool
    {
        return (bool) ($user->is_active && (string) $notification->notifiable_id === (string) $user->id);
    }

    /**
     * Menandai semua notifikasi milik pengguna yang sedang login.
     */
    public function markAllRead(User $user): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * Menghapus seluruh riwayat notifikasi milik pengguna.
     */
    public function clearAll(User $user): bool
    {
        return (bool) $user->is_active;
    }
}
