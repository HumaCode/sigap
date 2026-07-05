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
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="mb-4 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(14,165,163,0.1), rgba(59,130,246,0.1))', color: 'var(--teal-1)', fontSize: '2.5rem', boxShadow: 'inset 0 2px 6px rgba(14,165,163,0.08)' }}>
                <i className={`bi ${icon}`}></i>
            </div>
            <h5 style={{ fontWeight: 700, color: 'var(--ink)', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{title}</h5>
            <p className="text-muted mb-4" style={{ maxWidth: '320px', fontSize: '0.85rem', lineHeight: '1.6' }}>
                {description}
            </p>
            {actionLabel && onAction && (
                <button 
                    className="btn btn-primary d-flex align-items-center gap-2" 
                    style={{ borderRadius: '12px', background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', border: 'none', padding: '0.6rem 1.4rem', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 8px 16px rgba(14,165,163,0.25)' }}
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
