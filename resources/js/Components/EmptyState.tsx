import React from 'react';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    colSpan?: number;
}

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    colSpan,
}: EmptyStateProps) {
    const content = (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center px-4" style={{ position: 'relative' }}>
            {/* Animated Glow Background & Decorative Rings */}
            <div className="mb-4 position-relative d-flex align-items-center justify-content-center">
                {/* Outer Glow Halo */}
                <div 
                    style={{ 
                        position: 'absolute', 
                        width: '130px', 
                        height: '130px', 
                        borderRadius: '50%', 
                        background: 'radial-gradient(circle, rgba(14,165,163,0.22) 0%, rgba(59,130,246,0.08) 55%, transparent 75%)',
                        filter: 'blur(12px)',
                    }} 
                />
                
                {/* Dashed Decorative Orbit Ring */}
                <div 
                    style={{
                        position: 'absolute',
                        width: '112px',
                        height: '112px',
                        borderRadius: '36px',
                        border: '1.5px dashed rgba(14,165,163,0.3)',
                        transform: 'rotate(12deg)'
                    }}
                />

                {/* Main Icon Container */}
                <div 
                    style={{ 
                        width: '88px', 
                        height: '88px', 
                        borderRadius: '28px', 
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,255,0.85))', 
                        border: '1px solid rgba(255,255,255,0.9)',
                        color: 'var(--teal-1)', 
                        fontSize: '2.5rem', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 16px 32px -8px rgba(14,165,163,0.2), inset 0 2px 4px rgba(255,255,255,0.9), 0 0 0 1px rgba(14,165,163,0.15)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        zIndex: 1,
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px) scale(1.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
                >
                    <i className={`bi ${icon}`} style={{ filter: 'drop-shadow(0 4px 6px rgba(14,165,163,0.25))' }}></i>
                </div>
            </div>

            {/* Typography */}
            <h5 style={{ fontWeight: 800, color: 'var(--ink)', margin: '0 0 0.5rem 0', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                {title}
            </h5>
            <p className="text-muted mb-4" style={{ maxWidth: '380px', fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--ink-soft)' }}>
                {description}
            </p>

            {/* Action Button */}
            {actionLabel && onAction && (
                <button 
                    className="btn btn-primary d-flex align-items-center gap-2" 
                    style={{ 
                        borderRadius: '14px', 
                        background: 'linear-gradient(135deg, var(--teal-1), #0284c7)', 
                        border: 'none', 
                        padding: '0.7rem 1.6rem', 
                        fontWeight: 600, 
                        fontSize: '0.875rem', 
                        boxShadow: '0 8px 22px -4px rgba(14,165,163,0.4)',
                        transition: 'all 0.25s ease'
                    }}
                    onClick={onAction}
                >
                    <i className="bi bi-plus-lg"></i> {actionLabel}
                </button>
            )}
        </div>
    );

    if (colSpan !== undefined) {
        return (
            <tr>
                <td colSpan={colSpan} className="text-center py-5">
                    {content}
                </td>
            </tr>
        );
    }

    return content;
}


