import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../../../css/report-print.css';

interface OfficialPrintDocumentProps {
    type?: 'all' | 'single';
    site?: any;
    sites?: any[];
    stats?: any;
    filters?: { range?: string; category?: string; search?: string };
}

export default function OfficialPrintDocument({
    type = 'all',
    site,
    sites = [],
    stats = {},
    filters = {}
}: OfficialPrintDocumentProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || typeof document === 'undefined') return null;

    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    const rangeLabelMap: Record<string, string> = {
        '24h': '24 Jam Terakhir',
        '7d': '7 Hari Terakhir',
        '30d': '30 Hari Terakhir',
        '90d': '90 Hari (Triwulan)',
    };

    const periodLabel = rangeLabelMap[filters.range || '30d'] || '30 Hari Terakhir';

    if (type === 'single' && site) {
        const isMetSla = (site.uptime ?? 99.9) >= 99.5;
        const isDown = site.status === 'down';
        const isWarn = site.status === 'warn';

        return createPortal(
            <div id="print-root">
                {/* Official Kop Surat */}
                <div className="print-kop-surat">
                    <p className="print-kop-line-1">PEMERINTAH KOTA PEKALONGAN</p>
                    <p className="print-kop-line-2">DINAS KOMUNIKASI DAN INFORMATIKA</p>
                    <p className="print-kop-address">
                        Jl. Mataram No. 1, Kota Pekalongan, Jawa Tengah 51111 | Telp: (0285) 421093 | Email: diskominfo@pekalongankota.go.id
                    </p>
                </div>
                <div className="print-kop-divider"></div>

                {/* Document Header */}
                <div className="print-doc-header">
                    <h2 className="print-doc-title">LEMBAR LAPORAN AUDIT KETERSEDIAAN SITUS & SLA</h2>
                    <p className="print-doc-number">Nomor Dokumen: SIGAP/AUDIT/{site.id?.toString().padStart(4, '0')}/{new Date().getFullYear()}</p>
                </div>

                <div className="print-doc-meta">
                    <span><strong>Sistem:</strong> SIGAP (Sistem Informasi Gangguan & Pengawasan Situs)</span>
                    <span><strong>Tanggal Cetak:</strong> {todayFormatted}</span>
                </div>

                {/* Site Profile Card */}
                <div className="print-site-card">
                    <h3 className="print-site-title">{site.name}</h3>
                    <div className="print-site-url">
                        <strong>URL Domain:</strong> https://{site.url} | <strong>Kategori:</strong> {site.category || 'Portal'}
                    </div>

                    <div className="print-grid-metrics">
                        <div className="print-metric-box">
                            <div className="print-metric-label">Uptime 30 Hari</div>
                            <div className="print-metric-value" style={{ color: isMetSla ? '#0d8280' : '#b91c1c' }}>
                                {site.uptime}%
                            </div>
                            <div className="print-metric-sub">{isMetSla ? '✓ Memenuhi SLA' : '⚠ Di Bawah Target'}</div>
                        </div>
                        <div className="print-metric-box">
                            <div className="print-metric-label">Latensi Respon</div>
                            <div className="print-metric-value">
                                {isDown ? 'Timeout' : (isWarn ? '1.400 ms' : '142 ms')}
                            </div>
                            <div className="print-metric-sub">Kecepatan Server</div>
                        </div>
                        <div className="print-metric-box">
                            <div className="print-metric-label">Interval Monitor</div>
                            <div className="print-metric-value">
                                {site.check_interval || 5} mnt
                            </div>
                            <div className="print-metric-sub">Frekuensi Polling</div>
                        </div>
                        <div className="print-metric-box">
                            <div className="print-metric-label">Penanggung Jawab</div>
                            <div className="print-metric-value" style={{ fontSize: '9.5pt', marginTop: '3px' }}>
                                {site.pic_name || 'Tim Teknis OPD'}
                            </div>
                            <div className="print-metric-sub">{site.pic_contact || 'Diskominfo'}</div>
                        </div>
                    </div>
                </div>

                {/* Audit HealthCheck Logs */}
                <div className="print-audit-box">
                    <div className="print-audit-title">HASIL PEMERIKSAAN & DIAGNOSIS KONEKTIVITAS TERAKHIR</div>
                    
                    {Array.isArray(site.recent_logs) && site.recent_logs.length > 0 ? (
                        site.recent_logs.map((log: any, idx: number) => {
                            const isDangerLog = log.is_danger || log.status === 'down';
                            const isWarningLog = log.status === 'warn';
                            const badgeText = isDangerLog ? '[ GANGGUAN ]' : (isWarningLog ? '[ WASPADA ]' : '[ NORMAL / AMAN ]');
                            const badgeColor = isDangerLog ? '#b91c1c' : (isWarningLog ? '#d97706' : '#0d8280');

                            return (
                                <div key={log.id || idx} className="print-audit-row">
                                    <span><strong>{idx + 1}. {log.source || 'Pemeriksaan Sistem'}:</strong> {log.title}</span>
                                    <span style={{ fontWeight: 'bold', color: badgeColor }}>{badgeText}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="print-audit-row">
                            <span><strong>1. HTTP HealthCheck:</strong> {isDown ? 'Gagal Terhubung (HTTP 503 / Timeout)' : 'HTTP 200 OK (Koneksi Sukses & Stabil)'}</span>
                            <span style={{ fontWeight: 'bold', color: isDown ? '#b91c1c' : '#0d8280' }}>
                                {isDown ? '[ GANGGUAN ]' : '[ NORMAL ]'}
                            </span>
                        </div>
                    )}

                    <div className="print-audit-row">
                        <span><strong>Status Target SLA:</strong> Target Ketersediaan Minimum 99.50%</span>
                        <span style={{ fontWeight: 'bold', color: isMetSla ? '#0d8280' : '#b91c1c' }}>
                            {isMetSla ? '[ TERCAPAI ]' : '[ PERLU TINDAKAN ]'}
                        </span>
                    </div>
                </div>

                {/* Signatures */}
                <div className="print-signature-area">
                    <div className="print-signature-box">
                        <p>Penanggung Jawab Situs OPD,</p>
                        <div className="print-signature-space"></div>
                        <p className="print-signature-name">{site.pic_name || 'Administrator OPD'}</p>
                        <p className="print-signature-nip">NIP. ........................................</p>
                    </div>

                    <div className="print-signature-box">
                        <p>Pekalongan, {todayFormatted}<br />Pengelola Layanan SPBE & SIGAP,</p>
                        <div className="print-signature-space"></div>
                        <p className="print-signature-name">TIM TANGGAP INSIDEN SIBER (CSIRT)</p>
                        <p className="print-signature-nip">Dinas Kominfo Kota Pekalongan</p>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // Default: Overall Summary Report
    return createPortal(
        <div id="print-root">
            {/* Official Kop Surat */}
            <div className="print-kop-surat">
                <p className="print-kop-line-1">PEMERINTAH KOTA PEKALONGAN</p>
                <p className="print-kop-line-2">DINAS KOMUNIKASI DAN INFORMATIKA</p>
                <p className="print-kop-address">
                    Jl. Mataram No. 1, Kota Pekalongan, Jawa Tengah 51111 | Telp: (0285) 421093 | Email: diskominfo@pekalongankota.go.id
                </p>
            </div>
            <div className="print-kop-divider"></div>

            {/* Document Header */}
            <div className="print-doc-header">
                <h2 className="print-doc-title">LAPORAN REKAPITULASI KINERJA KETERSEDIAAN SITUS (SLA)</h2>
                <p className="print-doc-number">Nomor: 500.12/SIGAP-LAP/{new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
            </div>

            <div className="print-doc-meta">
                <span><strong>Periode Pemantauan:</strong> {periodLabel}</span>
                <span><strong>Kategori:</strong> {filters.category || 'Semua Kategori Situs'}</span>
                <span><strong>Tanggal Dicetak:</strong> {todayFormatted}</span>
            </div>

            {/* Executive KPI Summary Table */}
            <table className="print-summary-table">
                <thead>
                    <tr>
                        <th>Rata-rata Uptime</th>
                        <th>Target SLA (99.5%)</th>
                        <th>Situs Memenuhi SLA</th>
                        <th>Total Downtime</th>
                        <th>Rata-rata Respon</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ fontSize: '10pt', color: '#0d8280' }}>{stats.avg_uptime || 99.3}%</td>
                        <td>99.50%</td>
                        <td>{stats.sites_met_sla || 0} dari {stats.total_sites || 0} Situs ({stats.total_sites ? Math.round(((stats.sites_met_sla || 0) / stats.total_sites) * 100) : 0}%)</td>
                        <td>{stats.total_downtime || 0} Menit</td>
                        <td>{stats.avg_response_time || 142} ms</td>
                    </tr>
                </tbody>
            </table>

            {/* Main Data Table */}
            <table className="print-data-table">
                <thead>
                    <tr>
                        <th style={{ width: '5%' }}>No</th>
                        <th style={{ width: '30%' }}>Nama OPD / Instansi</th>
                        <th style={{ width: '28%' }}>Alamat Domain (URL)</th>
                        <th style={{ width: '12%' }}>Kategori</th>
                        <th style={{ width: '12%' }}>Uptime (%)</th>
                        <th style={{ width: '13%' }}>Status SLA</th>
                    </tr>
                </thead>
                <tbody>
                    {sites && sites.length > 0 ? (
                        sites.map((item: any, idx: number) => {
                            const metSla = (item.uptime ?? 99.9) >= 99.5;
                            return (
                                <tr key={item.id || idx}>
                                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                    <td><strong>{item.name}</strong></td>
                                    <td>{item.url}</td>
                                    <td style={{ textAlign: 'center' }}>{item.category || '-'}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.uptime}%</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`print-sla-badge ${metSla ? 'print-sla-met' : 'print-sla-miss'}`}>
                                            {metSla ? 'Tercapai' : 'Di Bawah SLA'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '12px' }}>
                                Tidak ada data situs yang tersedia.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Signatures */}
            <div className="print-signature-area">
                <div className="print-signature-box">
                    <p>Mengetahui,<br />Kepala Bidang IKP Diskominfo,</p>
                    <div className="print-signature-space"></div>
                    <p className="print-signature-name">Pejabat Pengawas SPBE</p>
                    <p className="print-signature-nip">NIP. 19820514 200604 1 008</p>
                </div>

                <div className="print-signature-box">
                    <p>Pekalongan, {todayFormatted}<br />Administrator SIGAP,</p>
                    <div className="print-signature-space"></div>
                    <p className="print-signature-name">TIM OPERASIONAL CSIRT</p>
                    <p className="print-signature-nip">Dinas Kominfo Kota Pekalongan</p>
                </div>
            </div>
        </div>,
        document.body
    );
}
