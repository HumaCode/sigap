<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = (array) ($this->data ?? []);

        return [
            'id'               => $this->id,
            'type'             => class_basename($this->type),
            'title'            => $data['title'] ?? 'Notifikasi Sistem',
            'message'          => $data['message'] ?? '',
            'severity'         => $data['severity'] ?? 'info',
            'category'         => $data['category'] ?? 'Sistem',
            'icon'             => $data['icon'] ?? 'bi-bell-fill',
            'site_name'        => $data['site_name'] ?? null,
            'action_url'       => $data['action_url'] ?? null,
            'meta'             => $data['meta'] ?? [],
            'read_at'          => $this->read_at?->toIso8601String(),
            'is_read'          => !is_null($this->read_at),
            'created_at'       => $this->created_at ? $this->created_at->format('d M Y, H:i') : '-',
            'created_at_human' => $this->created_at ? $this->created_at->diffForHumans() : '-',
        ];
    }
}
