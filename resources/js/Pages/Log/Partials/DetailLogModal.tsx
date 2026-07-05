import Modal from '@/Components/Modal';

interface DetailLogModalProps {
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    selectedLog: any | null;
    handleUpdateStatus: (id: string, status: string) => void;
    getCatBadge: (category: string) => React.ReactNode;
    getIconInfo: (category: string) => { bg: string; icon: string };
    getStatusBadge: (status: string) => React.ReactNode;
}

export default function DetailLogModal({
    showModal,
    setShowModal,
    selectedLog,
    handleUpdateStatus,
    getCatBadge,
    getIconInfo,
    getStatusBadge
}: DetailLogModalProps) {
    return (
        <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
            {selectedLog && (
                <div className="position-relative overflow-hidden">
                    {/* Efek glow blur dekoratif di latar belakang modal */}
                    <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: getIconInfo(selectedLog.category).bg, filter: 'blur(70px)', opacity: 0.15, zIndex: 0, borderRadius: '50%' }}></div>
                    
                    <div className="p-4 p-md-5 position-relative" style={{ zIndex: 1 }}>
                        <div className="d-flex justify-content-between align-items-start mb-4 pb-3" style={{ borderBottom: '1px dashed var(--line)' }}>
                            <div className="d-flex align-items-center gap-3">
                                <div className="log-icon shadow-sm" style={{ background: getIconInfo(selectedLog.category).bg, width: '48px', height: '48px', fontSize: '1.2rem' }}>
                                    <i className={`bi ${getIconInfo(selectedLog.category).icon}`}></i>
                                </div>
                                <div>
                                    <h3 className="m-0" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Detail Log Deteksi</h3>
                                    <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="btn-close shadow-none" aria-label="Close" style={{ backgroundSize: '0.8em' }}></button>
                        </div>
                        
                        <div className="row g-3">
                            <div className="col-12">
                                <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--line)', boxShadow: '0 2px 10px rgba(15,42,63,0.02)' }}>
                                    <label className="text-muted mb-1 d-block" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipe Deteksi & Kategori</label>
                                    <div className="d-flex align-items-center gap-2 mt-1" style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>
                                        {selectedLog.title} {getCatBadge(selectedLog.category)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 h-100" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--line)', boxShadow: '0 2px 10px rgba(15,42,63,0.02)' }}>
                                    <label className="text-muted mb-2 d-block" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informasi Situs</label>
                                    <div className="d-flex align-items-center gap-2" style={{ fontWeight: 500, fontSize: '0.88rem' }}>
                                        <i className="bi bi-globe2 text-muted"></i> {selectedLog.site?.name || 'Situs Tidak Diketahui'}
                                    </div>
                                    <div className="d-flex align-items-center gap-2 mt-2 text-break" style={{ fontWeight: 500, color: 'var(--blue-1)', fontSize: '0.88rem' }}>
                                        <i className="bi bi-link-45deg text-muted"></i> {selectedLog.url_path || '/'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-md-6">
                                <div className="p-3 rounded-3 h-100" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--line)', boxShadow: '0 2px 10px rgba(15,42,63,0.02)' }}>
                                    <label className="text-muted mb-2 d-block" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Waktu Deteksi</label>
                                    <div className="d-flex align-items-center gap-2" style={{ fontWeight: 500, fontSize: '0.88rem' }}>
                                        <i className="bi bi-clock text-muted"></i> {selectedLog.created_at}
                                    </div>
                                    <div className="d-flex align-items-center gap-2 mt-2" style={{ fontWeight: 500, fontSize: '0.88rem' }}>
                                        <i className="bi bi-radar text-muted"></i> Terdeteksi via Scanner Otomatis
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 mt-4">
                                <label className="mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                                    <i className="bi bi-code-square text-muted"></i> Konteks (Temuan Konten)
                                </label>
                                <div className="p-3 rounded-3 border overflow-auto log-context" 
                                     style={{ 
                                         maxHeight: '220px', 
                                         fontSize: '0.85rem', 
                                         fontFamily: "'DM Mono', monospace",
                                         background: '#f8fafc',
                                         boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)'
                                     }}
                                     dangerouslySetInnerHTML={{ __html: selectedLog.context }}>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 d-flex justify-content-end gap-2" style={{ borderTop: '1px dashed var(--line)' }}>
                            <button onClick={() => setShowModal(false)} className="btn btn-light px-4 shadow-sm" style={{ borderRadius: '10px', fontWeight: 500, border: '1px solid var(--line)' }}>
                                Tutup
                            </button>
                            {selectedLog.status !== 'blocked' && (
                                <button onClick={() => { handleUpdateStatus(selectedLog.id, 'blocked'); setShowModal(false); }} className="btn px-4 text-white shadow-sm" style={{ borderRadius: '10px', fontWeight: 500, background: 'linear-gradient(135deg, var(--ink), var(--ink-soft))', border: 'none' }}>
                                    <i className="bi bi-shield-slash me-2"></i> Blokir URL
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
