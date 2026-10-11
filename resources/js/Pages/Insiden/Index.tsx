import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import Pagination from '@/Components/Pagination';
import PopupLoader from '@/Components/PopupLoader';
import AiRemediationModal from '@/Components/AiRemediationModal';
import DetailIncidentModal from './Partials/DetailIncidentModal';
import ConfirmModal from '@/Components/ConfirmModal';
import { toast } from '@/Components/DynamicToast';
import IncidentHeader from './Partials/IncidentHeader';
import IncidentStatCards from './Partials/IncidentStatCards';
import IncidentToolbar from './Partials/IncidentToolbar';
import IncidentList from './Partials/IncidentList';

interface IncidentProps extends PageProps {
    incidents: { data: any[]; links: any[]; meta: any };
    filters: { search?: string; status?: string; type?: string };
    stats: {
        total: number;
        critical: number;
        resolved: number;
        open: number;
        investigating?: number;
        active?: number;
    };
    can?: {
        resolveAll?: boolean;
        create?: boolean;
        update?: boolean;
        delete?: boolean;
    };
}

export default function Index({ incidents, filters, stats, can }: IncidentProps) {
    const safeIncidents = incidents || { data: [], links: [], meta: { total: 0, last_page: 1 } };
    const safeData = safeIncidents.data || [];
    const safeFilters = filters || {};

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(safeFilters.status || 'all');
    const [selectedIncident, setSelectedIncident] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // AI Remediation Modal State
    const [aiIncident, setAiIncident] = useState<any>(null);
    const [showAiModal, setShowAiModal] = useState(false);

    // Popup loader modal state
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    // Custom Styled Confirmation Modal State
    const [showResolveConfirm, setShowResolveConfirm] = useState(false);

    // URL parameter masking (hide queries like ?status=critical&search= from address bar)
    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }, [incidents, filters]);

    const executeFilter = (url: string, params: Record<string, any>, msg: string, isPost = false) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        const options = {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: (page: any) => {
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                if (isPost) {
                    const successMsg = page?.props?.flash?.success || 'Seluruh insiden aktif berhasil ditandai sebagai selesai.';
                    toast.success('Berhasil', successMsg);
                }
            },
            onFinish: () => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 400 - elapsed);
                setTimeout(() => {
                    setIsFiltering(false);
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }, remaining);
            },
            onError: (errors: any) => {
                setIsFiltering(false);
                toast.error('Gagal', 'Terjadi kesalahan saat memproses permintaan.');
            },
        };

        if (isPost) {
            router.post(url, params, options);
        } else {
            router.get(url, params, options);
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const msg = searchTerm.trim() ? `Mencari insiden "${searchTerm.trim()}"...` : 'Memuat data insiden...';
            executeFilter(route('incidents.index'), { search: searchTerm, status: statusFilter }, msg);
        }
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        const statusMap: Record<string, string> = {
            all: 'semua insiden',
            critical: 'insiden Kritis',
            open: 'insiden Terbuka',
            investigating: 'insiden Dalam Peninjauan',
            resolved: 'insiden Selesai',
        };
        executeFilter(
            route('incidents.index'),
            { search: searchTerm, status },
            `Memuat ${statusMap[status] || status}...`
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        executeFilter(route('incidents.index'), {}, 'Mereset filter insiden...');
    };

    const handleMarkAllResolved = () => {
        setShowResolveConfirm(true);
    };

    const confirmMarkAllResolved = () => {
        setShowResolveConfirm(false);
        executeFilter(
            route('incidents.mark-all-resolved'),
            {},
            'Menandai seluruh insiden aktif sebagai selesai...',
            true
        );
    };

    const openDetail = (incident: any) => {
        setSelectedIncident(incident);
        setShowDetailModal(true);
    };

    const openAiRemediation = (e: React.MouseEvent, incident: any) => {
        e.stopPropagation();
        setAiIncident(incident);
        setShowAiModal(true);
    };

    const activeCount = stats.active ?? (stats.total - stats.resolved);

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Insiden" />

            <style>{`
                .incident-main-card {
                    background: #ffffff;
                    border: 1px solid rgba(15, 42, 63, 0.08);
                    border-radius: 22px;
                    box-shadow: 0 14px 35px -12px rgba(15, 42, 63, 0.08);
                    overflow: hidden;
                }
            `}</style>

            {/* Header */}
            <IncidentHeader
                activeCount={activeCount}
                canResolveAll={can?.resolveAll ?? true}
                onMarkAllResolved={handleMarkAllResolved}
            />

            {/* Stat Cards */}
            <IncidentStatCards
                stats={stats}
                activeFilter={statusFilter}
                onFilterClick={handleStatusFilterChange}
            />

            {/* Main Content Card with Toolbar & List */}
            <div className="incident-main-card mb-4">
                <IncidentToolbar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearchKeyDown={handleSearchKeyDown}
                    statusFilter={statusFilter}
                    onStatusFilterChange={handleStatusFilterChange}
                    onReset={handleReset}
                />

                <IncidentList
                    incidents={safeData}
                    onOpenDetail={openDetail}
                    onOpenAi={openAiRemediation}
                />

                {/* Pagination */}
                <Pagination
                    meta={safeIncidents.meta}
                    links={safeIncidents.links}
                    itemLabel="insiden"
                />
            </div>

            {/* Modals */}
            <DetailIncidentModal
                show={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                incident={selectedIncident}
                onOpenAi={(inc) => {
                    setShowDetailModal(false);
                    setAiIncident(inc);
                    setShowAiModal(true);
                }}
            />

            <AiRemediationModal
                show={showAiModal}
                onClose={() => setShowAiModal(false)}
                incident={aiIncident}
            />

            {/* Custom Styled Confirmation Modal */}
            <ConfirmModal
                show={showResolveConfirm}
                title="Tandai Semua Selesai?"
                icon="bi bi-check2-all"
                variant="primary"
                size="lg"
                itemName={`${activeCount} Insiden Aktif`}
                itemDetails="Seluruh insiden yang berstatus Terbuka, Ditinjau, atau Kritis"
                message="Apakah Anda yakin ingin menandai seluruh insiden aktif sebagai selesai? Seluruh insiden keamanan yang belum terselesaikan akan diubah statusnya menjadi Selesai (Resolved)."
                confirmText="Ya, Tandai Selesai"
                cancelText="Batal"
                warningTitle="PANDUAN PENYELESAIAN INSIDEN:"
                warningPoints={[
                    'Pastikan langkah mitigasi atau perbaikan pada server/situs telah selesai dilakukan.',
                    'Status seluruh insiden aktif akan dialihkan ke status Selesai.',
                    'Seluruh riwayat konsultasi AI dan catatan log deteksi tetap tersimpan rapi di database.'
                ]}
                onConfirm={confirmMarkAllResolved}
                onCancel={() => setShowResolveConfirm(false)}
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
