<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Eksekutif SIGAP - Periode {{ $periodLabel }}</title>
    <style>
        @page {
            margin: 20mm 15mm 20mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0f766e;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header-title {
            font-size: 14px;
            font-weight: bold;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
        }
        .header-sub {
            font-size: 10px;
            color: #64748b;
            margin: 0;
        }
        .report-title {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin: 15px 0 5px 0;
            text-align: center;
        }
        .report-meta {
            text-align: center;
            font-size: 10px;
            color: #475569;
            margin-bottom: 20px;
        }
        .grid-summary {
            width: 100%;
            margin-bottom: 20px;
        }
        .grid-summary td {
            width: 25%;
            padding: 8px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            text-align: center;
        }
        .stat-val {
            font-size: 16px;
            font-weight: bold;
            color: #0f766e;
            margin-bottom: 2px;
        }
        .stat-lbl {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
        }
        h3 {
            font-size: 12px;
            color: #0f766e;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 18px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10px;
        }
        table.data-table th {
            background-color: #0f766e;
            color: #ffffff;
            font-weight: 600;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #0f766e;
        }
        table.data-table td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
        }
        table.data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 8px;
            font-weight: bold;
            border-radius: 3px;
            text-transform: uppercase;
        }
        .badge-success { background-color: #dcfce7; color: #15803d; }
        .badge-danger { background-color: #fee2e2; color: #b91c1c; }
        .badge-warning { background-color: #fef3c7; color: #b45309; }
        .badge-info { background-color: #e0f2fe; color: #0369a1; }
        .footer {
            margin-top: 30px;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            font-size: 8px;
            color: #94a3b8;
            text-align: right;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="header-title">PEMERINTAH KOTA PEKALONGAN &bull; DISKOMINFO</div>
        <div class="header-sub">SIGAP &mdash; Sistem Informasi Gangguan & Analisis Performa Layanan Web OPD</div>
    </div>

    <div class="report-title">LAPORAN REKAPITULASI PEMANTAUAN & AUDIT SISTEM</div>
    <div class="report-meta">
        <strong>Periode:</strong> {{ $periodLabel }} &nbsp;|&nbsp; 
        <strong>Digenerate:</strong> {{ $generatedAt }} &nbsp;|&nbsp; 
        <strong>Status Arsip:</strong> Terarsip & Dibersihkan Otomatis
    </div>

    <!-- Summary Box Grid -->
    <table class="grid-summary">
        <tr>
            <td>
                <div class="stat-val">{{ number_format($totalSites) }}</div>
                <div class="stat-lbl">Situs Dipantau</div>
            </td>
            <td>
                <div class="stat-val">{{ $avgUptime }}%</div>
                <div class="stat-lbl">Rata-rata Uptime</div>
            </td>
            <td>
                <div class="stat-val">{{ number_format($totalIncidents) }}</div>
                <div class="stat-lbl">Insiden Terdeteksi</div>
            </td>
            <td>
                <div class="stat-val">{{ number_format($totalLogsArchived) }}</div>
                <div class="stat-lbl">Data Log Terarsip</div>
            </td>
        </tr>
    </table>

    <!-- Ketersediaan Situs OPD -->
    <h3>1. Rekapitulasi Ketersediaan Situs & Layanan OPD</h3>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 35%;">Nama Situs</th>
                <th style="width: 25%;">Domain URL</th>
                <th style="width: 15%; text-align: center;">Tingkat Uptime</th>
                <th style="width: 20%; text-align: center;">Status Terakhir</th>
            </tr>
        </thead>
        <tbody>
            @forelse($sites as $idx => $s)
                <tr>
                    <td style="text-align: center;">{{ $idx + 1 }}</td>
                    <td><strong>{{ $s['name'] }}</strong></td>
                    <td>{{ $s['url'] }}</td>
                    <td style="text-align: center;">{{ $s['uptime'] }}%</td>
                    <td style="text-align: center;">
                        @if($s['status'] === 'up')
                            <span class="badge badge-success">Online Normal</span>
                        @elseif($s['status'] === 'warn')
                            <span class="badge badge-warning">Degradasi</span>
                        @else
                            <span class="badge badge-danger">Gangguan</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; color: #94a3b8;">Tidak ada data situs tercatat.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Riwayat Insiden Terdeteksi -->
    <h3>2. Ringkasan Insiden Gangguan & Keamanan Siber</h3>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 20%;">Waktu</th>
                <th style="width: 35%;">Judul Insiden</th>
                <th style="width: 20%;">Kategori</th>
                <th style="width: 20%; text-align: center;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($incidents as $idx => $inc)
                <tr>
                    <td style="text-align: center;">{{ $idx + 1 }}</td>
                    <td>{{ $inc['detected_at'] }}</td>
                    <td>{{ $inc['title'] }}</td>
                    <td><span class="badge badge-info">{{ $inc['type'] }}</span></td>
                    <td style="text-align: center;">
                        @if($inc['status'] === 'resolved')
                            <span class="badge badge-success">Selesai</span>
                        @else
                            <span class="badge badge-danger">{{ ucfirst($inc['status']) }}</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; color: #94a3b8;">Nihil. Tidak ada insiden tercatat pada periode ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Ringkasan Audit Log -->
    <h3>3. Statistik Log Audit & Telemetri</h3>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 50%;">Komponen Log</th>
                <th style="width: 25%; text-align: right;">Jumlah Data Terarsip</th>
                <th style="width: 25%; text-align: center;">Status Pembersihan</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Log Deteksi & Pemeriksaan Otomatis (Detection Logs)</strong></td>
                <td style="text-align: right;">{{ number_format($detectionCount) }} baris</td>
                <td style="text-align: center;"><span class="badge badge-success">Pembersihan Selesai</span></td>
            </tr>
            <tr>
                <td><strong>Log Audit Aktivitas Pengguna & Sistem (Activity Logs)</strong></td>
                <td style="text-align: right;">{{ number_format($activityCount) }} baris</td>
                <td style="text-align: center;"><span class="badge badge-success">Pembersihan Selesai</span></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Dokumen ini diterbitkan secara otomatis oleh Engine Otomasi SIGAP Web Pemkot Pekalongan pada {{ $generatedAt }}.<br>
        File arsip data mentah lengkap (.ZIP / CSV) tersimpan aman pada direktori penyimpanan sistem.
    </div>

</body>
</html>
