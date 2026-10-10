import React from 'react';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import Tooltip from '@/Components/Tooltip';

export interface DetectionLogItem {
    id: string;
    title: string;
    category: string;
    context: string;
    url_path?: string;
    status: string;
    source?: string;
    created_at?: string;
    site?: {
        id?: string;
        name?: string;
        url?: string;
    };
    [key: string]: any;
}

interface DetectionLogListProps {
    logs: {
        data: DetectionLogItem[];
        links?: any[];
        meta?: {
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            total: number;
        };
    };
    canManageStatus?: boolean;
    onSelectLog: (log: DetectionLogItem) => void;
    onUpdateStatus: (id: string, status: string) => void;
    onPageChange: (page: number) => void;
    getCatBadge: (category: string) => React.ReactNode;
    getIconInfo: (category: string) => { bg: string; icon: string };
    getStatusBadge: (status: string) => React.ReactNode;
}

export default function DetectionLogList({
    logs,
    canManageStatus = true,
    onSelectLog,
    onUpdateStatus,
    onPageChange,
    getCatBadge,
    getIconInfo,
    getStatusBadge,
}: DetectionLogListProps) {
    return (
        <div>
            {/* Feed items list */}
            <div>
                {logs.data.length > 0 ? (
                    logs.data.map((log) => {
                        const iconData = getIconInfo(log.category);
                        return (
                            <div key={log.id} className="log-item">
                                <div className="log-icon" style={{ background: iconData.bg }}>
                                    <i className={`bi ${iconData.icon}`}></i>
                                </div>
                                
                                <div className="flex-grow-1 min-w-0">
                                    <p className="log-title">
                                        {log.title} {getCatBadge(log.category)}
                                    </p>
                                    <div 
                                        className="log-context" 
                                        dangerouslySetInnerHTML={{ __html: log.context }}
                                    ></div>
                                    <div className="log-meta">
                                        <span><i className="bi bi-globe2"></i> {log.site?.name || 'Situs Tidak Diketahui'}</span>
                                        <span><i className="bi bi-link-45deg"></i> {log.url_path || '/'}</span>
                                        <span><i className="bi bi-clock"></i> {log.created_at}</span>
                                    </div>
                                </div>

                                <div className="log-right">
                                    {getStatusBadge(log.status)}
                                    <div className="log-actions">
                                        {canManageStatus && (
                                            <>
                                                <Tooltip title="Blokir Konten" description="Blokir otomatis konten berbahaya" variant="danger">
                                                    <button 
                                                        type="button"
                                                        onClick={() => onUpdateStatus(log.id, 'blocked')} 
                                                        className="mini-action"
                                                    >
                                                        <i className="bi bi-slash-circle"></i>
                                                    </button>
                                                </Tooltip>

                                                <Tooltip title="Bukan Spam" description="Tandai aman (False positive)" variant="teal">
                                                    <button 
                                                        type="button"
                                                        onClick={() => onUpdateStatus(log.id, 'false_positive')} 
                                                        className="mini-action"
                                                    >
                                                        <i className="bi bi-flag"></i>
                                                    </button>
                                                </Tooltip>
                                            </>
                                        )}

                                        <Tooltip title="Lihat Detail" description="Inspeksi detail dan konteks" variant="blue">
                                            <button 
                                                type="button"
                                                onClick={() => onSelectLog(log)} 
                                                className="mini-action"
                                            >
                                                <i className="bi bi-eye"></i>
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <EmptyState 
                        icon="bi-receipt-cutoff"
                        title="Belum Ada Log Deteksi"
                        description="Riwayat log pemindaian konten masih kosong. Seluruh aktivitas deteksi sisipan konten mencurigakan akan muncul di sini."
                    />
                )}
            </div>

            {/* Standard Pagination Component */}
            <div className="pt-3 px-3" style={{ borderTop: '1px solid var(--line)' }}>
                <Pagination 
                    meta={logs.meta} 
                    links={logs.links}
                    itemLabel="log deteksi" 
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
}
