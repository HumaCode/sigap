<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SiteDownNotification extends Notification
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
            'title'       => $this->payload['title'] ?? 'Situs Mengalami Downtime',
            'message'     => $this->payload['message'] ?? 'Situs tidak dapat dijangkau atau mengalami kegagalan respons HTTP.',
            'severity'    => $this->payload['severity'] ?? 'critical',
            'category'    => 'Ketersediaan',
            'icon'        => $this->payload['icon'] ?? 'bi-exclamation-octagon-fill',
            'site_name'   => $this->payload['site_name'] ?? null,
            'action_url'  => $this->payload['action_url'] ?? '/sites',
            'meta'        => $this->payload['meta'] ?? [],
        ];
    }
}
