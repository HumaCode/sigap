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
            'created_at' => $this->created_at,
            'uptime' => 99.8, // dummy for now
        ];
    }
}
