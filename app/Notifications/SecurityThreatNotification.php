<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SecurityThreatNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected array $payload
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'title'       => $this->payload['title'] ?? 'Peringatan Ancaman Keamanan',
            'message'     => $this->payload['message'] ?? 'Terdeteksi indikasi anomali keamanan pada situs.',
            'severity'    => $this->payload['severity'] ?? 'critical',
            'category'    => 'Keamanan',
            'icon'        => $this->payload['icon'] ?? 'bi-shield-slash-fill',
            'site_name'   => $this->payload['site_name'] ?? null,
            'action_url'  => $this->payload['action_url'] ?? '/incidents',
            'meta'        => $this->payload['meta'] ?? [],
        ];
    }
}
