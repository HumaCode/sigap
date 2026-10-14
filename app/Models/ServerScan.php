<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class ServerScan extends Model
{
    use HasFactory, HasUlids, LogsActivity;

    protected $fillable = [
        'site_id',
        'scan_mode',
        'threat_level',
        'risk_summary',
        'total_scanned',
        'total_findings',
        'findings',
        'app_path',
        'scanned_by',
    ];

    protected $casts = [
        'findings' => 'array',
        'total_scanned' => 'integer',
        'total_findings' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('server_scan')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(fn(string $eventName) => "Hasil investigasi server \"{$this->id}\" telah di-{$eventName}");
    }

    /**
     * Relasi ke Site (Situs pemilik hasil pemindaian).
     */
    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    /**
     * Relasi ke User (Petugas pemindai).
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }

    /**
     * Format tanggal scan dalam WIB.
     */
    public function getFormattedScannedAtAttribute(): string
    {
        return $this->created_at ? $this->created_at->translatedFormat('d M Y, H:i:s') . ' WIB' : '-';
    }
}
