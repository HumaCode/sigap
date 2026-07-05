<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteSecurityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'site' => [
                'id' => $this->site ? $this->site->id : null,
                'name' => $this->site ? $this->site->name : 'Situs Tidak Diketahui',
                'url' => $this->site ? $this->site->url : '-',
                'category' => $this->site ? $this->site->category : 'Lainnya',
            ],
            'score' => $this->score,
            'grade' => $this->grade,
            'issues_count' => $this->issues_count,
            'checks' => $this->checks,
            'last_scanned_at' => $this->last_scanned_at ? $this->last_scanned_at->format('j M Y H:i') : '-',
            'created_at' => $this->created_at ? $this->created_at->format('j M Y') : null,
        ];
    }
}
