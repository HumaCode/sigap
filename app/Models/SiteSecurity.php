<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class SiteSecurity extends Model
{
    use HasFactory, HasUlids;

    protected $table = 'site_securities';

    protected $fillable = [
        'site_id',
        'score',
        'grade',
        'issues_count',
        'checks',
        'last_scanned_at',
    ];

    protected $casts = [
        'checks' => 'array',
        'last_scanned_at' => 'datetime',
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
