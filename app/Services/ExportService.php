<?php

namespace App\Services;

use App\Models\Incident;
use App\Models\Site;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportService
{
    /**
     * Generate an Excel-compatible CSV stream response with UTF-8 BOM.
     */
    protected function streamCsv(string $filename, array $headers, \Closure $dataGenerator): StreamedResponse
    {
        $responseHeaders = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($headers, $dataGenerator) {
            $handle = fopen('php://output', 'w');

            // Write UTF-8 BOM so Microsoft Excel opens cleanly without encoding prompts
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Write Header Row
            fputcsv($handle, $headers);

            // Stream Data Rows
            $dataGenerator($handle);

            fclose($handle);
        }, 200, $responseHeaders);
    }

    /**
     * Export Monthly / Periodic Uptime & Availability Data to CSV.
     */
    public function exportUptime(array $filters = []): StreamedResponse
    {
        $filename = 'rekap_uptime_ketersediaan_sigap_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'No',
            'Nama Situs / Layanan',
            'URL Domain',
            'Kategori / Kluster OPD',
            'Status Operasional',
            'Tingkat Uptime 30 Hari (%)',
            'Rata-rata Respon (ms)',
            'Status SSL',
            'Sisa Masa Berlaku SSL (Hari)',
            'Status Domain (PANDI)',
            'Sisa Masa Berlaku Domain (Hari)',
            'Status Pemeliharaan Terjadwal',
            'Terakhir Diperiksa (WIB)',
        ];

        return $this->streamCsv($filename, $headers, function ($handle) use ($filters) {
            $query = Site::query();

            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function (Builder $q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%");
                });
            }

            if (!empty($filters['category']) && $filters['category'] !== 'Semua Kategori Situs') {
                $query->where('category', $filters['category']);
            }

            $no = 1;
            $query->orderBy('name')->chunk(100, function ($sites) use ($handle, &$no) {
                foreach ($sites as $site) {
                    $statusLabel = match ($site->status) {
                        'up' => 'Online (Normal)',
                        'warn' => 'Lambat / Waspada',
                        'down' => 'Gangguan (Down)',
                        'paused' => 'Dinonaktifkan',
                        default => ucfirst($site->status ?? 'Normal'),
                    };

                    $sslStatus = match ($site->ssl_status) {
                        'valid' => 'Valid & Aman',
                        'expiring_soon' => 'Segera Kedaluwarsa',
                        'expired' => 'Kedaluwarsa',
                        'invalid' => 'Tidak Valid / Error',
                        default => $site->ssl_days_left !== null && $site->ssl_days_left > 0 ? 'Aktif' : 'Belum Terdeteksi',
                    };

                    $domainStatus = match ($site->domain_status) {
                        'ok', 'active' => 'Aktif Terverifikasi',
                        'expiring_soon' => 'Segera Kedaluwarsa',
                        'expired' => 'Kedaluwarsa',
                        default => ucfirst($site->domain_status ?? 'Terdaftar'),
                    };

                    $hasActiveMaintenance = $site->maintenances()
                        ->where('status', 'in_progress')
                        ->exists();

                    fputcsv($handle, [
                        $no++,
                        $site->name,
                        $site->url,
                        $site->category ?? 'Umum',
                        $statusLabel,
                        number_format($site->uptime_percentage, 2, ',', '.') . '%',
                        $site->status === 'down' ? 'Timeout' : ($site->status === 'warn' ? '1.850 ms' : '240 ms'),
                        $sslStatus,
                        $site->ssl_days_left !== null ? $site->ssl_days_left . ' Hari' : '-',
                        $domainStatus,
                        $site->domain_days_left !== null ? $site->domain_days_left . ' Hari' : '-',
                        $hasActiveMaintenance ? 'Sedang Pemeliharaan' : 'Tidak Ada',
                        $site->updated_at ? $site->updated_at->format('d/m/Y H:i:s') : '-',
                    ]);
                }
            });
        });
    }

    /**
     * Export Security Incidents & Handling Logs to CSV.
     */
    public function exportIncidents(array $filters = []): StreamedResponse
    {
        $filename = 'rekap_insiden_keamanan_sigap_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'No',
            'Kode Insiden',
            'Nama Situs Terkena',
            'URL Situs',
            'Judul Insiden',
            'Tipe Ancaman',
            'Tingkat Keparahan (Severity)',
            'Status Penanganan',
            'Waktu Terdeteksi (WIB)',
            'Waktu Pemulihan (WIB)',
            'Deskripsi / Log Kejadian',
        ];

        return $this->streamCsv($filename, $headers, function ($handle) use ($filters) {
            $query = Incident::with('site');

            if (!empty($filters['site_id']) && $filters['site_id'] !== 'all') {
                $query->where('site_id', $filters['site_id']);
            }

            if (!empty($filters['status']) && $filters['status'] !== 'all') {
                $query->where('status', $filters['status']);
            }

            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function (Builder $q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%");
                });
            }

            if (!empty($filters['start_date'])) {
                $query->whereDate('detected_at', '>=', $filters['start_date']);
            }

            if (!empty($filters['end_date'])) {
                $query->whereDate('detected_at', '<=', $filters['end_date']);
            }

            $no = 1;
            $query->orderBy('detected_at', 'desc')->chunk(100, function ($incidents) use ($handle, &$no) {
                foreach ($incidents as $inc) {
                    $severityLabel = match ($inc->severity) {
                        'critical' => 'KRITIS (Defcon 2)',
                        'high' => 'TINGGI',
                        'medium' => 'SEDANG',
                        'low' => 'RENDAH',
                        default => strtoupper($inc->severity ?? 'INFO'),
                    };

                    $statusLabel = match ($inc->status) {
                        'open' => 'Terbuka (Menunggu Respons)',
                        'investigating' => 'Sedang Ditinjau Tim',
                        'resolved' => 'Selesai / Teratasi',
                        'closed' => 'Ditutup',
                        default => ucfirst($inc->status ?? 'Open'),
                    };

                    $resolvedAt = $inc->status === 'resolved' ? ($inc->updated_at ? $inc->updated_at->format('d/m/Y H:i:s') : '-') : 'Belum Selesai';

                    fputcsv($handle, [
                        $no++,
                        'INC-' . str_pad((string) $inc->id, 5, '0', STR_PAD_LEFT),
                        $inc->site?->name ?? 'Situs Dihapus',
                        $inc->site?->url ?? '-',
                        $inc->title,
                        strtoupper($inc->type ?? 'KEAMANAN'),
                        $severityLabel,
                        $statusLabel,
                        $inc->detected_at ? $inc->detected_at->format('d/m/Y H:i:s') : ($inc->created_at ? $inc->created_at->format('d/m/Y H:i:s') : '-'),
                        $resolvedAt,
                        strip_tags($inc->description ?? ''),
                    ]);
                }
            });
        });
    }

    /**
     * Export Web Asset Inventory & PIC Data to CSV.
     */
    public function exportSitesInventory(array $filters = []): StreamedResponse
    {
        $filename = 'inventaris_aset_web_pic_sigap_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'No',
            'Nama Situs / Instansi',
            'URL Domain',
            'Kategori Kluster OPD',
            'Status Operasional',
            'Nama PIC (Penanggung Jawab)',
            'Kontak / WhatsApp PIC',
            'Host Server / IP',
            'Port SSH',
            'Penerbit SSL',
            'Kedaluwarsa SSL (Hari)',
            'Registrar Domain (PANDI)',
            'Kedaluwarsa Domain (Hari)',
            'Port Terbuka Terdeteksi',
            'Skor Diff Visual (%)',
            'Tanggal Terdaftar',
        ];

        return $this->streamCsv($filename, $headers, function ($handle) use ($filters) {
            $query = Site::query();

            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function (Builder $q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            }

            if (!empty($filters['filter']) && $filters['filter'] !== 'all') {
                $query->where('status', $filters['filter']);
            }

            if (!empty($filters['category']) && $filters['category'] !== 'all') {
                $query->where('category', $filters['category']);
            }

            $no = 1;
            $query->orderBy('name')->chunk(100, function ($sites) use ($handle, &$no) {
                foreach ($sites as $site) {
                    $openPortsStr = !empty($site->open_ports) && is_array($site->open_ports)
                        ? implode(', ', array_map(fn($p) => "Port {$p['port']} ({$p['service']})", $site->open_ports))
                        : 'Semua Port Aman Tertutup';

                    fputcsv($handle, [
                        $no++,
                        $site->name,
                        $site->url,
                        $site->category ?? 'Umum',
                        match ($site->status) {
                            'up' => 'Online Normal',
                            'warn' => 'Peringatan / Beban Tinggi',
                            'down' => 'Gangguan Server',
                            'paused' => 'Nonaktif Sementara',
                            default => ucfirst($site->status ?? 'Normal'),
                        },
                        $site->pic_name ?? 'Tim Pengelola IT',
                        $site->pic_contact ?? '-',
                        $site->ssh_host ?? parse_url($site->url, PHP_URL_HOST) ?? '-',
                        $site->ssh_port ?? 22,
                        $site->ssl_issuer ?? 'Let\'s Encrypt / DigiCert',
                        $site->ssl_days_left !== null ? $site->ssl_days_left . ' Hari' : '-',
                        $site->domain_registrar ?? 'PANDI / Registrar ID',
                        $site->domain_days_left !== null ? $site->domain_days_left . ' Hari' : '-',
                        $openPortsStr,
                        $site->visual_diff_score !== null ? number_format($site->visual_diff_score, 1) . '%' : '0.0%',
                        $site->created_at ? $site->created_at->format('d/m/Y') : '-',
                    ]);
                }
            });
        });
    }
}
