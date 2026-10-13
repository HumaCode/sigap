import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';
import BaseModal from '@/Components/BaseModal';

interface DetailIncidentModalProps {
    show: boolean;
    onClose: () => void;
    incident: any;
    onOpenAi?: (incident: any) => void;
}

export default function DetailIncidentModal({ show, onClose, incident, onOpenAi }: DetailIncidentModalProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'diff' | 'timeline'>('overview');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
        1: false,
        2: false,
        3: true,
        4: false,
    });

    const toggleStep = (step: number) => {
        setExpandedSteps(prev => ({
            ...prev,
            [step]: !prev[step],
        }));
    };

    useEffect(() => {
        if (!show) {
            setActiveTab('overview');
        }
    }, [show]);

    if (!show || !incident) return null;

    const isResolved = incident.status === 'resolved';
    const isAck = incident.status === 'acknowledged' || incident.status === 'investigating';
    const isFalsePositive = incident.status === 'false_positive';
    const progressPercent = isResolved ? 100 : (isAck ? 75 : (isFalsePositive ? 100 : 50));

    const getSeverityConfig = (severity: string) => {
        switch (severity) {
            case 'critical':
                return {
                    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    icon: 'bi bi-shield-fill-x',
                    badgeBg: '#fef2f2',
                    badgeColor: '#dc2626',
                    badgeBorder: '#fecaca',
                    label: 'Kritis',
                };
            case 'high':
                return {
                    gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    icon: 'bi bi-exclamation-triangle-fill',
                    badgeBg: '#fff7ed',
                    badgeColor: '#ea580c',
                    badgeBorder: '#fed7aa',
                    label: 'Tinggi',
                };
            case 'medium':
                return {
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                    icon: 'bi bi-shield-exclamation',
                    badgeBg: '#fefce8',
                    badgeColor: '#ca8a04',
                    badgeBorder: '#fef08a',
                    label: 'Sedang',
                };
            case 'low':
            default:
                return {
                    gradient: 'linear-gradient(135deg, #0ea5a3 0%, #0f2a3f 100%)',
                    icon: 'bi bi-shield-check',
                    badgeBg: '#f0fdf4',
                    badgeColor: '#16a34a',
                    badgeBorder: '#bbf7d0',
                    label: 'Rendah',
                };
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'defacement': return 'bi bi-bug-fill';
            case 'down':
            case 'uptime': return 'bi bi-hdd-network-fill';
            case 'keyword_found': return 'bi bi-search';
            case 'error': return 'bi bi-exclamation-octagon-fill';
            default: return 'bi bi-shield-exclamation';
        }
    };

    const sevConfig = getSeverityConfig(incident.severity);

    const renderSeverityBadge = (severity: string) => {
        const conf = getSeverityConfig(severity);
        return (
            <span 
                className="badge rounded-pill d-inline-flex align-items-center gap-1.5" 
                style={{ 
                    background: conf.badgeBg, 
                    color: conf.badgeColor, 
                    border: `1px solid ${conf.badgeBorder}`, 
                    padding: '0.4rem 0.85rem', 
                    fontWeight: 600, 
                    fontSize: '0.78rem' 
                }}
            >
                <i className={conf.icon}></i> {conf.label}
            </span>
        );
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'resolved':
                return (
                    <span className="badge rounded-pill d-inline-flex align-items-center gap-1.5" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.4rem 0.85rem', fontWeight: 600, fontSize: '0.78rem' }}>
                        <i className="bi bi-check-circle-fill"></i> Selesai
                    </span>
                );
            case 'acknowledged':
            case 'investigating':
                return (
                    <span className="badge rounded-pill d-inline-flex align-items-center gap-1.5" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '0.4rem 0.85rem', fontWeight: 600, fontSize: '0.78rem' }}>
                        <i className="bi bi-hourglass-split"></i> Sedang Ditinjau
                    </span>
                );
            case 'false_positive':
                return (
                    <span className="badge rounded-pill d-inline-flex align-items-center gap-1.5" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '0.4rem 0.85rem', fontWeight: 600, fontSize: '0.78rem' }}>
                        <i className="bi bi-flag"></i> Bukan Insiden
                    </span>
                );
            case 'open':
            default:
                return (
                    <span className="badge rounded-pill d-inline-flex align-items-center gap-1.5" style={{ background: '#fef2f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '0.4rem 0.85rem', fontWeight: 600, fontSize: '0.78rem' }}>
                        <i className="bi bi-exclamation-octagon-fill"></i> Terbuka (Open)
                    </span>
                );
        }
    };

    const handleStatusUpdate = (status: string) => {
        setIsUpdating(true);
        setUpdatingStatus(status);
        router.put(route('incidents.update', incident.id), { status }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsUpdating(false);
                setUpdatingStatus(null);
                let statusText = 'Diperbarui';
                if (status === 'false_positive') statusText = 'Bukan Insiden';
                if (status === 'acknowledged') statusText = 'Sedang Ditinjau';
                if (status === 'resolved') statusText = 'Selesai';
                
                toast.success('Status Diperbarui', `Insiden berhasil ditandai sebagai ${statusText}.`);
                onClose();
            },
            onError: () => {
                setIsUpdating(false);
                setUpdatingStatus(null);
                toast.error('Gagal', 'Terjadi kesalahan saat memperbarui status insiden.');
            }
        });
    };

    const modalFooter = (
        <div className="w-100 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
                {onOpenAi && (
                    <button
                        type="button"
                        className="modal-footer-btn btn-ai-action"
                        onClick={() => {
                            onClose();
                            onOpenAi(incident);
                        }}
                    >
                        <i className="bi bi-magic"></i>
                        <span>Solusi Penanganan AI</span>
                    </button>
                )}
            </div>

            <div className="d-flex align-items-center flex-wrap gap-2">
                <button 
                    type="button" 
                    className="modal-footer-btn btn-action-false" 
                    onClick={() => handleStatusUpdate('false_positive')}
                    disabled={isUpdating || isFalsePositive}
                    title="Tandai temuan ini bukan insiden keamanan (false positive)"
                >
                    {updatingStatus === 'false_positive' ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        <i className={isFalsePositive ? "bi bi-flag-fill text-muted" : "bi bi-flag"}></i>
                    )}
                    <span>{isFalsePositive ? 'Bukan Insiden (Aktif)' : 'Tandai Bukan Insiden'}</span>
                </button>

                <button 
                    type="button" 
                    className="modal-footer-btn btn-action-ack" 
                    onClick={() => handleStatusUpdate('acknowledged')}
                    disabled={isUpdating || isAck}
                    title="Tandai insiden sedang ditinjau dan dalam investigasi aktif"
                >
                    {updatingStatus === 'acknowledged' ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        <i className={isAck ? "bi bi-hourglass-bottom" : "bi bi-hourglass-split"}></i>
                    )}
                    <span>{isAck ? 'Sedang Ditinjau' : 'Tandai Ditinjau'}</span>
                </button>

                <button 
                    type="button" 
                    className="modal-footer-btn btn-action-resolve" 
                    onClick={() => handleStatusUpdate('resolved')}
                    disabled={isUpdating || isResolved}
                    title="Tandai insiden telah berhasil diselesaikan"
                >
                    {updatingStatus === 'resolved' ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        <i className="bi bi-check2-circle"></i>
                    )}
                    <span>{isResolved ? 'Sudah Selesai' : 'Tandai Selesai'}</span>
                </button>
            </div>
        </div>
    );

    return (
        <BaseModal
            show={show}
            onClose={onClose}
            title={incident.title}
            subtitle={
                <span className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff' }}></span>
                    <span>{incident.site_name || incident.site?.name || 'Situs Instansi'}</span>
                    <span className="opacity-75">• Terdeteksi {incident.detected_at_human || incident.created_at || 'Baru Saja'}</span>
                </span>
            }
            icon={getTypeIcon(incident.type)}
            headerGradient={sevConfig.gradient}
            size="lg"
            maxWidth="820px"
            bodyClassName="p-0"
            footer={modalFooter}
        >
            {/* Clean Modern Navigation Tabs */}
            <div className="px-4 pt-3 pb-0 bg-white border-bottom d-flex align-items-center gap-3">
                <button
                    type="button"
                    className="btn btn-link text-decoration-none py-2.5 px-1 d-inline-flex align-items-center gap-2 transition-all"
                    style={{
                        fontWeight: activeTab === 'overview' ? 700 : 500,
                        fontSize: '0.88rem',
                        color: activeTab === 'overview' ? 'var(--teal-1, #0ea5a3)' : '#64748b',
                        borderBottom: activeTab === 'overview' ? '2.5px solid var(--teal-1, #0ea5a3)' : '2.5px solid transparent',
                        borderRadius: 0,
                    }}
                    onClick={() => setActiveTab('overview')}
                >
                    <i className="bi bi-info-circle"></i>
                    <span>Ringkasan</span>
                </button>
                <button
                    type="button"
                    className="btn btn-link text-decoration-none py-2.5 px-1 d-inline-flex align-items-center gap-2 transition-all"
                    style={{
                        fontWeight: activeTab === 'diff' ? 700 : 500,
                        fontSize: '0.88rem',
                        color: activeTab === 'diff' ? 'var(--teal-1, #0ea5a3)' : '#64748b',
                        borderBottom: activeTab === 'diff' ? '2.5px solid var(--teal-1, #0ea5a3)' : '2.5px solid transparent',
                        borderRadius: 0,
                    }}
                    onClick={() => setActiveTab('diff')}
                >
                    <i className="bi bi-file-diff"></i>
                    <span>Diff Konten</span>
                    {incident.payload?.diff && (
                        <span className="badge rounded-pill bg-danger-subtle text-danger ms-1" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                            Ada Perubahan
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    className="btn btn-link text-decoration-none py-2.5 px-1 d-inline-flex align-items-center gap-2 transition-all"
                    style={{
                        fontWeight: activeTab === 'timeline' ? 700 : 500,
                        fontSize: '0.88rem',
                        color: activeTab === 'timeline' ? 'var(--teal-1, #0ea5a3)' : '#64748b',
                        borderBottom: activeTab === 'timeline' ? '2.5px solid var(--teal-1, #0ea5a3)' : '2.5px solid transparent',
                        borderRadius: 0,
                    }}
                    onClick={() => setActiveTab('timeline')}
                >
                    <i className="bi bi-clock-history"></i>
                    <span>Linimasa</span>
                </button>
            </div>

            {/* Modal Body Tab Content */}
            <div className="p-4" style={{ background: '#f8fafc', minHeight: '320px' }}>
                {/* 1. Ringkasan Overview */}
                {activeTab === 'overview' && (
                    <div className="row g-3">
                        {/* Tipe Insiden */}
                        <div className="col-12 col-sm-6">
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                    Tipe Insiden
                                </div>
                                <div className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.92rem', color: 'var(--ink, #0f2a3f)' }}>
                                    <i className="bi bi-tag-fill text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                    <span className="text-capitalize">{incident.type || 'Defacement'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tingkat Urgensi */}
                        <div className="col-12 col-sm-6">
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                    Tingkat Urgensi (Severity)
                                </div>
                                <div>
                                    {renderSeverityBadge(incident.severity)}
                                </div>
                            </div>
                        </div>

                        {/* Situs */}
                        <div className="col-12 col-sm-6">
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                    Situs Terdampak
                                </div>
                                <div className="fw-bold text-truncate" style={{ fontSize: '0.92rem', color: 'var(--ink, #0f2a3f)' }} title={incident.site_name}>
                                    <i className="bi bi-hdd-network me-1.5 text-muted"></i>
                                    {incident.site_name || incident.site?.name || 'Situs Instansi'}
                                </div>
                                {incident.site_url && (
                                    <div className="mt-1">
                                        <a 
                                            href={incident.site_url.startsWith('http') ? incident.site_url : `https://${incident.site_url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-decoration-none d-inline-flex align-items-center gap-1 text-primary"
                                            style={{ fontSize: '0.78rem' }}
                                        >
                                            <span>{incident.site_url}</span>
                                            <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.7rem' }}></i>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Penanganan */}
                        <div className="col-12 col-sm-6">
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                <div className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                    Status Penanganan Saat Ini
                                </div>
                                <div>
                                    {renderStatusBadge(incident.status)}
                                </div>
                            </div>
                        </div>

                        {/* Deskripsi */}
                        <div className="col-12">
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                <div className="text-muted text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                                    Deskripsi & Temuan Insiden
                                </div>
                                <p className="m-0 text-secondary" style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
                                    {incident.description || 'Tidak ada deskripsi detail tambahan.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Diff Konten */}
                {activeTab === 'diff' && (
                    <div>
                        {incident.payload?.diff ? (
                            <div className="p-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
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
                            </div>
                        ) : (
                            <div className="text-center p-5 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                                <i className="bi bi-file-code mb-2 d-block text-muted" style={{ fontSize: '2.5rem', opacity: 0.6 }}></i>
                                <h6 className="fw-bold mb-1" style={{ color: 'var(--ink, #0f2a3f)' }}>Diff Konten Tidak Tersedia</h6>
                                <p className="text-muted m-0" style={{ fontSize: '0.84rem' }}>
                                    Data perbandingan konten HTML/skrip tidak disertakan untuk jenis insiden ini.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Timeline Linimasa Interaktif */}
                {activeTab === 'timeline' && (
                    <div>
                        {/* Lifecycle Progress Bar */}
                        <div className="bg-white p-3.5 rounded-3 border mb-3.5" style={{ borderColor: '#e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                                <div className="d-flex align-items-center gap-2">
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: isResolved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(14, 165, 163, 0.12)',
                                        color: isResolved ? '#10b981' : 'var(--teal-1, #0ea5a3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1rem',
                                    }}>
                                        <i className={isResolved ? "bi bi-check-circle-fill" : "bi bi-activity"}></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold" style={{ fontSize: '0.88rem', color: 'var(--ink, #0f2a3f)' }}>
                                            Siklus Tanggap Insiden ({progressPercent}% Selesai)
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.74rem' }}>
                                            Standar CSIRT / BSSN: Deteksi &rarr; Triage AI &rarr; Investigasi &rarr; Resolusi
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className={`badge rounded-pill ${isResolved ? 'bg-success-subtle text-success border border-success-subtle' : (isFalsePositive ? 'bg-secondary-subtle text-muted border' : (isAck ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'))} px-3 py-1.5`} style={{ fontSize: '0.76rem', fontWeight: 600 }}>
                                        {isResolved ? 'Insiden Selesai Ditangani' : (isFalsePositive ? 'Bukan Insiden (Ditutup)' : (isAck ? 'Tahap Investigasi Aktif' : 'Menunggu Tindakan Admin'))}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="progress" style={{ height: '7px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div 
                                    className="progress-bar progress-bar-striped progress-bar-animated"
                                    style={{ 
                                        width: `${progressPercent}%`, 
                                        background: isResolved ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #0ea5a3, #f59e0b)',
                                        transition: 'width 0.4s ease'
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Interactive Timeline Stepper List */}
                        <div className="position-relative" style={{ paddingLeft: '4px' }}>
                            {/* Vertical Connecting Spine */}
                            <div 
                                style={{ 
                                    position: 'absolute', 
                                    left: '23px', 
                                    top: '28px', 
                                    bottom: '28px', 
                                    width: '3px', 
                                    background: 'linear-gradient(180deg, #0ea5a3 0%, #3b82f6 35%, #f59e0b 70%, #10b981 100%)', 
                                    borderRadius: '3px',
                                    zIndex: 1,
                                    opacity: 0.6
                                }}
                            ></div>

                            {/* Step 1: Deteksi Awal */}
                            <div className="position-relative d-flex gap-3 mb-3" style={{ zIndex: 2 }}>
                                <div 
                                    style={{
                                        width: '42px', height: '42px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #0ea5a3, #0284c7)',
                                        color: '#ffffff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.1rem', flexShrink: 0,
                                        boxShadow: '0 4px 12px rgba(14, 165, 163, 0.35)',
                                        border: '3px solid #ffffff'
                                    }}
                                >
                                    <i className="bi bi-radar"></i>
                                </div>

                                <div 
                                    className="card flex-grow-1 border rounded-3 p-3 transition-all"
                                    style={{ 
                                        background: '#ffffff', 
                                        borderColor: '#e2e8f0',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}
                                >
                                    <div 
                                        className="d-flex align-items-center justify-content-between flex-wrap gap-2 cursor-pointer"
                                        onClick={() => toggleStep(1)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: '0.7rem' }}>Tahap 1</span>
                                            <h6 className="fw-bold m-0" style={{ fontSize: '0.88rem', color: 'var(--ink, #0f2a3f)' }}>
                                                Deteksi Anomali oleh Sensor SIGAP
                                            </h6>
                                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                                <i className="bi bi-check-circle-fill me-1"></i>Selesai
                                            </span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.76rem' }}>
                                            <span><i className="bi bi-clock me-1"></i>{incident.detected_at_human || incident.created_at || 'Waktu deteksi'}</span>
                                            <i className={`bi ${expandedSteps[1] ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                                        </div>
                                    </div>

                                    <p className="text-secondary mb-0 mt-1.5" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                                        Mesin pemindai otomatis menemukan aktivitas mencurigakan bertipe <strong>{incident.type}</strong> pada situs <strong>{incident.site_name || incident.site?.name || 'situs instansi'}</strong>.
                                    </p>

                                    {/* Expandable Technical Details Drawer */}
                                    {expandedSteps[1] && (
                                        <div className="mt-3 pt-2.5 border-top" style={{ fontSize: '0.78rem' }}>
                                            <div className="row g-2 text-muted">
                                                <div className="col-12 col-md-6">
                                                    <i className="bi bi-link-45deg me-1 text-teal"></i>
                                                    URL Sasaran: <strong className="text-dark">{incident.site_url || '-'}</strong>
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <i className="bi bi-calendar3 me-1 text-teal"></i>
                                                    Waktu Rekam: <strong className="text-dark">{incident.detected_at || incident.created_at || '-'}</strong>
                                                </div>
                                            </div>
                                            {incident.payload?.diff && (
                                                <div className="mt-2">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-2"
                                                        style={{ fontSize: '0.75rem' }}
                                                        onClick={(e) => { e.stopPropagation(); setActiveTab('diff'); }}
                                                    >
                                                        <i className="bi bi-file-diff"></i> Periksa Diff Konten Langsung
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Triage AI */}
                            <div className="position-relative d-flex gap-3 mb-3" style={{ zIndex: 2 }}>
                                <div 
                                    style={{
                                        width: '42px', height: '42px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                        color: '#ffffff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.1rem', flexShrink: 0,
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                                        border: '3px solid #ffffff'
                                    }}
                                >
                                    <i className="bi bi-cpu-fill"></i>
                                </div>

                                <div 
                                    className="card flex-grow-1 border rounded-3 p-3 transition-all"
                                    style={{ 
                                        background: '#ffffff', 
                                        borderColor: '#e2e8f0',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}
                                >
                                    <div 
                                        className="d-flex align-items-center justify-content-between flex-wrap gap-2 cursor-pointer"
                                        onClick={() => toggleStep(2)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: '0.7rem' }}>Tahap 2</span>
                                            <h6 className="fw-bold m-0" style={{ fontSize: '0.88rem', color: 'var(--ink, #0f2a3f)' }}>
                                                Triage Risiko & Evaluasi AI Sentinel
                                            </h6>
                                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                                <i className="bi bi-shield-check me-1"></i>Otomatis
                                            </span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.76rem' }}>
                                            <span><i className="bi bi-robot me-1"></i>AI Engine</span>
                                            <i className={`bi ${expandedSteps[2] ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                                        </div>
                                    </div>

                                    <p className="text-secondary mb-0 mt-1.5" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                                        Sistem AI mengevaluasi keparahan insiden pada tingkat <strong className="text-uppercase">{sevConfig.label} ({incident.severity})</strong> dan menyiapkan skema remediasi.
                                    </p>

                                    {/* Expandable AI Drawer */}
                                    {expandedSteps[2] && (
                                        <div className="mt-3 pt-2.5 border-top" style={{ fontSize: '0.78rem' }}>
                                            <div className="p-2.5 rounded-2 mb-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                <div className="fw-semibold text-dark mb-1 d-flex align-items-center gap-1.5">
                                                    <i className="bi bi-lightbulb-fill text-warning"></i>
                                                    Diagnosis Singkat AI:
                                                </div>
                                                <div className="text-muted" style={{ lineHeight: 1.45 }}>
                                                    {incident.description || 'Insiden memerlukan isolasi rute dan validasi integritas berkas utama.'}
                                                </div>
                                            </div>
                                            {onOpenAi && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 py-1 px-3 rounded-2 shadow-sm"
                                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onClose();
                                                        onOpenAi(incident);
                                                    }}
                                                >
                                                    <i className="bi bi-magic"></i> Buka Solusi AI Remediasi
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Tindak Lanjut Admin & CSIRT */}
                            <div className="position-relative d-flex gap-3 mb-3" style={{ zIndex: 2 }}>
                                <div 
                                    style={{
                                        width: '42px', height: '42px', borderRadius: '50%',
                                        background: isResolved 
                                            ? 'linear-gradient(135deg, #10b981, #059669)' 
                                            : (isAck ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #ef4444, #dc2626)'),
                                        color: '#ffffff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.1rem', flexShrink: 0,
                                        boxShadow: isResolved ? '0 4px 12px rgba(16, 185, 129, 0.35)' : '0 4px 12px rgba(245, 158, 11, 0.35)',
                                        border: '3px solid #ffffff'
                                    }}
                                >
                                    <i className={isResolved ? "bi bi-check-lg" : (isAck ? "bi bi-hourglass-split" : "bi bi-person-fill-gear")}></i>
                                </div>

                                <div 
                                    className="card flex-grow-1 border rounded-3 p-3 transition-all"
                                    style={{ 
                                        background: '#ffffff', 
                                        borderColor: isResolved ? '#bbf7d0' : (isAck ? '#fde68a' : '#fecaca'),
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}
                                >
                                    <div 
                                        className="d-flex align-items-center justify-content-between flex-wrap gap-2 cursor-pointer"
                                        onClick={() => toggleStep(3)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: '0.7rem' }}>Tahap 3</span>
                                            <h6 className="fw-bold m-0" style={{ fontSize: '0.88rem', color: 'var(--ink, #0f2a3f)' }}>
                                                Tindak Lanjut Administrator & Tim CSIRT
                                            </h6>
                                            <span className={`badge rounded-pill ${isResolved ? 'bg-success-subtle text-success border border-success-subtle' : (isAck ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle')}`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                                {isResolved ? 'Selesai' : (isAck ? 'Sedang Ditinjau' : 'Perlu Tindakan')}
                                            </span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.76rem' }}>
                                            <span className="text-capitalize fw-semibold text-dark">Status: {incident.status}</span>
                                            <i className={`bi ${expandedSteps[3] ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                                        </div>
                                    </div>

                                    <p className="text-secondary mb-0 mt-1.5" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                                        {isResolved 
                                            ? 'Insiden telah berhasil ditindaklanjuti dan diverifikasi bersih oleh tim pengelola.' 
                                            : (isAck 
                                                ? 'Insiden sedang dalam proses investigasi aktif dan perbaikan teknis.' 
                                                : 'Menunggu respon tindakan administrator untuk mengisolasi, memperbaiki, atau menutup insiden.')
                                        }
                                    </p>

                                    {/* Expandable Action Drawer (Live Actions Directly Here) */}
                                    {expandedSteps[3] && (
                                        <div className="mt-3 pt-2.5 border-top" style={{ fontSize: '0.78rem' }}>
                                            <div className="fw-semibold text-muted mb-2">
                                                <i className="bi bi-lightning-charge-fill text-warning me-1"></i>
                                                Aksi Tindak Lanjut Cepat Langsung di Linimasa:
                                            </div>
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    className="modal-footer-btn btn-action-ack"
                                                    style={{ fontSize: '0.78rem', padding: '0.42rem 0.95rem' }}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate('acknowledged'); }}
                                                    disabled={isUpdating || isAck}
                                                >
                                                    {updatingStatus === 'acknowledged' ? (
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                        <i className={isAck ? "bi bi-hourglass-bottom" : "bi bi-hourglass-split"}></i>
                                                    )}
                                                    <span>{isAck ? 'Sedang Ditinjau' : 'Tandai Sedang Ditinjau'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="modal-footer-btn btn-action-resolve"
                                                    style={{ fontSize: '0.78rem', padding: '0.42rem 1.05rem' }}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate('resolved'); }}
                                                    disabled={isUpdating || isResolved}
                                                >
                                                    {updatingStatus === 'resolved' ? (
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                        <i className="bi bi-check2-circle"></i>
                                                    )}
                                                    <span>{isResolved ? 'Sudah Selesai' : 'Tandai Selesai'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="modal-footer-btn btn-action-false"
                                                    style={{ fontSize: '0.78rem', padding: '0.42rem 0.95rem' }}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate('false_positive'); }}
                                                    disabled={isUpdating || isFalsePositive}
                                                >
                                                    {updatingStatus === 'false_positive' ? (
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                        <i className={isFalsePositive ? "bi bi-flag-fill text-muted" : "bi bi-flag"}></i>
                                                    )}
                                                    <span>{isFalsePositive ? 'Bukan Insiden' : 'Tandai Bukan Insiden'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 4: Verifikasi & Penutupan */}
                            <div className="position-relative d-flex gap-3" style={{ zIndex: 2 }}>
                                <div 
                                    style={{
                                        width: '42px', height: '42px', borderRadius: '50%',
                                        background: isResolved 
                                            ? 'linear-gradient(135deg, #10b981, #059669)' 
                                            : '#94a3b8',
                                        color: '#ffffff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.1rem', flexShrink: 0,
                                        boxShadow: isResolved ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                                        border: '3px solid #ffffff'
                                    }}
                                >
                                    <i className="bi bi-patch-check-fill"></i>
                                </div>

                                <div 
                                    className="card flex-grow-1 border rounded-3 p-3 transition-all"
                                    style={{ 
                                        background: isResolved ? '#ffffff' : '#f8fafc', 
                                        borderColor: isResolved ? '#bbf7d0' : '#e2e8f0',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <div 
                                        className="d-flex align-items-center justify-content-between flex-wrap gap-2 cursor-pointer"
                                        onClick={() => toggleStep(4)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: '0.7rem' }}>Tahap 4</span>
                                            <h6 className="fw-bold m-0" style={{ fontSize: '0.88rem', color: 'var(--ink, #0f2a3f)' }}>
                                                Verifikasi Pasca-Remediasi & Penutupan Tiket
                                            </h6>
                                            <span className={`badge rounded-pill ${isResolved ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-muted border'} `} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                                {isResolved ? 'Tuntas & Terverifikasi' : 'Menunggu Penyelesaian'}
                                            </span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.76rem' }}>
                                            <span>{isResolved ? 'Audit Selesai' : 'Tahap Akhir'}</span>
                                            <i className={`bi ${expandedSteps[4] ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                                        </div>
                                    </div>

                                    <p className="text-secondary mb-0 mt-1.5" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                                        {isResolved 
                                            ? 'Sensor SIGAP memverifikasi kembali bahwa integritas dan ketersediaan situs telah pulih normal. Insiden resmi ditutup.' 
                                            : 'Sistem akan melakukan verifikasi otomatis setelah status insiden ditandai selesai.'
                                        }
                                    </p>

                                    {/* Expandable Verification Info */}
                                    {expandedSteps[4] && (
                                        <div className="mt-3 pt-2.5 border-top text-muted" style={{ fontSize: '0.78rem' }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="bi bi-shield-lock text-success"></i>
                                                <span>Laporan insiden ini otomatis dicatat dalam log kepatuhan audit keamanan SPBE & BSSN.</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Scoped CSS Styles for Modal Action Buttons */}
            <style>{`
                .modal-footer-btn {
                    border-radius: 11px;
                    font-size: 0.84rem;
                    font-weight: 600;
                    padding: 0.52rem 1.15rem;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.45rem;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    border: 1.5px solid transparent;
                    text-decoration: none;
                    line-height: 1.35;
                }
                .modal-footer-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                    box-shadow: none !important;
                }

                /* Tombol AI Remediasi */
                .modal-footer-btn.btn-ai-action {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: #ffffff;
                    border: none;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.28);
                }
                .modal-footer-btn.btn-ai-action:hover:not(:disabled) {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.38);
                }

                /* Tombol Bukan Insiden (False Positive) */
                .modal-footer-btn.btn-action-false {
                    background: #f8fafc;
                    color: #475569;
                    border: 1.5px solid #e2e8f0;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
                }
                .modal-footer-btn.btn-action-false:hover:not(:disabled) {
                    background: #f1f5f9;
                    color: #1e293b;
                    border-color: #cbd5e1;
                    transform: translateY(-1px);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
                }

                /* Tombol Tandai Ditinjau (Acknowledged) */
                .modal-footer-btn.btn-action-ack {
                    background: #fffbeb;
                    color: #b45309;
                    border: 1.5px solid #fde68a;
                    box-shadow: 0 1px 2px rgba(245, 158, 11, 0.08);
                }
                .modal-footer-btn.btn-action-ack:hover:not(:disabled) {
                    background: #fef3c7;
                    color: #92400e;
                    border-color: #fcd34d;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
                }

                /* Tombol Tandai Selesai (Resolved) */
                .modal-footer-btn.btn-action-resolve {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: #ffffff;
                    border: none;
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
                }
                .modal-footer-btn.btn-action-resolve:hover:not(:disabled) {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
                }
            `}</style>
        </BaseModal>
    );
}
