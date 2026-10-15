import React from 'react';

interface SettingsHeaderProps {
    onClearCache?: () => void;
    isClearing?: boolean;
}

export default function SettingsHeader({ onClearCache, isClearing = false }: SettingsHeaderProps) {
    return (
        <div className="settings-page-header">
            <div className="d-flex align-items-center gap-3">
                <div className="settings-icon-badge">
                    <i className="bi bi-gear-fill" style={{ fontSize: '1.35rem' }}></i>
                </div>
                <div>
                    <div className="page-title mb-0" style={{ lineHeight: 1.2 }}>Pengaturan Sistem</div>
                    <div className="page-subtitle text-muted" style={{ fontSize: '0.85rem' }}>
                        Kelola integrasi 9Router AI Engine, optimasi SEO, log audit, dan preferensi platform SIGAP
                    </div>
                </div>
            </div>

            {onClearCache && (
                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        onClick={onClearCache}
                        disabled={isClearing}
                        className="btn d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm"
                        style={{
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '0.86rem',
                            border: '1.5px solid rgba(14, 165, 163, 0.35)',
                            background: '#ffffff',
                            color: 'var(--teal-1, #0ea5a3)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (!isClearing) {
                                e.currentTarget.style.background = 'rgba(14, 165, 163, 0.08)';
                                e.currentTarget.style.borderColor = 'var(--teal-1, #0ea5a3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isClearing) {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = 'rgba(14, 165, 163, 0.35)';
                            }
                        }}
                        title="Jalankan optimize:clear (hapus cache config, route, view, & aplikasi)"
                    >
                        {isClearing ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                                <span>Membersihkan Cache...</span>
                            </>
                        ) : (
                            <>
                                <i className="bi bi-arrow-repeat" style={{ fontSize: '1.05rem' }}></i>
                                <span>Bersihkan Cache Sistem</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
