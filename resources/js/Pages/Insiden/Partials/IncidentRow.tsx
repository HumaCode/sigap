import React from 'react';

interface IncidentRowProps {
    incident: any;
    onOpenDetail: (incident: any) => void;
    onOpenAi: (e: React.MouseEvent, incident: any) => void;
}

export default function IncidentRow({
    incident,
    onOpenDetail,
    onOpenAi,
}: IncidentRowProps) {
    const getTypeVisual = (type: string) => {
        switch (type) {
            case 'defacement':
                return { icon: 'bi bi-pencil-square', bg: 'linear-gradient(135deg, #f59e0b, #f97316)' };
            case 'down':
            case 'uptime':
                return { icon: 'bi bi-hdd-network-fill', bg: 'linear-gradient(135deg, #ef4444, #dc2626)' };
            case 'keyword_found':
                return { icon: 'bi bi-bug', bg: 'linear-gradient(135deg, #f43f5e, #e11d48)' };
            case 'error':
                return { icon: 'bi bi-file-earmark-lock2', bg: 'linear-gradient(135deg, #8b5cf6, #6366f1)' };
            default:
                return { icon: 'bi bi-shield-exclamation', bg: 'linear-gradient(135deg, #0ea5a3, #0284c7)' };
        }
    };

    const renderSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical':
                return (
                    <span
                        className="badge-sev d-inline-flex align-items-center gap-1.5"
                        style={{
                            background: 'rgba(200, 51, 42, 0.12)',
                            color: '#c8332a',
                            border: '1px solid rgba(200, 51, 42, 0.28)',
                        }}
                    >
                        <span
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#c8332a',
                                boxShadow: '0 0 6px #c8332a',
                            }}
                        />
                        Kritis
                    </span>
                );
            case 'high':
                return (
                    <span
                        className="badge-sev"
                        style={{
                            background: 'rgba(255, 122, 110, 0.12)',
                            color: '#ff7a6e',
                            border: '1px solid rgba(255, 122, 110, 0.28)',
                        }}
                    >
                        Tinggi
                    </span>
                );
            case 'medium':
                return (
                    <span
                        className="badge-sev"
                        style={{
                            background: 'rgba(251, 191, 36, 0.12)',
                            color: '#d97706',
                            border: '1px solid rgba(251, 191, 36, 0.28)',
                        }}
                    >
                        Sedang
                    </span>
                );
            case 'low':
                return (
                    <span
                        className="badge-sev"
                        style={{
                            background: 'rgba(14, 165, 163, 0.12)',
                            color: '#0ea5a3',
                            border: '1px solid rgba(14, 165, 163, 0.28)',
                        }}
                    >
                        Rendah
                    </span>
                );
            default:
                return <span className="badge-sev">{severity}</span>;
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return (
                    <span
                        className="badge-status d-inline-flex align-items-center gap-1"
                        style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                        }}
                    >
                        <i className="bi bi-exclamation-circle"></i>
                        <span>Terbuka</span>
                    </span>
                );
            case 'investigating':
            case 'acknowledged':
                return (
                    <span
                        className="badge-status d-inline-flex align-items-center gap-1"
                        style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#d97706',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                        }}
                    >
                        <i className="bi bi-hourglass-split"></i>
                        <span>Ditinjau</span>
                    </span>
                );
            case 'resolved':
                return (
                    <span
                        className="badge-status d-inline-flex align-items-center gap-1"
                        style={{
                            background: 'rgba(14, 165, 163, 0.12)',
                            color: '#0ea5a3',
                            border: '1px solid rgba(14, 165, 163, 0.25)',
                        }}
                    >
                        <i className="bi bi-check2-circle"></i>
                        <span>Selesai</span>
                    </span>
                );
            case 'false_positive':
                return (
                    <span
                        className="badge-status d-inline-flex align-items-center gap-1"
                        style={{
                            background: 'rgba(100, 116, 139, 0.12)',
                            color: '#64748b',
                            border: '1px solid rgba(100, 116, 139, 0.25)',
                        }}
                    >
                        <i className="bi bi-shield-x"></i>
                        <span>Bukan Insiden</span>
                    </span>
                );
            default:
                return <span className="badge-status">{status}</span>;
        }
    };

    const { icon, bg } = getTypeVisual(incident.type);

    return (
        <div className="incident-item-row" onClick={() => onOpenDetail(incident)}>
            <style>{`
                .incident-item-row {
                    display: flex;
                    align-items: center;
                    gap: 1.15rem;
                    padding: 1.15rem 1.4rem;
                    border-bottom: 1px solid rgba(15, 42, 63, 0.06);
                    cursor: pointer;
                    transition: all 0.18s ease-in-out;
                    background: #ffffff;
                }
                .incident-item-row:hover {
                    background: #f0fdfa;
                }
                .incident-item-row:last-child {
                    border-bottom: none;
                }
                .incident-type-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 13px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.18rem;
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s ease;
                }
                .incident-item-row:hover .incident-type-avatar {
                    transform: scale(1.06);
                }
                .incident-item-title {
                    font-weight: 600;
                    font-size: 0.94rem;
                    color: #0f2a3f;
                    margin: 0 0 0.25rem;
                }
                .incident-item-desc {
                    font-size: 0.81rem;
                    color: #64748b;
                    margin: 0 0 0.45rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .incident-item-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    font-size: 0.76rem;
                    color: #94a3b8;
                }
                .badge-sev {
                    font-size: 0.72rem;
                    font-weight: 700;
                    padding: 0.24rem 0.65rem;
                    border-radius: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    white-space: nowrap;
                }
                .badge-status {
                    font-size: 0.74rem;
                    font-weight: 600;
                    padding: 0.25rem 0.65rem;
                    border-radius: 20px;
                    white-space: nowrap;
                }
                .btn-ai-remediation {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: #ffffff;
                    border: none;
                    border-radius: 9px;
                    font-weight: 600;
                    font-size: 0.79rem;
                    padding: 0.38rem 0.75rem;
                    box-shadow: 0 3px 10px rgba(99, 102, 241, 0.25);
                    transition: all 0.2s ease;
                }
                .btn-ai-remediation:hover {
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 5px 15px rgba(99, 102, 241, 0.35);
                    filter: brightness(1.05);
                }
            `}</style>

            {/* Type Avatar */}
            <div className="incident-type-avatar" style={{ background: bg }}>
                <i className={icon}></i>
            </div>

            {/* Main Info */}
            <div className="flex-grow-1 min-w-0">
                <p className="incident-item-title">{incident.title}</p>
                <p className="incident-item-desc">{incident.description || 'Tidak ada keterangan tambahan.'}</p>
                <div className="incident-item-meta">
                    <span className="d-flex align-items-center gap-1">
                        <i className="bi bi-globe2 text-teal" style={{ color: '#0ea5a3' }}></i>
                        <strong>{incident.site_name || incident.site?.name || 'Situs Terpantau'}</strong>
                    </span>
                    <span className="d-flex align-items-center gap-1">
                        <i className="bi bi-clock"></i>
                        {incident.detected_at_human || incident.created_at || 'Baru saja'}
                    </span>
                </div>
            </div>

            {/* Actions & Status */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap justify-content-end">
                {renderSeverityBadge(incident.severity)}
                {renderStatusBadge(incident.status)}
                <button
                    type="button"
                    className="btn btn-ai-remediation d-inline-flex align-items-center gap-1.5"
                    onClick={(e) => onOpenAi(e, incident)}
                    title="Konsultasikan langkah perbaikan dengan SIGAP AI"
                >
                    <i className="bi bi-magic" style={{ fontSize: '0.86rem' }}></i>
                    <span>Solusi AI</span>
                </button>
            </div>
        </div>
    );
}
