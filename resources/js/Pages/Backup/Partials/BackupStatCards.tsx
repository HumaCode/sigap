import React from 'react';

interface BackupStatCardsProps {
    stats: {
        total_backups: number;
        total_size_formatted: string;
        protected_sites_count: number;
        latest_backup_time: string;
    };
}

export default function BackupStatCards({ stats }: BackupStatCardsProps) {
    return (
        <div className="row g-3 mb-4">
            {/* Total Backups Card */}
            <div className="col-12 col-sm-6 col-xl-3">
                <div 
                    className="p-3.5 rounded-4 d-flex align-items-center gap-3 transition-all"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,253,250,0.9))',
                        border: '1px solid rgba(14,165,163,0.18)',
                        boxShadow: '0 4px 16px rgba(14,165,163,0.06)',
                    }}
                >
                    <div 
                        className="d-flex align-items-center justify-content-center rounded-3 text-white"
                        style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)',
                            fontSize: '1.35rem',
                            flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(14,165,163,0.25)',
                        }}
                    >
                        <i className="bi bi-archive-fill"></i>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Total Cadangan
                        </span>
                        <h4 style={{ fontWeight: 800, margin: 0, color: '#0f2a3f', fontSize: '1.45rem', lineHeight: 1.2 }}>
                            {stats.total_backups}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#0ea5a3', fontWeight: 600 }}>
                            Arsip tersimpan
                        </span>
                    </div>
                </div>
            </div>

            {/* Total Storage Size Card */}
            <div className="col-12 col-sm-6 col-xl-3">
                <div 
                    className="p-3.5 rounded-4 d-flex align-items-center gap-3 transition-all"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(238,242,255,0.9))',
                        border: '1px solid rgba(79,70,229,0.18)',
                        boxShadow: '0 4px 16px rgba(79,70,229,0.06)',
                    }}
                >
                    <div 
                        className="d-flex align-items-center justify-content-center rounded-3 text-white"
                        style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #4f46e5, #312e81)',
                            fontSize: '1.35rem',
                            flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(79,70,229,0.25)',
                        }}
                    >
                        <i className="bi bi-hdd-fill"></i>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Kapasitas Arsip
                        </span>
                        <h4 style={{ fontWeight: 800, margin: 0, color: '#1e1b4b', fontSize: '1.45rem', lineHeight: 1.2 }}>
                            {stats.total_size_formatted}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600 }}>
                            Total kompresi .tar.gz
                        </span>
                    </div>
                </div>
            </div>

            {/* Protected Sites Card */}
            <div className="col-12 col-sm-6 col-xl-3">
                <div 
                    className="p-3.5 rounded-4 d-flex align-items-center gap-3 transition-all"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,253,244,0.9))',
                        border: '1px solid rgba(16,185,129,0.18)',
                        boxShadow: '0 4px 16px rgba(16,185,129,0.06)',
                    }}
                >
                    <div 
                        className="d-flex align-items-center justify-content-center rounded-3 text-white"
                        style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #10b981, #065f46)',
                            fontSize: '1.35rem',
                            flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(16,185,129,0.25)',
                        }}
                    >
                        <i className="bi bi-shield-fill-check"></i>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Situs Terlindungi
                        </span>
                        <h4 style={{ fontWeight: 800, margin: 0, color: '#064e3b', fontSize: '1.45rem', lineHeight: 1.2 }}>
                            {stats.protected_sites_count}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                            Memiliki backup aktif
                        </span>
                    </div>
                </div>
            </div>

            {/* Latest Backup Card */}
            <div className="col-12 col-sm-6 col-xl-3">
                <div 
                    className="p-3.5 rounded-4 d-flex align-items-center gap-3 transition-all"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(254,243,199,0.9))',
                        border: '1px solid rgba(245,158,11,0.22)',
                        boxShadow: '0 4px 16px rgba(245,158,11,0.06)',
                    }}
                >
                    <div 
                        className="d-flex align-items-center justify-content-center rounded-3 text-white"
                        style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #f59e0b, #92400e)',
                            fontSize: '1.35rem',
                            flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(245,158,11,0.25)',
                        }}
                    >
                        <i className="bi bi-clock-history"></i>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Backup Terakhir
                        </span>
                        <h4 style={{ fontWeight: 700, margin: 0, color: '#78350f', fontSize: '1.05rem', lineHeight: 1.3 }} className="text-truncate">
                            {stats.latest_backup_time}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>
                            Aktivitas paling baru
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
