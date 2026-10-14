import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface KeyIndicator {
    label: string;
    badge: string;
    color: 'teal' | 'blue' | 'amber' | 'danger' | 'slate';
    desc: string;
}

export interface ColumnInfoTooltipProps {
    title: string;
    badgeText?: string;
    icon?: string;
    iconColor?: string;
    functionDescription: ReactNode;
    sourceDescription: ReactNode;
    formula?: string;
    indicators?: KeyIndicator[];
    notes?: string;
    className?: string;
}

export default function ColumnInfoTooltip({
    title,
    badgeText = 'PANDUAN KOLOM',
    icon = 'bi-info-circle-fill',
    iconColor = 'var(--teal-1, #0ea5a3)',
    functionDescription,
    sourceDescription,
    formula,
    indicators,
    notes,
    className = '',
}: ColumnInfoTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; arrowLeft: number; isTop: boolean }>({
        top: 0,
        left: 0,
        arrowLeft: 180,
        isTop: false,
    });

    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const popoverWidth = 380;
        const padding = 16;
        const margin = 10;

        // Ideal center
        const triggerCenter = rect.left + rect.width / 2;
        let left = triggerCenter - popoverWidth / 2;

        // Boundary clamp
        if (left < padding) {
            left = padding;
        } else if (left + popoverWidth > window.innerWidth - padding) {
            left = window.innerWidth - padding - popoverWidth;
        }

        const arrowLeft = Math.max(18, Math.min(popoverWidth - 18, triggerCenter - left));

        // Default: display below trigger
        let top = rect.bottom + margin;
        let isTop = false;

        // If overflowing bottom of window, flip to top
        const estimatedHeight = 360;
        if (top + estimatedHeight > window.innerHeight - padding && rect.top - estimatedHeight - margin > padding) {
            top = rect.top - estimatedHeight - margin;
            isTop = true;
        }

        setCoords({ top, left, arrowLeft, isTop });
    };

    useEffect(() => {
        if (!isOpen) return;

        updatePosition();
        const handleScrollOrResize = () => updatePosition();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    return (
        <span className={`d-inline-flex align-items-center ${className}`} style={{ verticalAlign: 'middle' }}>
            <button
                ref={triggerRef}
                type="button"
                className="btn btn-link p-0 ms-1 text-decoration-none border-0 shadow-none d-inline-flex align-items-center justify-content-center"
                style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    color: isOpen ? 'var(--teal-1, #0ea5a3)' : '#94a3b8',
                    background: isOpen ? 'rgba(14, 165, 163, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: isOpen ? 'scale(1.15)' : 'scale(1)',
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                }}
                title="Klik untuk panduan & sumber data kolom ini"
                aria-label={`Informasi kolom ${title}`}
                aria-expanded={isOpen}
            >
                <i className={`bi ${isOpen ? 'bi-info-circle-fill' : 'bi-info-circle'}`} style={{ fontSize: '0.84rem' }}></i>
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={popoverRef}
                    className="position-fixed shadow-lg"
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: '380px',
                        maxWidth: 'calc(100vw - 32px)',
                        zIndex: 9999,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '16px',
                        boxShadow: '0 20px 45px -10px rgba(15, 42, 63, 0.28), 0 0 0 1px rgba(14, 165, 163, 0.12)',
                        animation: 'infoPopoverPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        overflow: 'hidden',
                        textAlign: 'left',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <style>{`
                        @keyframes infoPopoverPop {
                            0% { opacity: 0; transform: translateY(-6px) scale(0.96); }
                            100% { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>

                    {/* Top Accent Gradient Border */}
                    <div 
                        style={{ 
                            height: '4px', 
                            background: 'linear-gradient(90deg, var(--teal-1, #0ea5a3), var(--blue-1, #0284c7), #38bdf8)' 
                        }} 
                    />

                    {/* Arrow Indicator Pointer */}
                    <div
                        style={{
                            position: 'absolute',
                            top: coords.isTop ? 'auto' : '-6px',
                            bottom: coords.isTop ? '-6px' : 'auto',
                            left: `${coords.arrowLeft}px`,
                            width: '12px',
                            height: '12px',
                            background: '#ffffff',
                            borderLeft: '1px solid #cbd5e1',
                            borderTop: coords.isTop ? 'none' : '1px solid #cbd5e1',
                            borderBottom: coords.isTop ? '1px solid #cbd5e1' : 'none',
                            transform: 'translateX(-50%) rotate(45deg)',
                            zIndex: 10,
                        }}
                    />

                    {/* Header */}
                    <div className="p-3 pb-2.5 border-bottom bg-light d-flex align-items-start justify-content-between gap-2">
                        <div className="d-flex align-items-center gap-2 min-w-0">
                            <div 
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'rgba(14, 165, 163, 0.12)',
                                    color: iconColor,
                                    fontSize: '1rem',
                                    border: '1px solid rgba(14, 165, 163, 0.25)',
                                }}
                            >
                                <i className={`bi ${icon}`}></i>
                            </div>
                            <div className="min-w-0">
                                <span 
                                    className="badge px-2 py-0.5 text-uppercase fw-bold mb-0.5" 
                                    style={{ 
                                        fontSize: '0.62rem', 
                                        letterSpacing: '0.04em',
                                        background: 'rgba(14, 165, 163, 0.1)', 
                                        color: 'var(--teal-1, #0ea5a3)',
                                        border: '1px solid rgba(14, 165, 163, 0.2)'
                                    }}
                                >
                                    {badgeText}
                                </span>
                                <h6 className="fw-bold text-dark m-0 text-truncate" style={{ fontSize: '0.88rem' }}>
                                    {title}
                                </h6>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn-close"
                            style={{ fontSize: '0.7rem', padding: '0.35rem' }}
                            onClick={() => setIsOpen(false)}
                            aria-label="Tutup"
                        />
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-3" style={{ maxHeight: '380px', overflowY: 'auto', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {/* Section 1: Fungsi Kolom */}
                        <div className="mb-3">
                            <div className="d-flex align-items-center gap-1.5 fw-bold text-dark mb-1" style={{ fontSize: '0.8rem' }}>
                                <i className="bi bi-question-circle-fill text-primary" style={{ fontSize: '0.85rem' }}></i>
                                <span>Apa Fungsi Kolom Ini?</span>
                            </div>
                            <div className="text-secondary ps-3 ms-1" style={{ borderLeft: '2px solid rgba(2, 132, 199, 0.3)' }}>
                                {functionDescription}
                            </div>
                        </div>

                        {/* Section 2: Sumber & Cara Dapat Nilai */}
                        <div className="mb-3">
                            <div className="d-flex align-items-center gap-1.5 fw-bold text-dark mb-1" style={{ fontSize: '0.8rem' }}>
                                <i className="bi bi-cpu-fill text-teal" style={{ color: 'var(--teal-1, #0ea5a3)', fontSize: '0.85rem' }}></i>
                                <span>Dari Mana Nilai Ini Diperoleh?</span>
                            </div>
                            <div className="text-secondary ps-3 ms-1" style={{ borderLeft: '2px solid rgba(14, 165, 163, 0.35)' }}>
                                {sourceDescription}

                                {formula && (
                                    <div 
                                        className="p-2 mt-2 rounded-2"
                                        style={{ 
                                            background: '#f8fafc', 
                                            border: '1px solid #e2e8f0', 
                                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                            fontSize: '0.74rem',
                                            color: '#0f2a3f',
                                        }}
                                    >
                                        <div className="text-muted fw-semibold mb-0.5" style={{ fontSize: '0.66rem', textTransform: 'uppercase' }}>
                                            Rumus / Metrik:
                                        </div>
                                        <strong>{formula}</strong>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Indikator & Ambang Batas (Optional) */}
                        {indicators && indicators.length > 0 && (
                            <div className="mb-2">
                                <div className="d-flex align-items-center gap-1.5 fw-bold text-dark mb-1.5" style={{ fontSize: '0.8rem' }}>
                                    <i className="bi bi-bar-chart-steps text-warning" style={{ fontSize: '0.85rem' }}></i>
                                    <span>Indikator Nilai & Standar:</span>
                                </div>
                                <div className="d-flex flex-column gap-1.5">
                                    {indicators.map((ind, i) => {
                                        const badgeBg = ind.color === 'teal' 
                                            ? 'rgba(14, 165, 163, 0.12)' 
                                            : ind.color === 'blue' 
                                            ? 'rgba(2, 132, 199, 0.12)' 
                                            : ind.color === 'amber' 
                                            ? 'rgba(245, 158, 11, 0.15)' 
                                            : ind.color === 'danger' 
                                            ? 'rgba(239, 68, 68, 0.15)' 
                                            : 'rgba(100, 116, 139, 0.12)';

                                        const badgeTextColor = ind.color === 'teal' 
                                            ? '#0f766e' 
                                            : ind.color === 'blue' 
                                            ? '#0369a1' 
                                            : ind.color === 'amber' 
                                            ? '#b45309' 
                                            : ind.color === 'danger' 
                                            ? '#b91c1c' 
                                            : '#475569';

                                        return (
                                            <div 
                                                key={i} 
                                                className="p-1.5 px-2 rounded-2 d-flex align-items-center justify-content-between gap-2"
                                                style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
                                            >
                                                <div className="d-flex align-items-center gap-1.5 min-w-0">
                                                    <span 
                                                        className="badge px-1.5 py-0.5 fw-bold flex-shrink-0"
                                                        style={{ background: badgeBg, color: badgeTextColor, fontSize: '0.68rem' }}
                                                    >
                                                        {ind.badge}
                                                    </span>
                                                    <span className="text-secondary text-truncate" style={{ fontSize: '0.74rem' }}>
                                                        {ind.desc}
                                                    </span>
                                                </div>
                                                <span className="fw-bold text-dark flex-shrink-0" style={{ fontSize: '0.72rem' }}>
                                                    {ind.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {notes && (
                            <div className="mt-2.5 pt-2 border-top text-muted d-flex align-items-center gap-1.5" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-info-circle text-teal"></i>
                                <span>{notes}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2 bg-light border-top d-flex align-items-center justify-content-between">
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            <i className="bi bi-shield-check text-success me-1"></i>
                            SIGAP Telemetry
                        </span>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm rounded-2 py-0.5 px-2.5 fw-semibold"
                            style={{ 
                                fontSize: '0.74rem',
                                background: 'linear-gradient(135deg, var(--teal-1, #0ea5a3), var(--blue-1, #0284c7))',
                                border: 'none'
                            }}
                            onClick={() => setIsOpen(false)}
                        >
                            Mengerti
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </span>
    );
}
