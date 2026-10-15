<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class StatusSubscriber extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'type',
        'contact',
        'site_id',
        'is_active',
        'verification_token',
        'verified_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
