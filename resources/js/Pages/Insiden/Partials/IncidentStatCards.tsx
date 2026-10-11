import React from 'react';

export interface IncidentStats {
    total: number;
    critical: number;
    resolved: number;
    open: number;
    investigating?: number;
    active?: number;
}

interface IncidentStatCardsProps {
    stats: IncidentStats;
    activeFilter?: string;
    onFilterClick?: (status: string) => void;
}

export default function IncidentStatCards({
    stats,
    activeFilter = 'all',
    onFilterClick,
}: IncidentStatCardsProps) {
    const cards = [
        {
            key: 'open',
            title: 'Terbuka',
            subtitle: 'Belum Ditangani',
            value: stats.open,
            color: '#ef4444',
            bgIcon: 'rgba(239, 68, 68, 0.04)',
            iconBg: 'rgba(239, 68, 68, 0.12)',
            icon: 'bi-exclamation-octagon',
            bgIconClass: 'bi-exclamation-octagon-fill',
        },
        {
            key: 'critical',
            title: 'Kritis',
            subtitle: 'Risiko Tinggi',
            value: stats.critical,
            color: '#c8332a',
            bgIcon: 'rgba(200, 51, 42, 0.04)',
            iconBg: 'rgba(200, 51, 42, 0.12)',
            icon: 'bi-lightning-charge',
            bgIconClass: 'bi-lightning-charge-fill',
        },
        {
            key: 'investigating',
            title: 'Ditinjau',
            subtitle: 'Dalam Proses Analisis',
            value: stats.investigating ?? (stats.total - stats.resolved - stats.open),
            color: '#d97706',
            bgIcon: 'rgba(217, 119, 6, 0.04)',
            iconBg: 'rgba(217, 119, 6, 0.12)',
            icon: 'bi-hourglass-split',
            bgIconClass: 'bi-hourglass-split',
        },
        {
            key: 'resolved',
            title: 'Selesai',
            subtitle: 'Mitigasi Berhasil',
            value: stats.resolved,
            color: '#0ea5a3',
            bgIcon: 'rgba(14, 165, 163, 0.04)',
            iconBg: 'rgba(14, 165, 163, 0.12)',
            icon: 'bi-check2-circle',
            bgIconClass: 'bi-check2-circle',
        },
    ];

    return (
        <div className="row g-3 mb-4">
            <style>{`
                .incident-stat-card {
                    background: #ffffff;
                    border: 1px solid rgba(15, 42, 63, 0.08);
                    border-radius: 18px;
                    padding: 1.15rem 1.25rem;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 18px -4px rgba(15, 42, 63, 0.06);
                    transition: all 0.22s ease-in-out;
                    cursor: pointer;
                }
                .incident-stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 24px -4px rgba(15, 42, 63, 0.12);
                    border-color: rgba(14, 165, 163, 0.35);
                }
                .incident-stat-card.active-card {
                    border-width: 2px;
                    box-shadow: 0 6px 20px -2px rgba(14, 165, 163, 0.2);
                }
                .incident-watermark-icon {
                    position: absolute;
                    right: -12px;
                    bottom: -22px;
                    font-size: 5.5rem;
                    line-height: 1;
                    z-index: 0;
                    transform: rotate(-10deg);
                    pointer-events: none;
                    transition: transform 0.3s ease;
                }
                .incident-stat-card:hover .incident-watermark-icon {
                    transform: rotate(-5deg) scale(1.08);
                }
            `}</style>

            {cards.map((card) => {
                const isActive = activeFilter === card.key;
                return (
                    <div key={card.key} className="col-6 col-md-3">
                        <div
                            className={`incident-stat-card ${isActive ? 'active-card' : ''}`}
                            style={{
                                borderColor: isActive ? card.color : undefined,
                            }}
                            onClick={() => onFilterClick && onFilterClick(card.key)}
                            title={`Filter menurut status ${card.title}`}
                        >
                            <div
                                className="incident-watermark-icon"
                                style={{ color: card.bgIcon }}
                            >
                                <i className={`bi ${card.bgIconClass}`}></i>
                            </div>

                            <div className="position-relative" style={{ zIndex: 1 }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <div
                                            style={{
                                                color: card.color,
                                                fontSize: '0.76rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.6px',
                                            }}
                                        >
                                            {card.title}
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 800,
                                                fontSize: '1.85rem',
                                                color: card.color,
                                                lineHeight: 1.15,
                                                marginTop: '0.2rem',
                                            }}
                                        >
                                            {card.value}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '12px',
                                            background: card.iconBg,
                                            color: card.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem',
                                        }}
                                    >
                                        <i className={`bi ${card.icon}`}></i>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
                                    {card.subtitle}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
