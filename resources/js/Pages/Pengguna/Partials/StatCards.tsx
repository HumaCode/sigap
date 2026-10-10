import React from 'react';

interface StatCardsProps {
    stats: {
        total: number;
        active: number;
        inactive: number;
        dev: number;
        admin: number;
        user: number;
    };
    onFilterRole?: (role: string) => void;
}

export default function StatCards({ stats, onFilterRole }: StatCardsProps) {
    return (
        <div className="row g-3 mb-4">
            {/* Total Pengguna */}
            <div className="col-6 col-md-3">
                <div 
                    className="glass-card p-3 cursor-pointer" 
                    style={{ position: 'relative', overflow: 'hidden', cursor: onFilterRole ? 'pointer' : 'default' }}
                    onClick={() => onFilterRole && onFilterRole('all')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(14,165,163,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}>
                        <i className="bi bi-people-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: 'var(--teal-1)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Total Pengguna
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--teal-1)', lineHeight: '1.2', marginTop: '0.2rem' }}>
                                {stats.total}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                                {stats.active} Akun Aktif
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(14,165,163,0.12)', color: 'var(--teal-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(14,165,163,0.1)' }}>
                            <i className="bi bi-people"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Developer / Super Admin */}
            <div className="col-6 col-md-3">
                <div 
                    className="glass-card p-3 cursor-pointer" 
                    style={{ position: 'relative', overflow: 'hidden', cursor: onFilterRole ? 'pointer' : 'default' }}
                    onClick={() => onFilterRole && onFilterRole('dev')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(139,92,246,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}>
                        <i className="bi bi-code-slash"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: '#7c3aed', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Developer
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#7c3aed', lineHeight: '1.2', marginTop: '0.2rem' }}>
                                {stats.dev}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                                Super Administrator
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(139,92,246,0.12)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(139,92,246,0.1)' }}>
                            <i className="bi bi-shield-shaded"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Administrator OPD */}
            <div className="col-6 col-md-3">
                <div 
                    className="glass-card p-3 cursor-pointer" 
                    style={{ position: 'relative', overflow: 'hidden', cursor: onFilterRole ? 'pointer' : 'default' }}
                    onClick={() => onFilterRole && onFilterRole('admin')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(245,158,11,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}>
                        <i className="bi bi-person-badge-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: '#d97706', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Administrator
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#d97706', lineHeight: '1.2', marginTop: '0.2rem' }}>
                                {stats.admin}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                                Pengelola OPD
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245,158,11,0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(245,158,11,0.1)' }}>
                            <i className="bi bi-person-gear"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pengguna / Viewer */}
            <div className="col-6 col-md-3">
                <div 
                    className="glass-card p-3 cursor-pointer" 
                    style={{ position: 'relative', overflow: 'hidden', cursor: onFilterRole ? 'pointer' : 'default' }}
                    onClick={() => onFilterRole && onFilterRole('user')}
                >
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(2,132,199,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}>
                        <i className="bi bi-person-check-fill"></i>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ color: '#0284c7', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Pengguna
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#0284c7', lineHeight: '1.2', marginTop: '0.2rem' }}>
                                {stats.user}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                                Viewer & Operator
                            </div>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(2,132,199,0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(2,132,199,0.1)' }}>
                            <i className="bi bi-person-check"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
