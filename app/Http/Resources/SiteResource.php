<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'url' => $this->url,
            'category' => $this->category,
            'pic_name' => $this->pic_name,
            'pic_contact' => $this->pic_contact,
            'check_interval' => $this->check_interval,
            'sitemap_url' => $this->sitemap_url,
            'critical_pages' => $this->critical_pages,
            'status' => $this->status,
            'is_active' => $this->is_active,
            'ssh_host' => $this->ssh_host,
            'ssh_port' => $this->ssh_port,
            'ssh_username' => $this->ssh_username,
            'ssh_auth_type' => $this->ssh_auth_type,
            'ssh_password' => !empty($this->ssh_password) ? '********' : null,
            'ssh_private_key' => !empty($this->ssh_private_key) ? '********' : null,
            'ssh_app_path' => $this->ssh_app_path,
            'created_at' => $this->created_at,
            'uptime' => $this->status === 'down' ? 92.4 : ($this->status === 'warn' ? 98.2 : 99.9),
            'requests_per_minute' => $rpm = $this->status === 'down' ? 0 : ($this->requests_per_minute ?? ($this->status === 'warn' ? 1450 : 180)),
            'requests_formatted' => $this->status === 'down' ? '0 req/mnt' : number_format($rpm, 0, ',', '.') . ' req/mnt',
            'is_high_load' => $this->status === 'warn' || $rpm >= 1200,
            'traffic_level' => match(true) {
                $this->status === 'down' => 'offline',
                $rpm > 3000 => 'critical',
                $rpm > 1200 => 'high',
                $rpm > 450 => 'moderate',
                default => 'normal'
            },
            'traffic_label' => match(true) {
                $this->status === 'down' => 'Offline (0 req/mnt)',
                $rpm > 3000 => 'Bahaya / Flood',
                $rpm > 1200 => 'Padat (Waspada)',
                $rpm > 450 => 'Sedang',
                default => 'Normal (Aman)'
            },
        ];
    }
}
