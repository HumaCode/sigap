import React, { ReactNode, useEffect } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface BaseModalProps {
    show: boolean;
    onClose: () => void;
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: string | ReactNode;
    size?: ModalSize;
    headerGradient?: string;
    children: ReactNode;
    footer?: ReactNode;
    bodyClassName?: string;
    maxWidth?: string;
}

export default function BaseModal({
    show,
    onClose,
    title,
    subtitle,
    icon,
    size = 'lg',
    headerGradient = 'linear-gradient(135deg, #0ea5a3, #0f2a3f)',
    children,
    footer,
    bodyClassName = 'p-4',
    maxWidth
}: BaseModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && show) {
                onClose();
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
    }, [show, onClose]);

    if (!show) return null;

    const sizeClassMap: Record<ModalSize, string> = {
        sm: 'modal-sm',
        md: 'modal-md',
        lg: 'modal-lg',
        xl: 'modal-xl',
        xxl: 'modal-xxl',
    };

    const defaultMaxWidthMap: Record<ModalSize, string> = {
        sm: '400px',
        md: '540px',
        lg: '800px',
        xl: '960px',
        xxl: '1100px',
    };

    const dialogMaxWidth = maxWidth || defaultMaxWidthMap[size];

    return (
        <div 
            className="modal fade show d-block" 
            tabIndex={-1} 
            role="dialog"
            aria-modal="true"
            style={{ 
                backgroundColor: 'rgba(15, 42, 63, 0.55)', 
                backdropFilter: 'blur(8px)', 
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 1060 
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div 
                className={`modal-dialog ${sizeClassMap[size]} modal-dialog-centered modal-dialog-scrollable`}
                style={{ maxWidth: dialogMaxWidth }}
            >
                <div 
                    className="modal-content border-0 shadow-lg" 
                    style={{ borderRadius: '24px', overflow: 'hidden', background: '#ffffff' }}
                >
                    {/* Consistent Modern Header */}
                    <div 
                        className="modal-header border-0 px-4 pt-4 pb-3" 
                        style={{ 
                            background: headerGradient, 
                            color: '#ffffff',
                            position: 'relative'
                        }}
                    >
                        <div className="d-flex align-items-center gap-3">
                            {icon && (
                                <div 
                                    style={{
                                        width: '46px', 
                                        height: '46px', 
                                        borderRadius: '14px',
                                        background: 'rgba(255, 255, 255, 0.16)', 
                                        backdropFilter: 'blur(4px)',
                                        WebkitBackdropFilter: 'blur(4px)',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '1.4rem',
                                        flexShrink: 0,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }}
                                >
                                    {typeof icon === 'string' ? <i className={icon}></i> : icon}
                                </div>
                            )}
                            <div>
                                <h5 
                                    className="modal-title fw-bold m-0" 
                                    style={{ 
                                        fontSize: '1.22rem', 
                                        fontFamily: 'Poppins, sans-serif',
                                        letterSpacing: '-0.01em'
                                    }}
                                >
                                    {title}
                                </h5>
                                {subtitle && (
                                    <p 
                                        className="m-0 opacity-80" 
                                        style={{ fontSize: '0.82rem', marginTop: '0.2rem', lineHeight: 1.35 }}
                                    >
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={onClose}
                            aria-label="Tutup"
                            style={{ opacity: 0.85, transition: 'opacity 0.2s' }}
                        />
                    </div>

                    {/* Modal Body */}
                    <div 
                        className={`modal-body ${bodyClassName}`}
                        style={{ background: '#f8fafc', maxHeight: '72vh', overflowY: 'auto' }}
                    >
                        {children}
                    </div>

                    {/* Modal Footer (if provided) */}
                    {footer && (
                        <div 
                            className="modal-footer border-top px-4 py-3 bg-white" 
                            style={{ borderColor: 'rgba(15, 42, 63, 0.08)' }}
                        >
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
