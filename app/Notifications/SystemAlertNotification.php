<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SystemAlertNotification extends Notification
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
            'title'       => $this->payload['title'] ?? 'Notifikasi Sistem',
            'message'     => $this->payload['message'] ?? 'Informasi pembaruan sistem monitoring.',
            'severity'    => $this->payload['severity'] ?? 'info',
            'category'    => $this->payload['category'] ?? 'Sistem',
            'icon'        => $this->payload['icon'] ?? 'bi-bell-fill',
            'site_name'   => $this->payload['site_name'] ?? null,
            'action_url'  => $this->payload['action_url'] ?? null,
            'meta'        => $this->payload['meta'] ?? [],
        ];
    }
}
