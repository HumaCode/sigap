<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $primaryRole = $this->roles->first();

        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'username'          => $this->username,
            'email'             => $this->email,
            'is_active'         => (bool)$this->is_active,
            'role_name'         => $primaryRole?->name ?? 'user',
            'role_label'        => match($primaryRole?->name) {
                'dev'   => 'Developer',
                'admin' => 'Administrator',
                'user'  => 'Pengguna',
                default => $primaryRole?->name ? ucfirst($primaryRole->name) : 'Pengguna',
            },
            'roles'             => $this->roles->map(fn($r) => [
                'id'          => $r->id,
                'name'        => $r->name,
                'slug'        => $r->slug ?? $r->name,
                'description' => $r->description ?? $r->name,
            ]),
            'created_at'        => $this->created_at ? $this->created_at->format('d M Y, H:i') : '-',
            'created_at_human'  => $this->created_at ? $this->created_at->diffForHumans() : '-',
        ];
    }
}
