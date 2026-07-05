<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_id',
        'title',
        'type',
        'severity',
        'status',
        'description',
        'payload',
        'detected_at'
    ];

    protected $casts = [
        'payload' => 'array',
        'detected_at' => 'datetime'
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
