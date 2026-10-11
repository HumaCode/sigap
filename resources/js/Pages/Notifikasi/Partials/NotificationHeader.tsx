import React from 'react';

interface NotificationHeaderProps {
    total: number;
    unread: number;
    onMarkAllRead: () => void;
    onClearAll: () => void;
    isProcessing?: boolean;
}

export default function NotificationHeader({
    total,
    unread,
    onMarkAllRead,
    onClearAll,
    isProcessing = false,
}: NotificationHeaderProps) {
    return (
        <div className="notif-page-header mb-4">
            <div className="d-flex align-items-center gap-3">
                <div className="notif-icon-badge">
                    <i className="bi bi-bell-fill" style={{ fontSize: '1.35rem' }}></i>
                </div>
                <div>
                    <div className="page-title mb-0" style={{ lineHeight: 1.2 }}>Pusat Notifikasi & Alert</div>
                    <p className="page-sub mb-0 mt-1" style={{ margin: 0 }}>
                        Peringatan dini insiden keamanan, status ketersediaan situs, serta log notifikasi sistem SIGAP — {unread > 0 ? `${unread} belum dibaca` : 'Semua telah dibaca'}.
                    </p>
                </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
                {unread > 0 && (
                    <button
                        onClick={onMarkAllRead}
                        disabled={isProcessing}
                        className="btn shadow-sm d-flex align-items-center gap-1.5"
                        style={{
                            background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '0.52rem 1.05rem',
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <i className="bi bi-check2-all" style={{ fontSize: '1rem' }}></i>
                        <span>Tandai Semua Dibaca</span>
                    </button>
                )}

                {total > 0 && (
                    <button
                        onClick={onClearAll}
                        disabled={isProcessing}
                        className="btn shadow-sm d-flex align-items-center gap-1.5"
                        style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#dc2626',
                            border: '1.5px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: '12px',
                            padding: '0.52rem 1.05rem',
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <i className="bi bi-trash3" style={{ fontSize: '0.9rem' }}></i>
                        <span>Bersihkan Riwayat</span>
                    </button>
                )}
            </div>
        </div>
    );
}
