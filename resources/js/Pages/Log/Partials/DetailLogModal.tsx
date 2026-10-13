import React from 'react';
import BaseModal from '@/Components/BaseModal';
import { DetectionLogItem } from './DetectionLogList';

interface DetailLogModalProps {
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    selectedLog: DetectionLogItem | null;
    canManageStatus?: boolean;
    handleUpdateStatus: (id: string, status: string) => void;
    getCatBadge: (category: string) => React.ReactNode;
    getIconInfo: (category: string) => { bg: string; icon: string };
    getStatusBadge: (status: string) => React.ReactNode;
}

export default function DetailLogModal({
    showModal,
    setShowModal,
    selectedLog,
    canManageStatus = true,
    handleUpdateStatus,
    getCatBadge,
    getIconInfo,
    getStatusBadge,
}: DetailLogModalProps) {
    if (!selectedLog) return null;

    const iconData = getIconInfo(selectedLog.category);
    const targetUrl = selectedLog.url_path
        ? (selectedLog.url_path.startsWith('http')
            ? selectedLog.url_path
            : `https://${selectedLog.site?.url || 'example.com'}${selectedLog.url_path.startsWith('/') ? '' : '/'}${selectedLog.url_path}`)
        : null;

    const modalFooter = (
        <div className="w-100 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
                {targetUrl && (
                    <a 
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1.5"
                        style={{ borderRadius: '10px', fontWeight: 600 }}
                    >
                        <i className="bi bi-box-arrow-up-right"></i>
                        <span>Buka Halaman URL</span>
                    </a>
                )}
            </div>

            <div className="d-flex align-items-center gap-2">
                <button 
                    type="button"
                    onClick={() => setShowModal(false)} 
                    className="btn btn-light btn-sm px-4" 
                    style={{ borderRadius: '10px', fontWeight: 600, color: '#64748b' }}
                >
                    Tutup
                </button>

                {canManageStatus && selectedLog.status !== 'blocked' && (
                    <button 
                        type="button"
                        onClick={() => { 
                            handleUpdateStatus(selectedLog.id, 'blocked'); 
                            setShowModal(false); 
                        }} 
                        className="btn btn-sm text-white px-4 shadow-sm" 
                        style={{ 
                            borderRadius: '10px', 
                            fontWeight: 600, 
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                            border: 'none' 
                        }}
                    >
                        <i className="bi bi-shield-slash me-1.5"></i>
                        <span>Blokir URL / Konten</span>
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <BaseModal
            show={showModal}
            onClose={() => setShowModal(false)}
            title="Detail Log Deteksi Mesin"
            subtitle={
                <span className="d-flex align-items-center gap-2 mt-1">
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff' }}></span>
                    <span>{selectedLog.site?.name || 'Situs'}</span>
                    <span className="opacity-75 ms-1">• {selectedLog.source || 'Automated Scanner Engine'}</span>
                </span>
            }
            icon={iconData.icon}
            headerGradient={iconData.bg}
            size="lg"
            maxWidth="750px"
            footer={modalFooter}
        >
            <div className="row g-3">
                {/* Detection Title & Status Banner */}
                <div className="col-12">
                    <div className="p-3 rounded-4 bg-white border d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ borderColor: 'rgba(15,42,63,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Tipe Temuan & Kategori
                            </div>
                            <div className="d-flex align-items-center gap-2 mt-1" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>
                                {selectedLog.title} {getCatBadge(selectedLog.category)}
                            </div>
                        </div>
                        <div>
                            {getStatusBadge(selectedLog.status)}
                        </div>
                    </div>
                </div>

                {/* Site & URL Info */}
                <div className="col-md-6">
                    <div className="p-3 rounded-4 bg-white border h-100" style={{ borderColor: 'rgba(15,42,63,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            Informasi Situs & Path
                        </div>
                        <div className="d-flex align-items-center gap-2" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                            <i className="bi bi-globe2 text-muted"></i>
                            <span>{selectedLog.site?.name || 'Situs Tidak Diketahui'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-2 text-break" style={{ fontWeight: 500, color: 'var(--blue-1)', fontSize: '0.84rem' }}>
                            <i className="bi bi-link-45deg text-muted"></i>
                            <span>{selectedLog.url_path || '/'}</span>
                        </div>
                    </div>
                </div>

                {/* Detection Timestamp Info */}
                <div className="col-md-6">
                    <div className="p-3 rounded-4 bg-white border h-100" style={{ borderColor: 'rgba(15,42,63,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            Waktu & Metode Deteksi
                        </div>
                        <div className="d-flex align-items-center gap-2" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                            <i className="bi bi-clock text-muted"></i>
                            <span>{selectedLog.created_at || 'Baru saja'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-2" style={{ fontWeight: 500, fontSize: '0.84rem', color: 'var(--ink-faint)' }}>
                            <i className="bi bi-radar text-muted"></i>
                            <span>{selectedLog.source || 'Pemindaian Otomatis Background Scanner'}</span>
                        </div>
                    </div>
                </div>

                {/* Log Context Snippet */}
                <div className="col-12 mt-3">
                    <label className="mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <i className="bi bi-code-square text-muted"></i> Konteks Temuan Script / Kata Kunci
                    </label>
                    <div 
                        className="p-3 rounded-4 border overflow-auto log-context" 
                        style={{ 
                            maxHeight: '220px', 
                            fontSize: '0.84rem', 
                            fontFamily: "'DM Mono', monospace",
                            background: '#f8fafc',
                            borderColor: 'rgba(15,42,63,0.08)',
                            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)'
                        }}
                        dangerouslySetInnerHTML={{ __html: selectedLog.context }}
                    ></div>
                </div>
            </div>
        </BaseModal>
    );
}
