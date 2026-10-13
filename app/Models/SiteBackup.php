<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class SiteBackup extends Model
{
    use HasFactory, HasUlids, LogsActivity;

    protected $fillable = [
        'site_id',
        'filename',
        'file_path',
        'file_size',
        'backup_type',
        'status',
        'notes',
        'error_message',
        'created_by',
        'restored_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'restored_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('backup')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(fn(string $eventName) => "Arsip backup \"{$this->filename}\" telah di-{$eventName}");
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;
        if (!$bytes || $bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = floor(log($bytes, 1024));
        $power = min($power, count($units) - 1);

        return round($bytes / pow(1024, $power), 2) . ' ' . $units[$power];
    }
}
