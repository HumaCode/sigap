import React from 'react';

export default function DetailSiteModal({ show, onClose, site }: { show: boolean, onClose: () => void, site: any }) {
    if (!show || !site) return null;

    const isUp = site.status === 'up' || !site.status;
    const isDown = site.status === 'down';
    const isWarn = site.status === 'warn';
    const isPaused = site.status === 'paused';

    const getStatusGradient = () => {
        if (isDown) return 'linear-gradient(135deg, #ff7a6e, #e0453a)';
        if (isWarn) return 'linear-gradient(135deg, #ffb648, #f59e0b)';
        if (isPaused) return 'linear-gradient(135deg, #9ca3af, #6b7280)';
        return 'linear-gradient(135deg, #0ea5a3, #22c1a4)';
    };

    const getStatusIcon = () => {
        if (isDown) return 'bi-x-circle';
        if (isWarn) return 'bi-exclamation-triangle';
        if (isPaused) return 'bi-pause-circle';
        return 'bi-check-circle';
    };

    const getStatusText = () => {
        if (isDown) return 'Situs Mengalami Gangguan';
        if (isWarn) return 'Merespon Lambat';
        if (isPaused) return 'Pemantauan Dijeda';
        return 'Situs Online & Sehat';
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(15,42,63,0.5)', zIndex: 1060, backdropFilter: 'blur(8px)' }} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
                    {/* Header / Hero Section */}
                    <div style={{ background: getStatusGradient(), padding: '2.5rem 2.5rem', position: 'relative', color: 'white' }}>
                        <button type="button" className="btn-close btn-close-white" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.8 }} onClick={onClose} aria-label="Close"></button>
                        
                        <div className="d-flex align-items-center gap-4">
                            <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', backdropFilter: 'blur(10px)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 8px 32px rgba(0,0,0,0.15)' }}>
                                <i className={`bi ${getStatusIcon()}`}></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.9, fontWeight: 700, marginBottom: '0.3rem' }}>{site.category}</div>
                                <h4 style={{ fontWeight: 800, fontSize: '1.8rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{site.name}</h4>
                                <div style={{ opacity: 0.95, fontSize: '1rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'white', boxShadow: '0 0 10px rgba(255,255,255,0.8)' }}></span>
                                    {getStatusText()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-body p-0" style={{ background: '#f8fafc' }}>
                        <div className="row g-0">
                            {/* Left Column - Main Info */}
                            <div className="col-md-8 p-4 border-end" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <h6 style={{ color: 'var(--ink-faint)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem' }}>Informasi Utama</h6>
                                
                                <div className="mb-4">
                                    <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>URL Situs Utama</label>
                                    <div style={{ background: 'white', padding: '1rem 1.2rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                        <a href={site.url.startsWith('http') ? site.url : `https://${site.url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-1)', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <i className="bi bi-globe2"></i> {site.url} <i className="bi bi-box-arrow-up-right ms-auto" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}></i>
                                        </a>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-sm-6">
                                        <div style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', height: '100%' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                                                <i className="bi bi-activity" style={{ color: 'var(--teal-1)', fontSize: '1.1rem' }}></i> Uptime 30 Hari
                                            </div>
                                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink-dark)', lineHeight: 1 }}>{site.uptime || 0}<span style={{ fontSize: '1.2rem', color: 'var(--ink-soft)', fontWeight: 600, marginLeft: '2px' }}>%</span></div>
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', height: '100%' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                                                <i className="bi bi-stopwatch" style={{ color: 'var(--blue-1)', fontSize: '1.1rem' }}></i> Interval Pengecekan
                                            </div>
                                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink-dark)', lineHeight: 1 }}>{site.check_interval} <span style={{ fontSize: '1rem', color: 'var(--ink-soft)', fontWeight: 600 }}>Menit</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Sitemap / Crawler Base URL</label>
                                    <div style={{ background: 'white', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)', color: 'var(--ink-dark)', fontSize: '0.95rem' }}>
                                        {site.sitemap_url ? (
                                            <><i className="bi bi-diagram-3 text-muted me-2"></i>{site.sitemap_url}</>
                                        ) : (
                                            <span style={{ color: 'var(--ink-faint)' }}><i className="bi bi-robot me-2"></i>Crawler Otomatis (Tidak ada sitemap)</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Contact & Meta */}
                            <div className="col-md-4 p-4 d-flex flex-column" style={{ background: 'rgba(255,255,255,0.6)' }}>
                                <h6 style={{ color: 'var(--ink-faint)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem' }}>Penanggung Jawab</h6>
                                
                                <div style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#64748b', marginBottom: '1rem' }}>
                                        <i className="bi bi-person-badge-fill"></i>
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink-dark)', marginBottom: '0.2rem' }}>
                                        {site.pic_name || 'Tidak ada PIC'}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <i className="bi bi-telephone-fill" style={{ color: 'var(--ink-faint)' }}></i> {site.pic_contact || '-'}
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <hr style={{ borderColor: 'rgba(0,0,0,0.05)', margin: '1.5rem 0' }} />
                                    <div className="d-grid">
                                        <button type="button" className="btn btn-light" style={{ borderRadius: '12px', fontWeight: 600, padding: '0.7rem' }} onClick={onClose}>
                                            Tutup Modal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
