<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Interfaces\NotificationRepositoryInterface;
use App\Services\Interfaces\NotificationServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService implements NotificationServiceInterface
{
    /**
     * Send an alert notification to configured channels (Telegram & Logs).
     *
     * @param string $message
     * @return bool
     */
    public static function sendAlert(string $message): bool
    {
        // 1. Log the alert to application logs for audit trail
        Log::warning("[SIGAP-SECURITY-ALERT] " . $message);

        // 2. Try to dispatch Telegram Alert
        $botToken = env('TELEGRAM_BOT_TOKEN');
        $chatId = env('TELEGRAM_CHAT_ID');

        if ($botToken && $chatId) {
            try {
                $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
                $response = Http::timeout(5)->post($url, [
                    'chat_id' => $chatId,
                    'text' => "🛡️ *SIGAP SECURITY MONITORING*\n\n" . $message,
                    'parse_mode' => 'Markdown',
                ]);

                return $response->successful();
            } catch (\Exception $e) {
                Log::error("Failed to send Telegram alert: " . $e->getMessage());
                return false;
            }
        }

        return true;
    }

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
