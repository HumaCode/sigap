import React from 'react';
import Pagination, { PaginationLink, PaginationMeta } from '@/Components/Pagination';
import Tooltip from '@/Components/Tooltip';

export interface BackupItem {
    id: string;
    site_id: string;
    filename: string;
    file_path: string;
    file_size: number;
    formatted_size?: string;
    backup_type: 'manual' | 'scheduled' | 'pre_mitigation' | string;
    status: 'completed' | 'running' | 'failed' | 'restoring' | 'restored' | string;
    notes?: string;
    created_at: string;
    restored_at?: string;
    site?: {
        id: string;
        name: string;
        url: string;
    };
    creator?: {
        id: string;
        name: string;
    };
}

interface BackupTableProps {
    backups: {
        data: BackupItem[];
        links?: PaginationLink[];
        meta?: PaginationMeta;
    };
    onDownload: (item: BackupItem) => void;
    onRestore: (item: BackupItem) => void;
    onDelete: (item: BackupItem) => void;
    onPageChange: (page: number) => void;
    onOpenCreateModal: () => void;
}

export default function BackupTable({
    backups,
    onDownload,
    onRestore,
    onDelete,
    onPageChange,
    onOpenCreateModal,
}: BackupTableProps) {
    const data = backups.data || [];

    const formatSize = (bytes: number) => {
        if (!bytes || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const p = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        return (bytes / Math.pow(1024, p)).toFixed(2) + ' ' + units[p];
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '-';
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }) + ' WIB';
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'scheduled':
                return <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.72rem', borderRadius: '6px' }}><i className="bi bi-clock me-1"></i>Otomatis</span>;
            case 'pre_mitigation':
                return <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.72rem', borderRadius: '6px' }}><i className="bi bi-shield-shaded me-1"></i>Pre-Mitigasi</span>;
            default:
                return <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', borderRadius: '6px' }}><i className="bi bi-hand-index me-1"></i>Manual</span>;
        }
    };

    const getStatusBadge = (status: string, restoredAt?: string) => {
        switch (status) {
            case 'restored':
                return (
                    <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.72rem', borderRadius: '6px' }}>
                        <i className="bi bi-arrow-counterclockwise me-1"></i>Dipulihkan
                    </span>
                );
            case 'failed':
                return (
                    <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.72rem', borderRadius: '6px' }}>
                        <i className="bi bi-x-circle me-1"></i>Gagal
                    </span>
                );
            default:
                return (
                    <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', borderRadius: '6px' }}>
                        <i className="bi bi-check-circle me-1"></i>Tersimpan
                    </span>
                );
        }
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-5">
                <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: '64px', height: '64px', background: 'rgba(14,165,163,0.1)', color: '#0ea5a3', fontSize: '1.8rem' }}
                >
                    <i className="bi bi-archive"></i>
                </div>
                <h6 style={{ fontWeight: 700, color: '#0f2a3f', marginBottom: '0.35rem' }}>Belum Ada Arsip Cadangan</h6>
                <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                    Cadangkan file website penting Anda ke arsip terkompresi .tar.gz untuk perlindungan dari defacement atau kehilangan data.
                </p>
                <button 
                    type="button" 
                    className="btn btn-primary d-inline-flex align-items-center gap-2"
                    style={{ background: 'var(--teal-1, #0ea5a3)', borderColor: 'var(--teal-1, #0ea5a3)', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}
                    onClick={onOpenCreateModal}
                >
                    <i className="bi bi-plus-circle"></i> Buat Cadangan Pertama
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="table-responsive">
                <table className="table align-middle" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <th style={{ background: 'transparent', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 1rem' }}>Situs</th>
                            <th style={{ background: 'transparent', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 1rem' }}>File Arsip & Lokasi</th>
                            <th style={{ background: 'transparent', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 1rem' }}>Tipe</th>
                            <th style={{ background: 'transparent', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 1rem' }}>Ukuran</th>
                            <th style={{ background: 'transparent', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 1rem' }}>Tanggal Dibuat</th>
                            <th style={{ background: 'transparent', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 1rem' }}>Status</th>
                            <th style={{ background: 'transparent', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 1rem', textAlign: 'end' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr 
                                key={item.id}
                                style={{
                                    background: '#ffffff',
                                    boxShadow: '0 2px 6px rgba(15,42,63,0.03)',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {/* Site */}
                                <td style={{ padding: '0.9rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', borderRadius: '12px 0 0 12px' }}>
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center text-white"
                                            style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)', fontSize: '0.95rem', flexShrink: 0 }}
                                        >
                                            <i className="bi bi-globe2"></i>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f2a3f' }}>
                                                {item.site?.name || 'Situs'}
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {item.site?.url}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* File & Path */}
                                <td style={{ padding: '0.9rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.83rem', color: '#1e293b' }}>
                                        <i className="bi bi-file-earmark-zip me-1.5" style={{ color: '#0ea5a3' }}></i>
                                        {item.filename}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }} className="text-truncate" title={item.file_path}>
                                        <i className="bi bi-folder2 me-1"></i>{item.file_path}
                                    </div>
                                    {item.notes && (
                                        <div style={{ fontSize: '0.73rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                            "{item.notes}"
                                        </div>
                                    )}
                                </td>

                                {/* Type */}
                                <td style={{ padding: '0.9rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                    {getTypeBadge(item.backup_type)}
                                </td>

                                {/* Size */}
                                <td style={{ padding: '0.9rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#334155' }}>
                                        {item.formatted_size || formatSize(item.file_size)}
                                    </span>
                                </td>

                                {/* Date */}
                                <td style={{ padding: '0.9rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                                        {formatDate(item.created_at)}
                                    </span>
                                    {item.creator && (
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                            oleh {item.creator.name}
                                        </div>
                                    )}
                                </td>

                                {/* Status */}
                                <td style={{ padding: '0.9rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                    {getStatusBadge(item.status, item.restored_at)}
                                </td>

                                {/* Actions */}
                                <td style={{ padding: '0.9rem 1rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderRadius: '0 12px 12px 0', textAlign: 'end' }}>
                                    <div className="d-inline-flex align-items-center gap-1.5 justify-content-end">
                                        {/* Download */}
                                        <Tooltip
                                            title="Unduh Arsip"
                                            description="Unduh file backup ke komputer lokal"
                                            variant="blue"
                                        >
                                            <button
                                                type="button"
                                                className="action-btn edit"
                                                onClick={() => onDownload(item)}
                                            >
                                                <i className="bi bi-download"></i>
                                            </button>
                                        </Tooltip>

                                        {/* Restore */}
                                        <Tooltip
                                            title="Pulihkan Situs"
                                            description="Restore file direktori ke kondisi ini"
                                            variant="warning"
                                        >
                                            <button
                                                type="button"
                                                className="action-btn warning"
                                                onClick={() => onRestore(item)}
                                            >
                                                <i className="bi bi-arrow-counterclockwise"></i>
                                            </button>
                                        </Tooltip>

                                        {/* Delete */}
                                        <Tooltip
                                            title="Hapus Arsip"
                                            description="Hapus arsip backup permanen"
                                            variant="danger"
                                        >
                                            <button
                                                type="button"
                                                className="action-btn danger"
                                                onClick={() => onDelete(item)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </Tooltip>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {backups.meta && backups.meta.total > 0 && (
                <div className="mt-3">
                    <Pagination 
                        links={backups.links} 
                        meta={backups.meta} 
                        itemLabel="arsip" 
                        onPageChange={onPageChange} 
                    />
                </div>
            )}
        </div>
    );
}
