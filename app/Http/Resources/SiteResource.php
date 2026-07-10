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
            'uptime' => 99.8, // dummy for now
        ];
    }
}
