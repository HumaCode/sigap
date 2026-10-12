<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class IncidentConversation extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('incident_conversation')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(fn(string $eventName) => "Percakapan AI insiden telah di-{$eventName}");
    }

    protected $fillable = [
        'incident_id',
        'user_message',
        'ai_response',
        'model_used',
        'provider',
    ];

    public function incident()
    {
        return $this->belongsTo(Incident::class);
    }
}
