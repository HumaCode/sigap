<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class DetectionLog extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('detection_log')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(fn(string $eventName) => "Log deteksi \"{$this->title}\" telah di-{$eventName}");
    }

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
