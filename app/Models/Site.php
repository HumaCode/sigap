<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'name', 'url', 'category', 'pic_name', 'pic_contact',
        'check_interval', 'sitemap_url', 'critical_pages', 'status', 'is_active',
    ];

    protected $casts = [
        'critical_pages' => 'array',
        'is_active' => 'boolean',
    ];
}
