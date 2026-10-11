import React from 'react';

interface NotificationStatCardsProps {
    stats: {
        total: number;
        unread: number;
        read: number;
        critical: number;
        warning: number;
    };
    activeStatus?: string;
    activeSeverity?: string;
    onFilterClick?: (type: 'status' | 'severity', val: string) => void;
}

export default function NotificationStatCards({
    stats,
    activeStatus = 'all',
    activeSeverity = 'all',
    onFilterClick,
}: NotificationStatCardsProps) {
    const isTotalActive = activeStatus === 'all' && activeSeverity === 'all';
    const isUnreadActive = activeStatus === 'unread';
    const isCriticalActive = activeSeverity === 'critical';
    const isWarningActive = activeSeverity === 'warning';

    return (
        <div className="row g-3 mb-4">
            {/* Total Notifikasi */}
            <div className="col-6 col-md-3">
                <div
                    className={`glass-card p-3 cursor-pointer notif-stat-card ${isTotalActive ? 'active-card-total' : ''}`}
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: onFilterClick ? 'pointer' : 'default',
                        border: isTotalActive ? '1.5px solid var(--teal-1)' : '1px solid var(--line)',
                    }}
                    onClick={() => onFilterClick && onFilterClick('status', 'all')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: isTotalActive ? 'rgba(14,165,163,0.08)' : 'rgba(14,165,163,0.04)', zIndex: 0, transform: 'rotate(-10deg)', transition: 'all 0.2s ease' }}>
                        <i className="bi bi-bell-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--teal-1)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Total Notifikasi
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--teal-1)', lineHeight: '1.2', marginTop: '0.2rem' }}>
                                {stats.total}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                                {stats.read} Telah Dibaca
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isTotalActive ? 'rgba(14,165,163,0.22)' : 'rgba(14,165,163,0.12)', color: 'var(--teal-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(14,165,163,0.1)' }}>
                            <i className="bi bi-bell"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Belum Dibaca */}
            <div className="col-6 col-md-3">
                <div
                    className={`glass-card p-3 cursor-pointer notif-stat-card ${isUnreadActive ? 'active-card-unread' : ''}`}
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: onFilterClick ? 'pointer' : 'default',
                        border: isUnreadActive ? '1.5px solid #0284c7' : '1px solid var(--line)',
                    }}
                    onClick={() => onFilterClick && onFilterClick('status', 'unread')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: isUnreadActive ? 'rgba(2,132,199,0.08)' : 'rgba(2,132,199,0.04)', zIndex: 0, transform: 'rotate(-10deg)', transition: 'all 0.2s ease' }}>
                        <i className="bi bi-envelope-open-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: '#0284c7', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Belum Dibaca
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#0284c7', lineHeight: '1.2', marginTop: '0.2rem' }}>
                                {stats.unread}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                                Memerlukan Atensi
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isUnreadActive ? 'rgba(2,132,199,0.22)' : 'rgba(2,132,199,0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(2,132,199,0.1)' }}>
                            <i className="bi bi-inbox-fill"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ancaman Kritis */}
            <div className="col-6 col-md-3">
                <div
                    className={`glass-card p-3 cursor-pointer notif-stat-card ${isCriticalActive ? 'active-card-critical' : ''}`}
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: onFilterClick ? 'pointer' : 'default',
                        border: isCriticalActive ? '1.5px solid #ef4444' : '1px solid var(--line)',
                    }}
                    onClick={() => onFilterClick && onFilterClick('severity', 'critical')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: isCriticalActive ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)', zIndex: 0, transform: 'rotate(-10deg)', transition: 'all 0.2s ease' }}>
                        <i className="bi bi-shield-slash-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Ancaman Kritis
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#ef4444', lineHeight: '1.2', marginTop: '0.2rem' }}>
                                {stats.critical}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                                Risiko Tinggi & Downtime
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isCriticalActive ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(239,68,68,0.1)' }}>
                            <i className="bi bi-lightning-charge-fill"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Peringatan Sistem */}
            <div className="col-6 col-md-3">
                <div
                    className={`glass-card p-3 cursor-pointer notif-stat-card ${isWarningActive ? 'active-card-warning' : ''}`}
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: onFilterClick ? 'pointer' : 'default',
                        border: isWarningActive ? '1.5px solid #d97706' : '1px solid var(--line)',
                    }}
                    onClick={() => onFilterClick && onFilterClick('severity', 'warning')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: isWarningActive ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.04)', zIndex: 0, transform: 'rotate(-10deg)', transition: 'all 0.2s ease' }}>
                        <i className="bi bi-shield-exclamation"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: '#d97706', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Peringatan Sistem
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#d97706', lineHeight: '1.2', marginTop: '0.2rem' }}>
                                {stats.warning}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                                SSL & Latency Alert
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isWarningActive ? 'rgba(245,158,11,0.22)' : 'rgba(245,158,11,0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(245,158,11,0.1)' }}>
                            <i className="bi bi-exclamation-triangle-fill"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
