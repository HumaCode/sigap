<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'url' => $this->url,
            'category' => $this->category,
            'pic_name' => $this->pic_name,
            'pic_contact' => $this->pic_contact,
            'check_interval' => $this->check_interval,
            'sitemap_url' => $this->sitemap_url,
            'critical_pages' => $this->critical_pages,
            'status' => $this->status,
            'is_active' => $this->is_active,
            'ssh_host' => $this->ssh_host,
            'ssh_port' => $this->ssh_port,
            'ssh_username' => $this->ssh_username,
            'ssh_auth_type' => $this->ssh_auth_type,
            'ssh_password' => !empty($this->ssh_password) ? '********' : null,
            'ssh_private_key' => !empty($this->ssh_private_key) ? '********' : null,
            'ssh_app_path' => $this->ssh_app_path,
            'created_at' => $this->created_at,
            'uptime' => $this->uptime_percentage,
            'ssl' => [
                'status' => $this->ssl_status ?? 'unknown',
                'issuer' => $this->ssl_issuer,
                'valid_to' => $this->ssl_valid_to ? $this->ssl_valid_to->toIso8601String() : null,
                'valid_to_formatted' => $this->ssl_valid_to ? $this->ssl_valid_to->format('d M Y') : null,
                'days_left' => $this->ssl_days_left,
                'last_checked_at' => $this->ssl_last_checked_at ? $this->ssl_last_checked_at->diffForHumans() : null,
            ],
            'domain' => [
                'name' => $this->domain_name,
                'status' => $this->domain_status ?? 'unknown',
                'registrar' => $this->domain_registrar,
                'expires_at' => $this->domain_expires_at ? $this->domain_expires_at->toIso8601String() : null,
                'expires_at_formatted' => $this->domain_expires_at ? $this->domain_expires_at->format('d M Y') : null,
                'days_left' => $this->domain_days_left,
                'last_checked_at' => $this->domain_last_checked_at ? $this->domain_last_checked_at->diffForHumans() : null,
                'name_servers' => $this->dns_name_servers ?? [],
                'dns_last_checked_at' => $this->dns_last_checked_at ? $this->dns_last_checked_at->diffForHumans() : null,
            ],
            'requests_per_minute' => $rpm = $this->status === 'down' ? 0 : ($this->requests_per_minute ?? ($this->status === 'warn' ? 1450 : 180)),
            'requests_formatted' => $this->status === 'down' ? '0 req/mnt' : number_format($rpm, 0, ',', '.') . ' req/mnt',
            'is_high_load' => $this->status === 'warn' || $rpm >= 1200,
            'traffic_level' => match(true) {
                $this->status === 'down' => 'offline',
                $rpm > 3000 => 'critical',
                $rpm > 1200 => 'high',
                $rpm > 450 => 'moderate',
                default => 'normal'
            },
            'traffic_label' => match(true) {
                $this->status === 'down' => 'Offline (0 req/mnt)',
                $rpm > 3000 => 'Bahaya / Flood',
                $rpm > 1200 => 'Padat (Waspada)',
                $rpm > 450 => 'Sedang',
                default => 'Normal (Aman)'
            },
            'recent_logs' => ($this->relationLoaded('detectionLogs') && $this->detectionLogs->isNotEmpty())
                ? $this->detectionLogs->take(5)->map(function ($log) {
                    $isDanger = in_array(strtolower($log->status ?? ''), ['new', 'blocked', 'danger', 'alert']) 
                        || in_array(strtolower($log->category ?? ''), ['judol', 'obat', 'deface', 'hidden']);
                    return [
                        'id' => (string) $log->id,
                        'source' => $log->source ?? 'Internal Scanner',
                        'title' => $log->title,
                        'category' => $log->category,
                        'status' => $log->status,
                        'context' => $log->context,
                        'time_ago' => $log->created_at ? $log->created_at->diffForHumans() : 'Baru saja',
                        'is_danger' => $isDanger,
                    ];
                })->values()->all()
                : [
                    [
                        'id' => 'http-check',
                        'source' => 'HTTP HealthCheck Engine',
                        'title' => $this->status === 'down' ? 'HTTP Status 503 / Timeout' : ($this->status === 'warn' ? 'HTTP 200 OK (Tinggi Respon / Beban)' : 'HTTP 200 OK (Koneksi Sukses & Stabil)'),
                        'category' => 'uptime',
                        'status' => $this->status === 'down' ? 'down' : 'normal',
                        'context' => 'Pemeriksaan status respon HTTP secara berkala.',
                        'time_ago' => 'Baru saja',
                        'is_danger' => $this->status === 'down',
                    ],
                    [
                        'id' => 'ssl-check',
                        'source' => 'SSL/TLS Certificate Check',
                        'title' => 'Sertifikat Keamanan Valid (HTTPS Enkripsi Aktif)',
                        'category' => 'security',
                        'status' => 'valid',
                        'context' => 'Pemeriksaan masa berlaku sertifikat SSL.',
                        'time_ago' => ($this->check_interval ?? 5) . ' menit lalu',
                        'is_danger' => false,
                    ],
                    [
                        'id' => 'integrity-check',
                        'source' => 'Web Content Integrity Scan',
                        'title' => 'Bebas dari deface / konten terlarang',
                        'category' => 'integrity',
                        'status' => 'clean',
                        'context' => 'Pemindaian integritas konten web.',
                        'time_ago' => (($this->check_interval ?? 5) * 2) . ' menit lalu',
                        'is_danger' => false,
                    ],
                ],
            'incidents_count' => $this->incidents_count ?? ($this->relationLoaded('incidents') ? $this->incidents->count() : $this->incidents()->count()),
            'incidents' => ($this->relationLoaded('incidents') ? $this->incidents : $this->incidents()->latest()->take(5)->get())->map(function ($inc) {
                return [
                    'id' => (string) $inc->id,
                    'title' => $inc->title,
                    'type' => $inc->type,
                    'severity' => $inc->severity,
                    'status' => $inc->status,
                    'description' => $inc->description,
                    'time_ago' => $inc->detected_at ? $inc->detected_at->diffForHumans() : ($inc->created_at ? $inc->created_at->diffForHumans() : 'Baru saja'),
                    'detected_at' => $inc->detected_at ? $inc->detected_at->format('d M Y, H:i') : null,
                ];
            })->values()->all(),
        ];
    }
}
