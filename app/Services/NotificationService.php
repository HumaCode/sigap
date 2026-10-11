<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Interfaces\NotificationRepositoryInterface;
use App\Services\Interfaces\NotificationServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;

class NotificationService implements NotificationServiceInterface
{
    public function __construct(
        protected NotificationRepositoryInterface $notificationRepository
    ) {}

    public function getPaginatedForUser(User $user, int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        return $this->notificationRepository->getPaginatedForUser($user, $perPage, $filters);
    }

    public function getStatsForUser(User $user): array
    {
        return $this->notificationRepository->getStatsForUser($user);
    }

    public function findForUser(User $user, string $id): ?DatabaseNotification
    {
        return $this->notificationRepository->findForUser($user, $id);
    }

    public function markAsRead(User $user, string $id): bool
    {
        return $this->notificationRepository->markAsRead($user, $id);
    }

    public function markAllAsRead(User $user): int
    {
        return $this->notificationRepository->markAllAsRead($user);
    }

    public function delete(User $user, string $id): bool
    {
        return $this->notificationRepository->delete($user, $id);
    }

    public function clearAll(User $user): int
    {
        return $this->notificationRepository->clearAll($user);
    }
}
