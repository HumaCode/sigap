<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetectionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_id',
        'title',
        'category',
        'context',
        'url_path',
        'status',
        'source',
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
