<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Incident extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('incident')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(fn(string $eventName) => "Insiden \"{$this->title}\" telah di-{$eventName}");
    }

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

    public function conversations()
    {
        return $this->hasMany(IncidentConversation::class)->orderBy('created_at', 'asc');
    }
}
