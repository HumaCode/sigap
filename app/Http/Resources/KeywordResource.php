<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KeywordResource extends JsonResource
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
            'keyword' => $this->keyword,
            'category' => $this->category,
            'type' => $this->type,
            'is_active' => $this->is_active,
            'created_by' => $this->created_by,
            'creator_name' => $this->creator ? $this->creator->name : 'System',
            'created_at' => $this->created_at->format('j M Y'),
        ];
    }
}
