import React, { useState } from 'react';
import axios from 'axios';
import { toast } from '@/Components/DynamicToast';

interface LogForensicsTabProps {
    siteId: string;
    siteName: string;
}

export default function LogForensicsTab({ siteId, siteName }: LogForensicsTabProps) {
    const [customLogPath, setCustomLogPath] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [logResult, setLogResult] = useState<any>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const response = await axios.post(route('server-investigations.analyze-logs', siteId), {
                custom_log_path: customLogPath.trim() || null,
            });

            if (response.data?.success) {
                setLogResult(response.data);
                toast.success('Analisis Selesai', `Log akses web server berhasil dianalisis.`);
            } else {
                toast.error('Log Tidak Ditemukan', response.data?.message || 'Gagal membaca berkas log server.');
            }
        } catch (err: any) {
            toast.error('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat membaca log server via SSH.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="tab-pane-content">
            {/* Header Card */}
            <div 
                className="card border-0 rounded-4 p-4 mb-4 shadow-sm"
                style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            >
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <i className="bi bi-file-earmark-medical-fill text-primary" style={{ fontSize: '1.2rem' }}></i>
                            <h5 className="fw-bold m-0" style={{ color: 'var(--ink, #0f2a3f)' }}>
                                Forensik Digital & Analisis Log Akses Server
                            </h5>
                        </div>
                        <p className="text-muted m-0" style={{ fontSize: '0.84rem' }}>
                            Membaca log web server (Nginx / Apache / PHP) via SSH untuk melacak IP pelaku, target URL yang dieksploitasi, dan waktu serangan.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn text-white d-inline-flex align-items-center gap-2 shadow-sm px-4 py-2.5"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            border: 'none',
                        }}
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <span>Membaca & Menganalisis Log...</span>
                            </>
                        ) : (
                            <>
                                <i className="bi bi-search"></i>
                                <span>Mulai Analisis Log Sekarang</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Optional Custom Log Path */}
                <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-8">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light text-muted border-end-0">
                                <i className="bi bi-terminal"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Jalur log kustom (Opsional, kosongkan untuk deteksi otomatis Nginx / Apache)"
                                value={customLogPath}
                                onChange={(e) => setCustomLogPath(e.target.value)}
                                style={{ fontSize: '0.82rem' }}
                            />
                        </div>
                    </div>
                    <div className="col-12 col-md-4">
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Default otomatis: <code>/var/log/nginx/access.log</code> atau Apache log
                        </span>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {logResult ? (
                <div>
                    {/* Summary KPI Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>BERKAS LOG AKTIF</div>
                                <div className="fw-semibold text-dark text-truncate mt-1" style={{ fontSize: '0.86rem' }} title={logResult.active_log}>
                                    <code>{logResult.active_log}</code>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>BARIS LOG DIPERIKSA</div>
                                <div className="fw-bold mt-1 text-dark" style={{ fontSize: '1.4rem' }}>
                                    {logResult.analyzed_lines} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>baris</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>AKTIVITAS ANOMALI / PERCOBAAN</div>
                                <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: logResult.total_suspicious_hits > 0 ? '#ef4444' : '#10b981' }}>
                                    {logResult.total_suspicious_hits} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>event</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>WAKTU ANALISIS</div>
                                <div className="fw-semibold text-secondary mt-1 text-truncate" style={{ fontSize: '0.88rem' }}>
                                    {logResult.analyzed_at}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        {/* Top Attacker IP Cards */}
                        <div className="col-12 col-lg-4">
                            <div className="card border-0 rounded-4 p-3 bg-white shadow-sm h-100 border">
                                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                                    <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '0.88rem' }}>
                                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                                        Top IP Pengakses Terbanyak
                                    </h6>
                                    <span className="badge bg-light text-muted border rounded-pill" style={{ fontSize: '0.68rem' }}>
                                        Aktivitas Teratas
                                    </span>
                                </div>

                                {logResult.top_ips && logResult.top_ips.length > 0 ? (
                                    <div className="d-flex flex-column gap-2">
                                        {logResult.top_ips.map((item: any, i: number) => (
                                            <div 
                                                key={i} 
                                                className="p-2.5 rounded-3 border d-flex align-items-center justify-content-between"
                                                style={{ background: '#f8fafc', fontSize: '0.8rem' }}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-secondary-subtle text-secondary rounded-circle" style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem' }}>
                                                        {i + 1}
                                                    </span>
                                                    <code className="fw-bold text-dark">{item.ip}</code>
                                                </div>
                                                <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.72rem' }}>
                                                    {item.count} request
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-muted text-center py-4" style={{ fontSize: '0.82rem' }}>
                                        Tidak ada IP pengakses yang tercatat.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Suspicious Events Log Table */}
                        <div className="col-12 col-lg-8">
                            <div className="card border-0 rounded-4 bg-white shadow-sm h-100 overflow-hidden border">
                                <div className="px-3.5 py-3 border-bottom d-flex align-items-center justify-content-between bg-light">
                                    <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '0.88rem' }}>
                                        <i className="bi bi-activity text-teal me-1"></i>
                                        Jejak Permintaan Mencurigakan Terakhir ({logResult.suspicious_events?.length || 0})
                                    </h6>
                                </div>

                                {logResult.suspicious_events && logResult.suspicious_events.length > 0 ? (
                                    <div className="table-responsive" style={{ maxHeight: '380px' }}>
                                        <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.78rem' }}>
                                            <thead className="bg-light text-muted sticky-top" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                                <tr>
                                                    <th className="ps-3">Waktu</th>
                                                    <th>IP Penyerang</th>
                                                    <th>Metode & Target URL</th>
                                                    <th>Status</th>
                                                    <th className="pe-3">Indikasi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logResult.suspicious_events.map((ev: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="ps-3 text-muted text-nowrap" style={{ fontSize: '0.74rem' }}>
                                                            {ev.timestamp}
                                                        </td>
                                                        <td>
                                                            <code className="text-dark fw-semibold">{ev.ip}</code>
                                                        </td>
                                                        <td style={{ maxWidth: '240px' }}>
                                                            <span className="badge bg-light text-dark border me-1" style={{ fontSize: '0.68rem' }}>
                                                                {ev.method}
                                                            </span>
                                                            <span className="text-break text-dark font-monospace" style={{ fontSize: '0.74rem' }}>
                                                                {ev.url}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge rounded-pill ${ev.status >= 500 ? 'bg-danger text-white' : (ev.status === 403 ? 'bg-warning text-dark' : 'bg-secondary-subtle text-muted')}`} style={{ fontSize: '0.68rem' }}>
                                                                {ev.status}
                                                            </span>
                                                        </td>
                                                        <td className="pe-3">
                                                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                                                {ev.type}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="bi bi-shield-check text-success" style={{ fontSize: '2.5rem' }}></i>
                                        <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.84rem' }}>
                                            Tidak ditemukan jejak serangan mencurigakan dalam 400 baris log terakhir.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card border-0 rounded-4 p-5 text-center bg-white shadow-sm border">
                    <div 
                        className="d-inline-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontSize: '2rem' }}
                    >
                        <i className="bi bi-file-earmark-medical"></i>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Siap Menganalisis Log Server</h5>
                    <p className="text-muted mx-auto mb-4" style={{ maxWidth: '480px', fontSize: '0.86rem' }}>
                        Klik tombol <strong>"Mulai Analisis Log Sekarang"</strong> untuk membaca rekaman akses web server situs <strong>{siteName}</strong> dan mendeteksi jejak penyerang.
                    </p>
                </div>
            )}
        </div>
    );
}
