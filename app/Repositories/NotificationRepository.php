<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Interfaces\NotificationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;

class NotificationRepository implements NotificationRepositoryInterface
{
    public function getPaginatedForUser(User $user, int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        $query = $user->notifications();

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('data->title', 'like', "%{$search}%")
                  ->orWhere('data->message', 'like', "%{$search}%")
                  ->orWhere('data->site_name', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            if ($filters['status'] === 'unread') {
                $query->whereNull('read_at');
            } elseif ($filters['status'] === 'read') {
                $query->whereNotNull('read_at');
            }
        }

        if (!empty($filters['severity']) && $filters['severity'] !== 'all') {
            $severity = $filters['severity'];
            $query->where('data->severity', $severity);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getStatsForUser(User $user): array
    {
        $raw = $user->notifications()
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) as unread,
                SUM(CASE WHEN read_at IS NOT NULL THEN 1 ELSE 0 END) as `read`,
                SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(data, '$.severity')) = 'critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(data, '$.severity')) = 'warning' THEN 1 ELSE 0 END) as warning
            ")
            ->first();

        return [
            'total'    => (int) ($raw->total ?? 0),
            'unread'   => (int) ($raw->unread ?? 0),
            'read'     => (int) ($raw->read ?? 0),
            'critical' => (int) ($raw->critical ?? 0),
            'warning'  => (int) ($raw->warning ?? 0),
        ];
    }

    public function findForUser(User $user, string $id): ?DatabaseNotification
    {
        return $user->notifications()->where('id', $id)->first();
    }

    public function markAsRead(User $user, string $id): bool
    {
        $notification = $this->findForUser($user, $id);
        if ($notification && is_null($notification->read_at)) {
            $notification->markAsRead();
            return true;
        }
        return false;
    }

    public function markAllAsRead(User $user): int
    {
        return $user->unreadNotifications()->update(['read_at' => now()]);
    }

    public function delete(User $user, string $id): bool
    {
        $notification = $this->findForUser($user, $id);
        if ($notification) {
            return (bool) $notification->delete();
        }
        return false;
    }

    public function clearAll(User $user): int
    {
        return $user->notifications()->delete();
    }
}
