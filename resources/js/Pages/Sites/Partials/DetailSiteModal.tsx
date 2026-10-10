import React from 'react';
import BaseModal from '@/Components/BaseModal';

export default function DetailSiteModal({ show, onClose, site }: { show: boolean; onClose: () => void; site: any }) {
    if (!show || !site) return null;

    const isUp = site.status === 'up' || !site.status;
    const isDown = site.status === 'down';
    const isWarn = site.status === 'warn';
    const isPaused = site.status === 'paused';

    const getStatusGradient = () => {
        if (isDown) return 'linear-gradient(135deg, #ef4444, #991b1b)';
        if (isWarn) return 'linear-gradient(135deg, #f59e0b, #b45309)';
        if (isPaused) return 'linear-gradient(135deg, #64748b, #334155)';
        return 'linear-gradient(135deg, #0ea5a3, #0f2a3f)';
    };

    const getStatusIcon = () => {
        if (isDown) return 'bi bi-x-circle-fill';
        if (isWarn) return 'bi bi-exclamation-triangle-fill';
        if (isPaused) return 'bi bi-pause-circle-fill';
        return 'bi bi-check-circle-fill';
    };

    const getStatusText = () => {
        if (isDown) return 'Situs Mengalami Gangguan (Offline)';
        if (isWarn) return 'Merespon Lambat (High Load / Warn)';
        if (isPaused) return 'Pemantauan Dijeda (Nonaktif)';
        return 'Situs Berjalan Normal & Sehat';
    };

    const modalFooter = (
        <div className="w-100 d-flex justify-content-end">
            <button 
                type="button" 
                className="btn btn-light px-4" 
                style={{ borderRadius: '12px', fontWeight: 600, color: '#64748b' }} 
                onClick={onClose}
            >
                Tutup
            </button>
        </div>
    );

    return (
        <BaseModal
            show={show}
            onClose={onClose}
            title={site.name}
            subtitle={
                <span className="d-flex align-items-center gap-2 mt-1">
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff' }}></span>
                    <span>{getStatusText()} — {site.category}</span>
                </span>
            }
            icon={getStatusIcon()}
            headerGradient={getStatusGradient()}
            size="lg"
            maxWidth="880px"
            bodyClassName="p-0"
            footer={modalFooter}
        >
            <div className="row g-0">
                {/* Left Column - Main Info */}
                <div className="col-md-8 p-4 border-end" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                    <h6 style={{ color: 'var(--ink-faint)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem' }}>Informasi Utama</h6>
                    
                    <div className="mb-4">
                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>URL Situs Utama</label>
                        <div style={{ background: 'white', padding: '0.85rem 1.1rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <a href={site.url.startsWith('http') ? site.url : `https://${site.url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-1)', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="bi bi-globe2"></i> {site.url} <i className="bi bi-box-arrow-up-right ms-auto" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}></i>
                            </a>
                        </div>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-sm-4">
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', height: '100%' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                                    <i className="bi bi-activity" style={{ color: 'var(--teal-1)', fontSize: '1rem' }}></i> Uptime 30 Hari
                                </div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-dark)', lineHeight: 1 }}>{site.uptime || 0}<span style={{ fontSize: '1rem', color: 'var(--ink-soft)', fontWeight: 600, marginLeft: '2px' }}>%</span></div>
                            </div>
                        </div>
                        <div className="col-sm-4">
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', height: '100%' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                                    <i className="bi bi-speedometer2" style={{ color: site.is_high_load ? '#ef4444' : 'var(--teal-1)', fontSize: '1rem' }}></i> Beban Trafik
                                </div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: site.is_high_load ? '#dc2626' : 'var(--ink-dark)', lineHeight: 1 }}>
                                    {site.requests_formatted || '250 req/m'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: site.is_high_load ? '#ef4444' : 'var(--ink-faint)', marginTop: '0.2rem', fontWeight: 600 }}>
                                    {site.is_high_load ? '🔥 Surge / Padat' : '🟢 Normal Traffic'}
                                </div>
                            </div>
                        </div>
                        <div className="col-sm-4">
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', height: '100%' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                                    <i className="bi bi-stopwatch" style={{ color: 'var(--blue-1)', fontSize: '1rem' }}></i> Interval Cek
                                </div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-dark)', lineHeight: 1 }}>{site.check_interval} <span style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', fontWeight: 600 }}>Mnt</span></div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Sitemap / Crawler Base URL</label>
                        <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', color: 'var(--ink-dark)', fontSize: '0.9rem' }}>
                            {site.sitemap_url ? (
                                <><i className="bi bi-diagram-3 text-muted me-2"></i>{site.sitemap_url}</>
                            ) : (
                                <span style={{ color: 'var(--ink-faint)' }}><i className="bi bi-robot me-2"></i>Crawler Otomatis (Tidak ada sitemap)</span>
                            )}
                        </div>
                    </div>

                    <div className="mt-3">
                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Audit File Server (SSH)</label>
                        <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', color: 'var(--ink-dark)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {site.ssh_host ? (
                                <>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
                                    <span>Terkonfigurasi via <code>{site.ssh_username}@{site.ssh_host}:{site.ssh_port}</code></span>
                                </>
                            ) : (
                                <>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1', display: 'inline-block' }}></span>
                                    <span style={{ color: 'var(--ink-faint)' }}>Koneksi SSH Belum Dikonfigurasi</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Contact & Meta */}
                <div className="col-md-4 p-4 d-flex flex-column" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <h6 style={{ color: 'var(--ink-faint)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem' }}>Penanggung Jawab</h6>
                    
                    <div style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', color: '#64748b', marginBottom: '0.8rem' }}>
                            <i className="bi bi-person-badge-fill"></i>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink-dark)', marginBottom: '0.2rem' }}>
                            {site.pic_name || 'Tidak ada PIC'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                            <i className="bi bi-telephone-fill" style={{ color: 'var(--ink-faint)' }}></i> {site.pic_contact || '-'}
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}
