import React from 'react';
import { createPortal } from 'react-dom';

interface ScorecardDetailModalProps {
    show: boolean;
    onClose: () => void;
    site: any;
}

export default function ScorecardDetailModal({ show, onClose, site }: ScorecardDetailModalProps) {
    if (!show || !site || typeof document === 'undefined') return null;

    const { breakdown } = site;

    return createPortal(
        <div 
            className="custom-modal-overlay show"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            style={{ zIndex: 1060 }}
        >
            <div 
                className="custom-modal-content p-4"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '680px', borderRadius: '20px', background: '#ffffff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
            >
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
                    <div className="d-flex align-items-center gap-3">
                        <div 
                            style={{ 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '14px', 
                                background: site.grade === 'A+' ? '#fef3c7' : '#e0f2fe',
                                color: site.grade_color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.4rem',
                                fontWeight: 800,
                                border: `2px solid ${site.grade_color}`
                            }}
                        >
                            {site.grade}
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h5 className="mb-0 fw-bold" style={{ color: '#0f2a3f' }}>{site.name}</h5>
                                <span className="badge bg-light text-secondary border">#{site.rank} Daerah</span>
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>{site.url} &bull; {site.category}</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={onClose} 
                        title="Tutup Modal"
                    />
                </div>

                {/* Score Summary Box */}
                <div 
                    className="p-3.5 mb-3.5 rounded-3 d-flex align-items-center justify-content-between"
                    style={{ background: 'linear-gradient(135deg, rgba(14, 165, 163, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)', border: '1.5px solid rgba(14, 165, 163, 0.2)' }}
                >
                    <div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                            Total Indeks Kematangan
                        </span>
                        <div className="d-flex align-items-baseline gap-2 mt-0.5">
                            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0f2a3f', lineHeight: 1 }}>
                                {site.total_score}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--ink-faint)', fontWeight: 600 }}>/ 100 Poin</span>
                        </div>
                    </div>
                    <div className="text-end">
                        <span 
                            className="badge px-3 py-1.5"
                            style={{ 
                                background: '#ffffff', 
                                color: site.grade_color, 
                                border: `1.5px solid ${site.grade_color}`, 
                                fontWeight: 800, 
                                fontSize: '0.9rem' 
                            }}
                        >
                            Grade {site.grade}
                        </span>
                        <div className="mt-1" style={{ fontSize: '0.74rem', color: 'var(--ink-soft)', fontWeight: 600 }}>
                            {site.grade_label}
                        </div>
                    </div>
                </div>

                {/* 3 Pillar Calculation Formula Transparency */}
                <h6 className="fw-bold mb-2.5" style={{ color: '#0f2a3f', fontSize: '0.9rem' }}>
                    <i className="bi bi-calculator me-1.5 text-primary"></i>
                    Transparansi Formula Penilaian (3 Pilar Utama Mutu & Keamanan)
                </h6>

                <div className="d-flex flex-column gap-2.5 mb-4">
                    {/* Pilar 1 */}
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-activity text-teal" style={{ color: 'var(--teal-1)', fontSize: '1rem' }}></i>
                                <strong style={{ fontSize: '0.86rem', color: '#0f2a3f' }}>1. Ketersediaan Uptime 30 Hari (Bobot 40%)</strong>
                            </div>
                            <span className="fw-bold" style={{ color: 'var(--teal-1)', fontSize: '0.9rem' }}>
                                +{breakdown.uptime.score} Poin
                            </span>
                        </div>
                        <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.78rem' }}>
                            <span>Realisasi Uptime Aktual: <strong>{breakdown.uptime.raw_value}</strong></span>
                            <span>Maksimal 40 Poin</span>
                        </div>
                    </div>

                    {/* Pilar 2 */}
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-shield-lock text-primary" style={{ fontSize: '1rem' }}></i>
                                <strong style={{ fontSize: '0.86rem', color: '#0f2a3f' }}>2. Kepatuhan SSL & Postur Port Server (Bobot 30%)</strong>
                            </div>
                            <span className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                                +{breakdown.security.score} Poin
                            </span>
                        </div>
                        <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.78rem' }}>
                            <span>Masa Berlaku SSL: <strong>{breakdown.security.raw_ssl}</strong> &bull; Port Terbuka: <strong>{breakdown.security.raw_ports}</strong></span>
                            <span>Maksimal 30 Poin</span>
                        </div>
                    </div>

                    {/* Pilar 3 */}
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-shield-exclamation text-warning" style={{ fontSize: '1rem' }}></i>
                                <strong style={{ fontSize: '0.86rem', color: '#0f2a3f' }}>3. Riwayat Bebas Insiden Siber 30 Hari (Bobot 30%)</strong>
                            </div>
                            <span className="fw-bold text-warning" style={{ fontSize: '0.9rem' }}>
                                +{breakdown.incidents.score} Poin
                            </span>
                        </div>
                        <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.78rem' }}>
                            <span>Insiden Aktif: <strong>{breakdown.incidents.raw_active}</strong> (Kritis: {breakdown.incidents.raw_critical})</span>
                            <span>Maksimal 30 Poin</span>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="p-3 rounded-3 mb-4" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
                    <div className="d-flex align-items-center gap-2 mb-1 text-warning-emphasis">
                        <i className="bi bi-lightbulb-fill"></i>
                        <strong style={{ fontSize: '0.84rem' }}>Rekomendasi Peningkatan Mutu:</strong>
                    </div>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {site.recommendation}
                    </p>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex align-items-center justify-content-between pt-2">
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        PIC Terdaftar: <strong>{site.pic_name}</strong>
                    </span>
                    <button 
                        type="button" 
                        className="btn btn-secondary px-4" 
                        onClick={onClose}
                        style={{ borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600 }}
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
