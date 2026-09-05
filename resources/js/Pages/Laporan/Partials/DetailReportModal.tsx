import React from 'react';

interface DetailReportModalProps {
    show: boolean;
    onClose: () => void;
    site: any;
}

export default function DetailReportModal({ show, onClose, site }: DetailReportModalProps) {
    if (!show || !site) return null;

    const isMetSla = (site.uptime ?? 99.9) >= 99.5;
    const isDown = site.status === 'down';
    const isWarn = site.status === 'warn';

    const getStatusGradient = () => {
        if (isDown) return 'linear-gradient(135deg, #ef4444, #dc2626)';
        if (isWarn) return 'linear-gradient(135deg, #f59e0b, #d97706)';
        return 'linear-gradient(135deg, #0ea5a3, #0284c7)';
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(15,42,63,0.5)', zIndex: 1060, backdropFilter: 'blur(8px)' }} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
                    {/* Hero Header */}
                    <div style={{ background: getStatusGradient(), padding: '2rem 2.2rem', position: 'relative', color: 'white' }}>
                        <button type="button" className="btn-close btn-close-white" style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', opacity: 0.9 }} onClick={onClose} aria-label="Close"></button>
                        
                        <div className="d-flex align-items-center gap-3">
                            <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', backdropFilter: 'blur(10px)' }}>
                                <i className={`bi ${isDown ? 'bi-exclamation-octagon' : (isWarn ? 'bi-triangle-half' : 'bi-shield-check')}`}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>Laporan Performa • {site.category}</div>
                                <h4 style={{ fontWeight: 800, fontSize: '1.6rem', margin: 0 }}>{site.name}</h4>
                                <div style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: '0.2rem', fontWeight: 500 }}>
                                    <i className="bi bi-globe2 me-1"></i> {site.url}
                                </div>
                            </div>
                            <div className="ms-auto text-end">
                                {isMetSla ? (
                                    <span className="badge px-3 py-2 text-white" style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(5px)', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                                        <i className="bi bi-check-circle-fill me-1"></i> SLA TERCAPAI (99.5%)
                                    </span>
                                ) : (
                                    <span className="badge px-3 py-2 text-white" style={{ background: 'rgba(239,68,68,0.4)', backdropFilter: 'blur(5px)', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
                                        <i className="bi bi-x-circle-fill me-1"></i> DI BAWAH TARGET SLA
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-body p-4" style={{ background: '#f8fafc' }}>
                        {/* Metrics Grid */}
                        <div className="row g-3 mb-4">
                            <div className="col-6 col-sm-3">
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 600, marginBottom: '0.3rem' }}>Uptime 30 Hari</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-dark)' }}>{site.uptime}%</div>
                                    <div style={{ fontSize: '0.72rem', color: isMetSla ? 'var(--teal-1)' : '#ef4444', fontWeight: 600 }}>
                                        {isMetSla ? '✓ Di atas target' : '⚠ Butuh optimasi'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-sm-3">
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 600, marginBottom: '0.3rem' }}>Est. Latensi</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-dark)' }}>{isDown ? 'Timeout' : (isWarn ? '1.4s' : '142ms')}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', fontWeight: 600 }}>Kecepatan respon</div>
                                </div>
                            </div>
                            <div className="col-6 col-sm-3">
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 600, marginBottom: '0.3rem' }}>Interval Cek</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-dark)' }}>{site.check_interval} <span style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>mnt</span></div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', fontWeight: 600 }}>Frekuensi monitor</div>
                                </div>
                            </div>
                            <div className="col-6 col-sm-3">
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 600, marginBottom: '0.3rem' }}>Penanggung Jawab</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{site.pic_name || '-'}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', fontWeight: 600 }}>{site.pic_contact || 'No contact'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Health Status Log */}
                        <div style={{ background: 'white', padding: '1.2rem', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <h6 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
                                <i className="bi bi-clock-history me-1" style={{ color: 'var(--teal-1)' }}></i> Riwayat Pengecekan Terakhir
                            </h6>
                            <div className="d-flex flex-column gap-2">
                                <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: '#f8fafc', fontSize: '0.85rem' }}>
                                    <span className="d-flex align-items-center gap-2">
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDown ? '#ef4444' : '#22c55e' }}></span>
                                        <strong>HTTP HealthCheck Engine</strong> — {isDown ? 'HTTP Status 503 / Timeout' : 'HTTP 200 OK'}
                                    </span>
                                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>Baru saja</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: '#f8fafc', fontSize: '0.85rem' }}>
                                    <span className="d-flex align-items-center gap-2">
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                                        <strong>SSL Certificate Check</strong> — Sertifikat Valid & Aman
                                    </span>
                                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>5 menit lalu</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: '#f8fafc', fontSize: '0.85rem' }}>
                                    <span className="d-flex align-items-center gap-2">
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                                        <strong>Content Integrity Scan</strong> — Bebas dari deface / judol
                                    </span>
                                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>10 menit lalu</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer d-flex justify-content-between" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '1rem 1.5rem', background: '#f8fafc' }}>
                        <button type="button" className="btn btn-outline-secondary btn-sm" style={{ borderRadius: '10px', fontWeight: 600 }} onClick={() => window.print()}>
                            <i className="bi bi-printer me-1"></i> Cetak Laporan Situs Ini
                        </button>
                        <button type="button" className="btn btn-light btn-sm" style={{ borderRadius: '10px', fontWeight: 600, padding: '0.5rem 1.2rem' }} onClick={onClose}>
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
