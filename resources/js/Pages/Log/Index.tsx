import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import '../../../css/detection.css';

import PageHeader from '@/Components/PageHeader';
import PopupLoader from '@/Components/PopupLoader';
import { toast } from '@/Components/DynamicToast';

import DetectionStatCards from './Partials/DetectionStatCards';
import DetectionToolbar from './Partials/DetectionToolbar';
import DetectionLogList, { DetectionLogItem } from './Partials/DetectionLogList';
import DetailLogModal from './Partials/DetailLogModal';

interface LogProps extends PageProps {
    logs: {
        data: DetectionLogItem[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        filter?: string;
        status?: string;
    };
    stats: {
        total_scanned: number;
        total_detections: number;
        drugs_category: number;
        gambling_category: number;
    };
    can?: {
        manageStatus?: boolean;
        markAllReviewed?: boolean;
    };
}

export default function DetectionLog({ 
    logs, 
    filters, 
    stats,
    can = { manageStatus: true, markAllReviewed: true }
}: LogProps) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [activeFilter, setActiveFilter] = useState(filters?.filter || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [selectedLog, setSelectedLog] = useState<DetectionLogItem | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Popup loader modal state
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Always keep URL address bar clean (mask query parameters like ?filter=judol&search=&status=all)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState(
                {}, 
                document.title, 
                window.location.pathname
            );
        }
    }, [logs, filters]);

    const executeFilter = (url: string, params: Record<string, any>, msg: string) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        router.get(url, params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 350 - elapsed);
                setTimeout(() => {
                    setIsFiltering(false);
                    setIsRefreshing(false);
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }, remaining);
            },
            onError: () => {
                setIsFiltering(false);
                setIsRefreshing(false);
            }
        });
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const msg = searchTerm.trim() ? `Mencari log "${searchTerm.trim()}"...` : 'Memuat data log deteksi...';
            executeFilter(route('logs.detection'), { search: searchTerm, filter: activeFilter, status: statusFilter }, msg);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        executeFilter(route('logs.detection'), { search: '', filter: activeFilter, status: statusFilter }, 'Memuat semua data log deteksi...');
    };

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        const categoryMap: Record<string, string> = {
            'all': 'semua deteksi keamanan',
            'judol': 'deteksi Judi Online',
            'obat': 'deteksi Obat Terlarang',
            'hidden': 'deteksi Teks Tersembunyi',
            'newpage': 'deteksi Halaman Baru',
            'uptime': 'log Uptime HTTP',
        };
        const msg = `Memuat ${categoryMap[filter] || filter}...`;
        executeFilter(route('logs.detection'), { search: searchTerm, filter, status: statusFilter }, msg);
    };

    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setStatusFilter(val);
        const statusTextMap: Record<string, string> = {
            'all': 'semua status log',
            'new': 'status Baru (Ditemukan)',
            'reviewed': 'status Ditinjau',
            'blocked': 'status Diblokir',
            'false_positive': 'status Bukan Spam',
        };
        executeFilter(route('logs.detection'), { search: searchTerm, filter: activeFilter, status: val }, `Memuat ${statusTextMap[val] || val}...`);
    };

    const handleUpdateStatus = (id: string, status: string) => {
        let actionMsg = 'Memperbarui status log...';
        if (status === 'blocked') actionMsg = 'Memblokir konten deteksi...';
        if (status === 'false_positive') actionMsg = 'Menandai sebagai bukan spam...';

        setLoaderMessage(actionMsg);
        setIsFiltering(true);

        router.patch(route('logs.detection.status', id), { status }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsFiltering(false);
                let actionText = 'diperbarui';
                if (status === 'blocked') actionText = 'diblokir';
                if (status === 'false_positive') actionText = 'ditandai sebagai bukan spam';
                toast.success('Berhasil', `Status log deteksi berhasil ${actionText}.`);
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            },
            onError: () => {
                setIsFiltering(false);
                toast.error('Gagal', 'Terjadi kesalahan saat memperbarui status.');
            }
        });
    };

    const handleMarkAllReviewed = () => {
        executeFilter(route('logs.detection.mark-all-reviewed'), {}, 'Menandai semua log baru sebagai telah ditinjau...');
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        executeFilter(route('logs.detection'), { search: searchTerm, filter: activeFilter, status: statusFilter }, 'Menyegarkan data log deteksi...');
    };

    const getCatBadge = (category: string) => {
        switch (category) {
            case 'judol': return <span className="cat-tag cat-judol">Judi Online</span>;
            case 'obat': return <span className="cat-tag cat-obat">Obat Terlarang</span>;
            case 'hidden': return <span className="cat-tag cat-hidden">Teks Tersembunyi</span>;
            case 'newpage': return <span className="cat-tag cat-newpage">Halaman Baru</span>;
            case 'uptime': return <span className="cat-tag" style={{ background: 'rgba(14,165,163,0.1)', color: '#0ea5a3', border: '1px solid rgba(14,165,163,0.3)' }}>Uptime HTTP</span>;
            default: return <span className="cat-tag">{category}</span>;
        }
    };

    const getIconInfo = (category: string) => {
        switch (category) {
            case 'judol': return { bg: 'linear-gradient(135deg,#ff7a6e,#ff9d6e)', icon: 'bi-dice-5' };
            case 'obat': return { bg: 'linear-gradient(135deg,var(--violet),#a78bfa)', icon: 'bi-capsule' };
            case 'hidden': return { bg: 'linear-gradient(135deg,var(--blue-1),var(--blue-2))', icon: 'bi-eye-slash' };
            case 'newpage': return { bg: 'linear-gradient(135deg,var(--teal-1),var(--teal-2))', icon: 'bi-file-earmark-plus' };
            case 'uptime': return { bg: 'linear-gradient(135deg,#38bdf8,#0284c7)', icon: 'bi-activity' };
            default: return { bg: 'linear-gradient(135deg,var(--ink-soft),var(--ink-faint))', icon: 'bi-bug' };
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': 
            case 'detected':
                return <span className="status-badge st-new d-inline-flex align-items-center gap-1" style={{ background: 'rgba(255, 122, 110, 0.15)', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.3)', padding: '0.3rem 0.65rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff4d4f', boxShadow: '0 0 6px #ff4d4f' }}></span> Ditemukan</span>;
            case 'reviewed': return <span className="status-badge st-reviewed" style={{ background: 'rgba(14, 165, 163, 0.15)', color: '#0ea5a3', border: '1px solid rgba(14,165,163,0.3)', padding: '0.3rem 0.65rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><i className="bi bi-check2-circle me-1"></i> Ditinjau</span>;
            case 'blocked': return <span className="status-badge st-blocked" style={{ background: 'rgba(139, 123, 240, 0.15)', color: '#8b7bf0', border: '1px solid rgba(139,123,240,0.3)', padding: '0.3rem 0.65rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><i className="bi bi-slash-circle me-1"></i> Diblokir</span>;
            case 'false_positive': return <span className="status-badge st-false" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#64748b', border: '1px solid rgba(100,116,139,0.3)', padding: '0.3rem 0.65rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><i className="bi bi-shield-x me-1"></i> Bukan Spam</span>;
            case 'resolved': return <span className="status-badge st-resolved" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.3rem 0.65rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><i className="bi bi-check-all me-1"></i> Telah Diatasi</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Log Deteksi Konten" />

            {/* Standard Reusable Page Header */}
            <PageHeader 
                title="Log Deteksi Konten"
                subtitle="Riwayat mesin pemindai mendeteksi sisipan kata kunci, tautan, dan konten mencurigakan."
                icon="bi-bug-fill"
            />

            {/* 4 Metric Stat Cards */}
            <DetectionStatCards stats={stats} />

            {/* Main Glass Card container */}
            <div className="glass-card">
                {/* Live Feed Header Bar & Filter Toolbar */}
                <DetectionToolbar 
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearchKeyDown={handleSearch}
                    onClearSearch={handleClearSearch}
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                    statusFilter={statusFilter}
                    onStatusFilterChange={handleStatusFilterChange}
                    onMarkAllReviewed={handleMarkAllReviewed}
                    canMarkAllReviewed={can?.markAllReviewed}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                />

                {/* Feed Items List & Pagination */}
                <DetectionLogList 
                    logs={logs}
                    canManageStatus={can?.manageStatus}
                    onSelectLog={(log) => {
                        setSelectedLog(log);
                        setShowModal(true);
                    }}
                    onUpdateStatus={handleUpdateStatus}
                    onPageChange={(page) => {
                        executeFilter(
                            route('logs.detection'),
                            { search: searchTerm, filter: activeFilter, status: statusFilter, page },
                            `Memuat halaman ${page}...`
                        );
                    }}
                    getCatBadge={getCatBadge}
                    getIconInfo={getIconInfo}
                    getStatusBadge={getStatusBadge}
                />
            </div>

            {/* Detail Log Modal with BaseModal */}
            <DetailLogModal
                showModal={showModal}
                setShowModal={setShowModal}
                selectedLog={selectedLog}
                canManageStatus={can?.manageStatus}
                handleUpdateStatus={handleUpdateStatus}
                getCatBadge={getCatBadge}
                getIconInfo={getIconInfo}
                getStatusBadge={getStatusBadge}
            />

            {/* Popup Loader Modal for Filters */}
            <PopupLoader 
                isOpen={isFiltering} 
                status="loading" 
                message={loaderMessage} 
                title="Sedang Memproses..."
            />
        </AuthenticatedLayout>
    );
}
