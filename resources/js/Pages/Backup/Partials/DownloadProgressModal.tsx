import React from 'react';

export interface DownloadProgressState {
    active: boolean;
    filename: string;
    loaded: number;
    total: number;
    percent: number;
    speed?: string;
    completed: boolean;
}

interface DownloadProgressModalProps {
    progress: DownloadProgressState;
    onCancel?: () => void;
    onClose?: () => void;
}

export default function DownloadProgressModal({ progress, onCancel, onClose }: DownloadProgressModalProps) {
    if (!progress.active) return null;

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes <= 0) return '0 MB';
        const mb = bytes / (1024 * 1024);
        return mb.toFixed(2) + ' MB';
    };

    return (
        <div 
            className="position-fixed"
            style={{
                bottom: '24px',
                right: '24px',
                zIndex: 1090,
                width: '380px',
                maxWidth: 'calc(100vw - 32px)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            <div 
                className="p-3.5 rounded-4 shadow-lg border"
                style={{
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(20px)',
                    borderColor: progress.completed ? '#86efac' : '#99f6e4',
                    boxShadow: '0 12px 36px rgba(15, 42, 63, 0.15)',
                }}
            >
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-2.5">
                    <div className="d-flex align-items-center gap-2 text-truncate" style={{ flex: 1, minWidth: 0 }}>
                        <div 
                            className="rounded-3 d-flex align-items-center justify-content-center text-white"
                            style={{
                                width: '36px',
                                height: '36px',
                                background: progress.completed
                                    ? 'linear-gradient(135deg, #10b981, #059669)'
                                    : 'linear-gradient(135deg, #0ea5a3, #0f2a3f)',
                                fontSize: '1.05rem',
                                flexShrink: 0,
                                boxShadow: '0 4px 10px rgba(14,165,163,0.2)',
                            }}
                        >
                            <i className={progress.completed ? 'bi bi-check-lg' : 'bi bi-cloud-arrow-down-fill'}></i>
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }} title={progress.filename}>
                                {progress.filename}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: progress.completed ? '#059669' : '#0ea5a3', fontWeight: 600 }}>
                                {progress.completed ? 'Unduhan Selesai' : 'Mengunduh via SFTP Stream...'}
                            </span>
                        </div>
                    </div>

                    {progress.completed ? (
                        <button 
                            type="button" 
                            className="btn-close" 
                            style={{ fontSize: '0.75rem' }} 
                            onClick={onClose}
                        ></button>
                    ) : (
                        <span 
                            className="badge" 
                            style={{ background: '#f0fdfa', color: '#0f766e', border: '1px solid #ccfbf1', fontSize: '0.78rem', fontWeight: 700 }}
                        >
                            {progress.percent}%
                        </span>
                    )}
                </div>

                {/* Progress Bar Container */}
                <div className="mb-2">
                    <div 
                        className="progress" 
                        style={{ height: '8px', borderRadius: '6px', background: '#e2e8f0', overflow: 'hidden' }}
                    >
                        <div 
                            className={`progress-bar progress-bar-striped ${!progress.completed ? 'progress-bar-animated' : ''}`}
                            role="progressbar"
                            style={{
                                width: `${progress.percent}%`,
                                background: progress.completed 
                                    ? 'linear-gradient(90deg, #10b981, #059669)' 
                                    : 'linear-gradient(90deg, #0ea5a3, #2563eb)',
                                transition: 'width 0.15s ease',
                            }}
                            aria-valuenow={progress.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        ></div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    <span>
                        <strong className="text-dark">{formatBytes(progress.loaded)}</strong>
                        {progress.total > 0 && ` / ${formatBytes(progress.total)}`}
                    </span>
                    {progress.speed && <span>{progress.speed}</span>}
                </div>
            </div>
        </div>
    );
}
