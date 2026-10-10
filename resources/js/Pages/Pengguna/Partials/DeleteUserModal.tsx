import React from 'react';
import { router } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';

interface DeleteUserModalProps {
    show: boolean;
    onClose: () => void;
    user: any | null;
}

export default function DeleteUserModal({ show, onClose, user }: DeleteUserModalProps) {
    if (!show || !user) return null;

    const handleDelete = () => {
        router.delete(route('users.destroy', user.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Berhasil', `Akun pengguna "${user.name}" telah dihapus.`);
                onClose();
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0];
                toast.error('Gagal Menghapus', typeof firstErr === 'string' ? firstErr : 'Terjadi kesalahan sistem.');
                onClose();
            }
        });
    };

    return (
        <div 
            className="modal fade show d-block" 
            style={{ backgroundColor: 'rgba(15, 42, 63, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
            tabIndex={-1}
        >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    
                    {/* Header */}
                    <div className="modal-header border-0 px-4 pt-4 pb-2" style={{ background: 'linear-gradient(135deg, #ef4444, #991b1b)', color: '#fff' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.3rem'
                            }}>
                                <i className="bi bi-exclamation-triangle-fill"></i>
                            </div>
                            <div>
                                <h5 className="modal-title fw-bold m-0" style={{ fontSize: '1.15rem', fontFamily: 'Poppins, sans-serif' }}>
                                    Hapus Pengguna
                                </h5>
                                <p className="m-0 opacity-75" style={{ fontSize: '0.78rem' }}>
                                    Konfirmasi penghapusan akses akun
                                </p>
                            </div>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    {/* Body */}
                    <div className="modal-body p-4 text-center" style={{ background: '#f8fafc' }}>
                        <p className="text-secondary mb-3" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                            Apakah Anda yakin ingin menghapus akun pengguna <strong>"{user.name}"</strong> (<span className="text-muted">@{user.username}</span>)?
                        </p>
                        <div className="p-3 mb-2 rounded-3 text-start" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.78rem', color: '#b91c1c' }}>
                            <i className="bi bi-info-circle-fill me-1"></i> Tindakan ini permanen dan akan mencabut seluruh izin peran (RBAC) pengguna tersebut.
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer border-top px-4 py-3 bg-white d-flex justify-content-between align-items-center">
                        <button
                            type="button"
                            className="btn btn-light"
                            style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500 }}
                            onClick={onClose}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger px-4 shadow-sm"
                            style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, background: '#ef4444', borderColor: '#ef4444' }}
                            onClick={handleDelete}
                        >
                            <i className="bi bi-trash3 me-1"></i>
                            <span>Ya, Hapus Pengguna</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
