import React from 'react';

interface ConfirmModalProps {
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isProcessing?: boolean;
}

export default function ConfirmModal({ show, title, message, onConfirm, onCancel, isProcessing = false }: ConfirmModalProps) {
    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(15,42,63,0.6)', zIndex: 1070, backdropFilter: 'blur(5px)' }} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-sm" style={{ maxWidth: '400px' }}>
                <div className="modal-content" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
                    <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '2rem 1.5rem 1.5rem', color: 'white', textAlign: 'center', position: 'relative' }}>
                        <button type="button" className="btn-close btn-close-white" style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.8 }} onClick={onCancel} disabled={isProcessing}></button>
                        <div style={{ width: '65px', height: '65px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 1rem auto', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}>
                            <i className="bi bi-exclamation-triangle"></i>
                        </div>
                        <h5 style={{ fontWeight: 800, margin: 0, fontSize: '1.25rem', letterSpacing: '0.5px' }}>{title}</h5>
                    </div>
                    <div className="modal-body p-4 text-center" style={{ background: '#f8fafc', color: 'var(--ink-dark)' }}>
                        <p style={{ fontSize: '0.95rem', marginBottom: 0, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                            {message}
                        </p>
                    </div>
                    <div className="modal-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '1.2rem', background: 'white', display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                        <button type="button" className="btn btn-light w-100" style={{ borderRadius: '12px', padding: '0.7rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: 'none' }} onClick={onCancel} disabled={isProcessing}>Batal</button>
                        <button type="button" className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '12px', background: '#dc2626', border: 'none', padding: '0.7rem', fontWeight: 600 }} onClick={onConfirm} disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Memproses...
                                </>
                            ) : (
                                "Ya, Hapus"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
