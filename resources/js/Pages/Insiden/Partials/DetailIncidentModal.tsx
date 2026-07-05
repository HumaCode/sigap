import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

interface DetailIncidentModalProps {
    show: boolean;
    onClose: () => void;
    incident: any;
}

export default function DetailIncidentModal({ show, onClose, incident }: DetailIncidentModalProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!show) {
            setActiveTab('overview');
        }
    }, [show]);

    if (!show || !incident) return null;

    const renderSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return <span className="sev-badge sev-critical">Kritis</span>;
            case 'high': return <span className="sev-badge sev-high">Tinggi</span>;
            case 'medium': return <span className="sev-badge sev-medium">Sedang</span>;
            case 'low': return <span className="sev-badge sev-low">Rendah</span>;
            default: return <span className="sev-badge sev-low">{severity}</span>;
        }
    };

    const handleStatusUpdate = (status: string) => {
        setIsUpdating(true);
        router.put(route('incidents.update', incident.id), { status }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsUpdating(false);
                onClose();
            },
            onError: () => setIsUpdating(false)
        });
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(15,42,63,0.5)', zIndex: 1060, backdropFilter: 'blur(8px)' }} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg w-100" style={{ maxWidth: '800px', margin: '1.75rem auto' }}>
                <div className="modal-content w-100" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', background: '#ffffff' }}>
                    <div className="modal-header-custom d-flex justify-content-between align-items-start" style={{ padding: '1.5rem', background: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <div>
                            <h5 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--ink-dark)', marginBottom: '0.3rem' }}><i className="bi bi-bug me-2" style={{ color: 'var(--coral)' }}></i>{incident.title}</h5>
                            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: 0 }}>{incident.site_name || 'Situs Tidak Diketahui'} • terdeteksi {incident.detected_at_human || incident.created_at}</p>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <ul className="nav nav-tabs-custom" role="tablist" style={{ background: '#f8fafc', padding: '0 1.5rem' }}>
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Ringkasan</button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === 'diff' ? 'active' : ''}`} onClick={() => setActiveTab('diff')}>Diff Konten</button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Linimasa</button>
                        </li>
                    </ul>

                    <div className="modal-body p-4" style={{ minHeight: '300px' }}>
                        <div className="tab-content">
                            {/* Ringkasan */}
                            {activeTab === 'overview' && (
                                <div className="tab-pane fade show active">
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="detail-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Tipe Insiden</div>
                                            <div className="detail-value" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{incident.type}</div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="detail-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Severity</div>
                                            <div className="detail-value">{renderSeverityBadge(incident.severity)}</div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="detail-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Situs</div>
                                            <div className="detail-value" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{incident.site_name}</div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="detail-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Status Saat Ini</div>
                                            <div className="detail-value" style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.95rem' }}>{incident.status}</div>
                                        </div>
                                        <div className="col-12 mt-4">
                                            <div className="detail-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Deskripsi</div>
                                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)' }}>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', lineHeight: '1.6', margin: 0 }}>
                                                    {incident.description || 'Tidak ada deskripsi detail.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Diff Konten */}
                            {activeTab === 'diff' && (
                                <div className="tab-pane fade show active">
                                    {incident.payload?.diff ? (
                                        <div className="diff-viewer">
                                            <div className="diff-head">
                                                <div className="diff-col-head before"><i className="bi bi-dash-circle me-1"></i>Sebelum (Baseline)</div>
                                                <div className="diff-col-head after"><i className="bi bi-plus-circle me-1"></i>Sesudah (Saat Ini)</div>
                                            </div>
                                            <div className="diff-body">
                                                <div className="diff-pane">{incident.payload.diff.before || 'Data tidak tersedia'}</div>
                                                <div className="diff-pane">{incident.payload.diff.after || 'Data tidak tersedia'}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center p-5" style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)' }}>
                                            <i className="bi bi-code-slash mb-3" style={{ fontSize: '2.5rem', color: 'var(--ink-faint)' }}></i>
                                            <h6 style={{ fontWeight: 600 }}>Diff Tidak Tersedia</h6>
                                            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: 0 }}>Data perbandingan konten tidak disertakan untuk jenis insiden ini.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Timeline */}
                            {activeTab === 'timeline' && (
                                <div className="tab-pane fade show active">
                                    <div className="timeline">
                                        <div className="timeline-item">
                                            <div className="timeline-dot coral"></div>
                                            <p className="timeline-title">Insiden terdeteksi oleh sistem</p>
                                            <span className="timeline-meta">{incident.detected_at_human}</span>
                                        </div>
                                        <div className="timeline-item">
                                            <div className="timeline-dot"></div>
                                            <p className="timeline-title">Menunggu tindak lanjut admin</p>
                                            <span className="timeline-meta">Status saat ini: {incident.status}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer d-flex flex-wrap gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '1.25rem 1.5rem', background: '#f8fafc' }}>
                        <button 
                            type="button" 
                            className="action-footer-btn btn-false" 
                            onClick={() => handleStatusUpdate('false_positive')}
                            disabled={isUpdating}
                        >
                            <i className="bi bi-flag"></i> Tandai Bukan Insiden
                        </button>
                        <button 
                            type="button" 
                            className="action-footer-btn btn-ack" 
                            onClick={() => handleStatusUpdate('acknowledged')}
                            disabled={isUpdating}
                        >
                            <i className="bi bi-hourglass-split"></i> Tandai Ditinjau
                        </button>
                        <button 
                            type="button" 
                            className="action-footer-btn btn-resolve ms-auto"
                            onClick={() => handleStatusUpdate('resolved')}
                            disabled={isUpdating}
                        >
                            <i className="bi bi-check2-circle"></i> Tandai Selesai
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
