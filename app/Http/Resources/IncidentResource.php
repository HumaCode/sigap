<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncidentResource extends JsonResource
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
            'site_name' => $this->site ? $this->site->name : null,
            'title' => $this->title,
            'type' => $this->type,
            'severity' => $this->severity,
            'status' => $this->status,
            'description' => $this->description,
            'payload' => $this->payload,
            'detected_at' => $this->detected_at ? \Carbon\Carbon::parse($this->detected_at)->format('Y-m-d H:i:s') : null,
            'detected_at_human' => $this->detected_at ? \Carbon\Carbon::parse($this->detected_at)->locale('id')->diffForHumans() : null,
            'created_at' => $this->created_at ? \Carbon\Carbon::parse($this->created_at)->format('Y-m-d H:i:s') : null,
        ];
    }
}
