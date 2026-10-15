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
        'ssl_status', 'ssl_issuer', 'ssl_valid_to', 'ssl_days_left', 'ssl_last_checked_at', 'ssl_alert_sent_milestone',
        'domain_name', 'domain_expires_at', 'domain_days_left', 'domain_registrar', 'domain_status', 'domain_last_checked_at', 'domain_alert_sent_milestone',
        'dns_name_servers', 'dns_records', 'dns_last_checked_at',
    ];

    protected $casts = [
        'critical_pages' => 'array',
        'is_active' => 'boolean',
        'requests_per_minute' => 'integer',
        'pic_name' => 'encrypted',
        'pic_contact' => 'encrypted',
        'ssh_password' => 'encrypted',
        'ssh_private_key' => 'encrypted',
        'ssl_valid_to' => 'datetime',
        'ssl_last_checked_at' => 'datetime',
        'ssl_days_left' => 'integer',
        'domain_expires_at' => 'datetime',
        'domain_last_checked_at' => 'datetime',
        'domain_days_left' => 'integer',
        'dns_last_checked_at' => 'datetime',
        'dns_name_servers' => 'array',
        'dns_records' => 'array',
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

    public function maintenances()
    {
        return $this->belongsToMany(ScheduledMaintenance::class, 'scheduled_maintenance_site', 'site_id', 'maintenance_id')
            ->withTimestamps();
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
