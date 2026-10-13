import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';
import { BackupItem } from './BackupTable';

interface RestoreModalProps {
    show: boolean;
    onClose: () => void;
    backup: BackupItem | null;
}

export default function RestoreModal({ show, onClose, backup }: RestoreModalProps) {
    const [isRestoring, setIsRestoring] = useState(false);

    if (!show || !backup) return null;

    const handleConfirmRestore = () => {
        setIsRestoring(true);
        router.post(route('backups.restore', backup.id), {}, {
            onSuccess: () => {
                toast.success('Pemulihan Sukses', `File situs ${backup.site?.name} berhasil dipulihkan dari arsip ${backup.filename}.`);
                setIsRestoring(false);
                onClose();
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0] as string || 'Gagal memulihkan situs.';
                toast.error('Gagal Memulihkan', msg);
                setIsRestoring(false);
            },
            onFinish: () => {
                setIsRestoring(false);
            }
        });
    };

    return (
        <div 
            className="modal fade show d-block" 
            tabIndex={-1} 
            style={{ backgroundColor: 'rgba(15,42,63,0.65)', backdropFilter: 'blur(5px)', zIndex: 1060 }}
        >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
                <div 
                    className="modal-content border-0 shadow-lg"
                    style={{ borderRadius: '20px', overflow: 'hidden' }}
                >
                    {/* Header Warning */}
                    <div 
                        className="modal-header text-white border-0 p-4"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #b45309)' }}
                    >
                        <div className="d-flex align-items-center gap-2.5">
                            <div 
                                className="rounded-3 d-flex align-items-center justify-content-center text-white"
                                style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', fontSize: '1.25rem' }}
                            >
                                <i className="bi bi-exclamation-triangle-fill"></i>
                            </div>
                            <div>
                                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.15rem' }}>Konfirmasi Pemulihan (Restore)</h5>
                                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Ekstrak arsip kembali ke server</span>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={onClose} 
                            disabled={isRestoring}
                        ></button>
                    </div>

                    <div className="modal-body p-4">
                        {/* Warning Callout */}
                        <div 
                            className="p-3 rounded-3 mb-3.5 d-flex gap-2.5"
                            style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', fontSize: '0.82rem', lineHeight: 1.5 }}
                        >
                            <i className="bi bi-shield-exclamation fs-5 flex-shrink-0" style={{ color: '#d97706' }}></i>
                            <div>
                                <strong>PERHATIAN:</strong> Proses ini akan mengekstrak file arsip <code>{backup.filename}</code> dan <strong>menimpa file yang ada</strong> di folder server target. Sangat efektif untuk mengembalikan situs bersih dari serangan defacement atau script malware.
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.83rem' }}>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Situs Tujuan:</span>
                                <span className="fw-bold text-dark">{backup.site?.name}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Nama Arsip:</span>
                                <span className="font-monospace text-dark">{backup.filename}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Ukuran Arsip:</span>
                                <span className="fw-semibold text-dark">{backup.formatted_size}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">Path Remote:</span>
                                <span className="font-monospace text-muted text-truncate" style={{ maxWidth: '240px' }}>{backup.file_path}</span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-0 p-3.5 bg-light d-flex justify-content-between">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 1.25rem' }}
                            onClick={onClose}
                            disabled={isRestoring}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            className="btn btn-warning text-dark d-inline-flex align-items-center gap-2"
                            style={{
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                padding: '0.5rem 1.5rem',
                                border: 'none',
                                background: '#f59e0b',
                            }}
                            onClick={handleConfirmRestore}
                            disabled={isRestoring}
                        >
                            {isRestoring ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Mengekstrak Arsip via SSH...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-arrow-counterclockwise"></i> Ya, Pulihkan Sekarang
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
