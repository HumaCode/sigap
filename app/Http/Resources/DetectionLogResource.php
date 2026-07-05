<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class DetectionLogResource extends JsonResource
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
            'title' => $this->title,
            'category' => $this->category,
            'context' => $this->context,
            'url_path' => $this->url_path,
            'status' => $this->status,
            'source' => $this->source,
            'created_at' => $this->created_at ? $this->created_at->diffForHumans() : null,
            'site' => [
                'id' => $this->site->id ?? null,
                'name' => $this->site->name ?? null,
                'url' => $this->site->url ?? null,
            ]
        ];
    }
}
