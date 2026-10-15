import React from 'react';

interface ScorecardPodiumProps {
    podium: any[];
    onSelectSite: (site: any) => void;
}

export default function ScorecardPodium({ podium, onSelectSite }: ScorecardPodiumProps) {
    if (!podium || podium.length === 0) return null;

    const medals = [
        {
            rank: 1,
            label: 'Juara 1 — Teladan Utama SPBE',
            badgeBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            cardBg: 'linear-gradient(135deg, rgba(254, 243, 199, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            icon: 'bi-trophy-fill',
            color: '#b45309'
        },
        {
            rank: 2,
            label: 'Juara 2 — Kepatuhan Tinggi',
            badgeBg: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
            cardBg: 'linear-gradient(135deg, rgba(241, 245, 249, 0.5) 0%, rgba(255, 255, 255, 0.95) 100%)',
            borderColor: 'rgba(148, 163, 184, 0.4)',
            icon: 'bi-award-fill',
            color: '#475569'
        },
        {
            rank: 3,
            label: 'Juara 3 — Layanan Prima',
            badgeBg: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
            cardBg: 'linear-gradient(135deg, rgba(254, 215, 170, 0.3) 0%, rgba(255, 255, 255, 0.95) 100%)',
            borderColor: 'rgba(217, 119, 6, 0.35)',
            icon: 'bi-patch-check-fill',
            color: '#9a3412'
        }
    ];

    return (
        <div className="glass-card p-4 mb-4" style={{ borderRadius: '20px', border: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3.5">
                <div>
                    <h5 className="mb-0" style={{ fontWeight: 800, color: '#0f2a3f', fontSize: '1.15rem' }}>
                        <i className="bi bi-stars text-warning me-2"></i>
                        Top 3 Peringkat Kepatuhan & Mutu Digital Daerah
                    </h5>
                    <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                        Website OPD dengan nilai indeks gabungan tertinggi berdasarkan ketersediaan 30 hari, kepatuhan keamanan informasi, dan mitigasi insiden.
                    </span>
                </div>
            </div>

            <div className="row g-3">
                {podium.map((site, idx) => {
                    const medal = medals[idx] || medals[2];
                    return (
                        <div key={site.id} className="col-12 col-md-4">
                            <div 
                                className="h-100 p-3.5 position-relative overflow-hidden cursor-pointer"
                                onClick={() => onSelectSite(site)}
                                style={{
                                    borderRadius: '16px',
                                    background: medal.cardBg,
                                    border: `1.5px solid ${medal.borderColor}`,
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.03)',
                                    transition: 'all 0.25s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.03)';
                                }}
                            >
                                <div className="d-flex align-items-center justify-content-between mb-2.5">
                                    <span 
                                        className="badge text-white d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                                        style={{ background: medal.badgeBg, borderRadius: '8px', fontSize: '0.74rem', fontWeight: 700 }}
                                    >
                                        <i className={`bi ${medal.icon}`}></i>
                                        Peringkat #{medal.rank}
                                    </span>

                                    <span 
                                        className="badge" 
                                        style={{ 
                                            background: '#ffffff', 
                                            color: site.grade_color, 
                                            border: `1.5px solid ${site.grade_color}`,
                                            fontWeight: 800,
                                            fontSize: '0.85rem',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        Grade {site.grade}
                                    </span>
                                </div>

                                <h6 className="mb-1 text-truncate" style={{ fontWeight: 700, color: '#0f2a3f', fontSize: '0.98rem' }} title={site.name}>
                                    {site.name}
                                </h6>
                                <p className="mb-2 text-truncate" style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
                                    {site.url}
                                </p>

                                <div className="d-flex align-items-baseline gap-2 mb-2">
                                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: medal.color, lineHeight: 1 }}>
                                        {site.total_score}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
                                        / 100 Poin Indeks
                                    </span>
                                </div>

                                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light" style={{ fontSize: '0.76rem', color: 'var(--ink-soft)' }}>
                                    <span>Uptime: <strong>{site.breakdown.uptime.raw_value}</strong></span>
                                    <span className="text-primary fw-semibold">
                                        Lihat Evaluasi <i className="bi bi-chevron-right ms-0.5"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
