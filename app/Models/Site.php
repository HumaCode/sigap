<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Site extends Model
{
    use HasFactory, HasUlids, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('site')
            ->logFillable()
            ->logExcept(['ssh_password', 'ssh_private_key'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(fn(string $eventName) => "Data situs \"{$this->name}\" telah di-{$eventName}");
    }

    protected $fillable = [
        'name', 'url', 'category', 'pic_name', 'pic_contact',
        'check_interval', 'requests_per_minute', 'sitemap_url', 'critical_pages', 'status', 'is_active',
        'ssh_host', 'ssh_port', 'ssh_username', 'ssh_auth_type', 'ssh_password', 'ssh_private_key', 'ssh_app_path',
    ];

    protected $casts = [
        'critical_pages' => 'array',
        'is_active' => 'boolean',
        'requests_per_minute' => 'integer',
        'pic_name' => 'encrypted',
        'pic_contact' => 'encrypted',
        'ssh_password' => 'encrypted',
        'ssh_private_key' => 'encrypted',
    ];

    public function detectionLogs()
    {
        return $this->hasMany(DetectionLog::class);
    }

    public function security()
    {
        return $this->hasOne(SiteSecurity::class);
    }

    public function backups()
    {
        return $this->hasMany(SiteBackup::class);
    }

    public function serverScans()
    {
        return $this->hasMany(ServerScan::class);
    }

    public function latestServerScan()
    {
        return $this->hasOne(ServerScan::class)->latestOfMany();
    }

    public function incidents()
    {
        return $this->hasMany(Incident::class);
    }

    /**
     * Calculate 30-day uptime percentage dynamically based on check logs.
     */
    public function getUptimePercentageAttribute(): float
    {
        if (isset($this->attributes['uptime_total_checks_30d'])) {
            $total = (int) $this->attributes['uptime_total_checks_30d'];
            $successful = (int) ($this->attributes['uptime_successful_checks_30d'] ?? 0);
        } else {
            $logs = $this->detectionLogs()
                ->where('category', 'uptime')
                ->where('created_at', '>=', now()->subDays(30));

            $total = (clone $logs)->count();
            $successful = (clone $logs)->where('status', 'resolved')->count();
        }

        if ($total > 0) {
            return round(($successful / $total) * 100, 1);
        }

        // Fallback default jika belum ada riwayat log dalam 30 hari
        return match ($this->status) {
            'up' => 99.9,
            'warn' => 98.2,
            'down' => 0.0,
            default => 99.9,
        };
    }
}
