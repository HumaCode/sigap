<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send an alert notification to configured channels.
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
}
