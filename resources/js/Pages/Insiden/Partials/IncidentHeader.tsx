import React from 'react';

interface IncidentHeaderProps {
    activeCount: number;
    canResolveAll?: boolean;
    onMarkAllResolved: () => void;
}

export default function IncidentHeader({
    activeCount,
    canResolveAll = true,
    onMarkAllResolved,
}: IncidentHeaderProps) {
    return (
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <style>{`
                .incident-header-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #0ea5a3 0%, #0f2a3f 100%);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 18px rgba(14, 165, 163, 0.25);
                    flex-shrink: 0;
                    transition: transform 0.2s ease;
                }
                .incident-header-icon:hover {
                    transform: scale(1.04);
                }
                .btn-resolve-all {
                    border: 1px solid rgba(14, 165, 163, 0.3);
                    color: #0f2a3f;
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 0.55rem 1rem;
                    font-size: 0.82rem;
                    font-weight: 600;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    transition: all 0.2s ease;
                }
                .btn-resolve-all:hover {
                    background: #f0fdfa;
                    border-color: #0ea5a3;
                    color: #0ea5a3;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(14, 165, 163, 0.15);
                }
            `}</style>

            <div className="d-flex align-items-center gap-3">
                <div className="incident-header-icon">
                    <i className="bi bi-shield-exclamation" style={{ fontSize: '1.45rem' }}></i>
                </div>
                <div>
                    <h1 className="fw-bold m-0" style={{ fontSize: '1.4rem', color: '#0f2a3f', lineHeight: 1.2 }}>
                        Manajemen Insiden Keamanan
                    </h1>
                    <p className="text-muted m-0 mt-1" style={{ fontSize: '0.86rem' }}>
                        Linimasa & audit penanganan insiden situs terpantau —{' '}
                        <strong className="text-danger fw-semibold">{activeCount} insiden</strong> memerlukan penanganan.
                    </p>
                </div>
            </div>

            {canResolveAll && (
                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        className="btn btn-resolve-all d-flex align-items-center gap-1.5"
                        onClick={onMarkAllResolved}
                        title="Tandai Seluruh Insiden Aktif Sebagai Selesai"
                    >
                        <i className="bi bi-check2-all text-teal" style={{ color: '#0ea5a3', fontSize: '1.05rem' }}></i>
                        <span>Tandai Semua Selesai</span>
                    </button>
                </div>
            )}
        </div>
    );
}
