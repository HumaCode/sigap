import React from 'react';

interface SiteStatCardsProps {
    stats: {
        total?: number;
        up?: number;
        down?: number;
        paused?: number;
    };
    onFilter?: (filter: string) => void;
}

export default function SiteStatCards({ stats, onFilter }: SiteStatCardsProps) {
    return (
        <div className="row g-3 mb-4">
            {/* Total Situs */}
            <div className="col-6 col-md-3">
                <div 
                    className="glass-card p-3" 
                    style={{ position: 'relative', overflow: 'hidden', cursor: onFilter ? 'pointer' : 'default' }}
                    onClick={() => onFilter && onFilter('all')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(15,42,63,0.03)', zIndex: 0, transform: 'rotate(-10deg)' }}>
                        <i className="bi bi-hdd-network-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Situs</div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--ink)', lineHeight: '1.2', marginTop: '0.2rem' }}>{stats?.total || 0}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Semua Terdaftar</div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(15,42,63,0.06)', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                            <i className="bi bi-hdd-network"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Online */}
            <div className="col-6 col-md-3">
                <div 
                    className="glass-card p-3" 
                    style={{ position: 'relative', overflow: 'hidden', cursor: onFilter ? 'pointer' : 'default' }}
                    onClick={() => onFilter && onFilter('up')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(14,165,163,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}>
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--teal-1)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Online</div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--teal-1)', lineHeight: '1.2', marginTop: '0.2rem' }}>{stats?.up || 0}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Berjalan Normal</div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(14,165,163,0.12)', color: 'var(--teal-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(14,165,163,0.1)' }}>
                            <i className="bi bi-check-circle"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Down */}
            <div className="col-6 col-md-3">
                <div 
                    className="glass-card p-3" 
                    style={{ position: 'relative', overflow: 'hidden', cursor: onFilter ? 'pointer' : 'default' }}
                    onClick={() => onFilter && onFilter('down')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(239,68,68,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}>
                        <i className="bi bi-x-octagon-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Down</div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#ef4444', lineHeight: '1.2', marginTop: '0.2rem' }}>{stats?.down || 0}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Perlu Perhatian</div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(239,68,68,0.1)' }}>
                            <i className="bi bi-x-octagon"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nonaktif / Paused */}
            <div className="col-6 col-md-3">
                <div 
                    className="glass-card p-3" 
                    style={{ position: 'relative', overflow: 'hidden', cursor: onFilter ? 'pointer' : 'default' }}
                    onClick={() => onFilter && onFilter('paused')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(124,147,163,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}>
                        <i className="bi bi-pause-circle-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--ink-faint)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nonaktif</div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--ink-soft)', lineHeight: '1.2', marginTop: '0.2rem' }}>{stats?.paused || 0}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Pantauan Berhenti</div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(124,147,163,0.12)', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(124,147,163,0.05)' }}>
                            <i className="bi bi-pause-circle"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
