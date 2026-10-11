import React, { useEffect } from 'react';

export type ConfirmModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ConfirmModalProps {
    show: boolean;
    title?: string;
    message?: string;
    itemName?: string;
    itemDetails?: string;
    icon?: string;
    variant?: 'danger' | 'warning' | 'primary';
    size?: ConfirmModalSize;
    maxWidth?: string;
    confirmText?: string;
    cancelText?: string;
    warningTitle?: string;
    warningPoints?: string[];
    onConfirm: () => void;
    onCancel: () => void;
    isProcessing?: boolean;
}

export default function ConfirmModal({
    show,
    title = 'Konfirmasi Hapus',
    message,
    itemName,
    itemDetails,
    icon = 'bi bi-trash3-fill',
    variant = 'danger',
    size = 'xl',
    maxWidth,
    confirmText = 'Ya, Hapus Data',
    cancelText = 'Batal',
    warningTitle,
    warningPoints,
    onConfirm,
    onCancel,
    isProcessing = false
}: ConfirmModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && show && !isProcessing) {
                onCancel();
            }
        };

        if (show) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [show, isProcessing, onCancel]);

    if (!show) return null;

    const sizeMap: Record<ConfirmModalSize, string> = {
        sm: '420px',
        md: '520px',
        lg: '600px',
        xl: '680px',
    };

    const dialogMaxWidth = maxWidth || sizeMap[size];

    const variantStyles = {
        danger: {
            accentColor: '#ef4444',
            gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            iconBg: 'rgba(239, 68, 68, 0.12)',
            glowBg: 'rgba(239, 68, 68, 0.25)',
            btnBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
            btnShadow: '0 8px 22px -4px rgba(239, 68, 68, 0.45)',
            badgeBg: 'rgba(239, 68, 68, 0.09)',
            badgeColor: '#dc2626',
            badgeText: 'Tindakan Kritis & Permanen',
            alertBg: 'rgba(239, 68, 68, 0.05)',
            alertBorder: 'rgba(239, 68, 68, 0.16)',
            alertColor: '#b91c1c',
            alertIcon: 'bi bi-shield-exclamation',
            defaultWarningTitle: 'Konsekuensi & dampak penghapusan:'
        },
        warning: {
            accentColor: '#f59e0b',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            iconBg: 'rgba(245, 158, 11, 0.12)',
            glowBg: 'rgba(245, 158, 11, 0.25)',
            btnBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
            btnShadow: '0 8px 22px -4px rgba(245, 158, 11, 0.45)',
            badgeBg: 'rgba(245, 158, 11, 0.09)',
            badgeColor: '#d97706',
            badgeText: 'Peringatan Sistem',
            alertBg: 'rgba(245, 158, 11, 0.06)',
            alertBorder: 'rgba(245, 158, 11, 0.22)',
            alertColor: '#b45309',
            alertIcon: 'bi bi-exclamation-triangle-fill',
            defaultWarningTitle: 'Informasi penonaktifan:'
        },
        primary: {
            accentColor: '#0ea5a3',
            gradient: 'linear-gradient(135deg, #0ea5a3 0%, #0d9488 100%)',
            iconBg: 'rgba(14, 165, 163, 0.12)',
            glowBg: 'rgba(14, 165, 163, 0.25)',
            btnBg: 'linear-gradient(135deg, #0ea5a3, #0d9488)',
            btnShadow: '0 8px 22px -4px rgba(14, 165, 163, 0.45)',
            badgeBg: 'rgba(14, 165, 163, 0.09)',
            badgeColor: '#0ea5a3',
            badgeText: 'Konfirmasi Aksi',
            alertBg: 'rgba(14, 165, 163, 0.06)',
            alertBorder: 'rgba(14, 165, 163, 0.2)',
            alertColor: '#0f766e',
            alertIcon: 'bi bi-info-circle-fill',
            defaultWarningTitle: 'Informasi & dampak aktivasi:'
        }
    }[variant];

    return (
        <div 
            className="modal fade show d-block" 
            tabIndex={-1} 
            role="dialog"
            aria-modal="true"
            style={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.65)', 
                backdropFilter: 'blur(8px)', 
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 1070 
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !isProcessing) {
                    onCancel();
                }
            }}
        >
            <div 
                className="modal-dialog modal-dialog-centered" 
                style={{ maxWidth: dialogMaxWidth, width: '92%' }}
            >
                <div 
                    className="modal-content border-0" 
                    style={{ 
                        borderRadius: '26px', 
                        overflow: 'hidden', 
                        background: '#ffffff',
                        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
                        animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                >
                    {/* Top Decorative Ambient Bar */}
                    <div 
                        style={{ 
                            height: '6px', 
                            width: '100%', 
                            background: variantStyles.gradient 
                        }} 
                    />

                    {/* Modal Body & Interactive Content */}
                    <div className="p-4 p-md-5 text-center position-relative">
                        
                        {/* Close button top right */}
                        <button 
                            type="button" 
                            className="btn-close" 
                            style={{ 
                                position: 'absolute', 
                                top: '1.4rem', 
                                right: '1.4rem', 
                                opacity: 0.5,
                                fontSize: '0.88rem' 
                            }} 
                            onClick={onCancel} 
                            disabled={isProcessing}
                            aria-label="Batal"
                        />

                        {/* Pulsing Animated Icon Container */}
                        <div className="d-flex justify-content-center mb-3">
                            <div 
                                className="position-relative d-flex align-items-center justify-content-center"
                                style={{ width: '80px', height: '80px' }}
                            >
                                {/* Background Aura Pulse */}
                                <div 
                                    className="position-absolute w-100 h-100 rounded-circle"
                                    style={{ 
                                        background: variantStyles.glowBg,
                                        animation: 'pulseHalo 2s infinite ease-in-out'
                                    }} 
                                />

                                {/* Main Inner Circle */}
                                <div 
                                    className="d-flex align-items-center justify-content-center rounded-circle position-relative"
                                    style={{ 
                                        width: '66px', 
                                        height: '66px', 
                                        background: variantStyles.iconBg,
                                        color: variantStyles.accentColor,
                                        fontSize: '1.9rem',
                                        boxShadow: `0 8px 24px -4px ${variantStyles.glowBg}`
                                    }}
                                >
                                    <i className={icon} />
                                </div>
                            </div>
                        </div>

                        {/* Badge Tag */}
                        <div className="mb-2">
                            <span 
                                className="badge px-3 py-1 rounded-pill"
                                style={{ 
                                    background: variantStyles.badgeBg, 
                                    color: variantStyles.badgeColor,
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.5px',
                                    border: `1px solid ${variantStyles.glowBg}`
                                }}
                            >
                                {variantStyles.badgeText}
                            </span>
                        </div>

                        {/* Title */}
                        <h4 
                            className="fw-bold mb-2.5" 
                            style={{ 
                                color: 'var(--ink, #0f2a3f)', 
                                fontSize: '1.42rem', 
                                fontFamily: 'Poppins, sans-serif',
                                letterSpacing: '-0.01em'
                            }}
                        >
                            {title}
                        </h4>

                        {/* Item Preview Card (If Item Name is available) */}
                        {itemName && (
                            <div 
                                className="p-3 my-3 text-start rounded-4"
                                style={{ 
                                    background: '#f8fafc', 
                                    border: '1.5px dashed rgba(15, 42, 63, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.85rem'
                                }}
                            >
                                <div 
                                    style={{ 
                                        width: '42px', 
                                        height: '42px', 
                                        borderRadius: '12px', 
                                        background: '#ffffff',
                                        border: '1px solid rgba(15, 42, 63, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: variantStyles.accentColor,
                                        fontSize: '1.25rem',
                                        flexShrink: 0,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}
                                >
                                    <i className="bi bi-hdd-network" />
                                </div>
                                <div className="min-w-0 flex-grow-1">
                                    <div 
                                        className="fw-bold text-truncate" 
                                        style={{ color: 'var(--ink, #0f2a3f)', fontSize: '0.98rem' }}
                                    >
                                        {itemName}
                                    </div>
                                    {itemDetails && (
                                        <div 
                                            className="text-muted text-truncate" 
                                            style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}
                                        >
                                            {itemDetails}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Main Description Message */}
                        {message && (
                            <p 
                                className="mb-3.5 text-secondary" 
                                style={{ 
                                    fontSize: '0.9rem', 
                                    lineHeight: '1.6',
                                    color: '#64748b' 
                                }}
                            >
                                {message}
                            </p>
                        )}

                        {/* Warning Points Checklist */}
                        {warningPoints && warningPoints.length > 0 && (
                            <div 
                                className="p-3.5 mb-3 text-start rounded-4"
                                style={{ 
                                    background: variantStyles.alertBg, 
                                    border: `1px solid ${variantStyles.alertBorder}`,
                                    fontSize: '0.82rem',
                                    color: variantStyles.alertColor
                                }}
                            >
                                <div className="fw-semibold mb-2 d-flex align-items-center gap-1.5" style={{ fontSize: '0.85rem' }}>
                                    <i className={variantStyles.alertIcon} style={{ fontSize: '1rem' }} />
                                    <span>{warningTitle || variantStyles.defaultWarningTitle}</span>
                                </div>
                                <ul className="m-0 ps-3" style={{ lineHeight: '1.55' }}>
                                    {warningPoints.map((pt, i) => (
                                        <li key={i} className="my-0.5">{pt}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="d-flex align-items-center gap-3 mt-4 pt-1">
                            <button 
                                type="button" 
                                className="btn btn-light flex-grow-1" 
                                style={{ 
                                    borderRadius: '14px', 
                                    padding: '0.75rem 1.4rem', 
                                    fontWeight: 600, 
                                    fontSize: '0.9rem',
                                    color: '#64748b', 
                                    background: '#f1f5f9', 
                                    border: '1px solid #e2e8f0',
                                    transition: 'all 0.2s'
                                }} 
                                onClick={onCancel} 
                                disabled={isProcessing}
                            >
                                {cancelText}
                            </button>

                            <button 
                                type="button" 
                                className="btn d-inline-flex align-items-center justify-content-center gap-2 flex-grow-1 text-white" 
                                style={{ 
                                    borderRadius: '14px', 
                                    background: variantStyles.btnBg, 
                                    boxShadow: variantStyles.btnShadow,
                                    border: 'none', 
                                    padding: '0.75rem 1.5rem', 
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                }} 
                                onClick={onConfirm} 
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                        <span>Menghapus...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2-circle" />
                                        <span>{confirmText}</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* Micro Keyframe Animations */}
            <style>{`
                @keyframes pulseHalo {
                    0%, 100% {
                        transform: scale(0.95);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.15);
                        opacity: 0.9;
                    }
                }
                @keyframes modalSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(18px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
