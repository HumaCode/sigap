<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class LogArchive extends Model
{
    use HasFactory, HasUlids, LogsActivity;

    protected $fillable = [
        'period',
        'title',
        'activity_log_count',
        'detection_log_count',
        'pdf_path',
        'pdf_size',
        'csv_path',
        'csv_size',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'activity_log_count' => 'integer',
        'detection_log_count' => 'integer',
        'pdf_size' => 'integer',
        'csv_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('log_archive')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(fn(string $eventName) => "Arsip log periode \"{$this->period}\" telah di-{$eventName}");
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFormattedPdfSizeAttribute(): string
    {
        return $this->formatBytes($this->pdf_size);
    }

    public function getFormattedCsvSizeAttribute(): string
    {
        return $this->formatBytes($this->csv_size);
    }

    private function formatBytes(?int $bytes): string
    {
        if (!$bytes || $bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = floor(log($bytes, 1024));
        $power = min($power, count($units) - 1);

        return round($bytes / pow(1024, $power), 2) . ' ' . $units[$power];
    }
}
