<?php

namespace App\Services\Interfaces;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;

interface NotificationServiceInterface
{
    public function getPaginatedForUser(User $user, int $perPage = 10, array $filters = []): LengthAwarePaginator;

    public function getStatsForUser(User $user): array;

    public function findForUser(User $user, string $id): ?DatabaseNotification;

    public function markAsRead(User $user, string $id): bool;

    public function markAllAsRead(User $user): int;

    public function delete(User $user, string $id): bool;

    public function clearAll(User $user): int;
}
