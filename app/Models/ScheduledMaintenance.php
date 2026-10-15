<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;
use Carbon\Carbon;

class ScheduledMaintenance extends Model
{
    use HasFactory, HasUlids, LogsActivity;

    protected $fillable = [
        'title',
        'description',
        'status',
        'start_time',
        'end_time',
        'created_by',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('maintenance')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(fn(string $eventName) => "Jadwal pemeliharaan \"{$this->title}\" telah di-{$eventName}");
    }

    public function sites()
    {
        return $this->belongsToMany(Site::class, 'scheduled_maintenance_site', 'maintenance_id', 'site_id')
            ->withTimestamps();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for currently active maintenance (in_progress or current time is between start and end).
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where('status', 'in_progress')
              ->orWhere(function ($sub) {
                  $sub->where('status', 'scheduled')
                      ->where('start_time', '<=', now())
                      ->where('end_time', '>=', now());
              });
        });
    }

    /**
     * Scope for upcoming maintenance.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('status', 'scheduled')
            ->where('start_time', '>', now());
    }
}
