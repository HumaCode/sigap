import React, { useState, useEffect, useRef } from 'react';
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
    filters: { search?: string; status?: string; type?: string; site_id?: string };
    sites?: any[];
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

export default function Index({ incidents, filters, sites = [], stats, can }: IncidentProps) {
    const safeIncidents = incidents || { data: [], links: [], meta: { total: 0, last_page: 1 } };
    const safeData = safeIncidents.data || [];
    const safeFilters = filters || {};

    const [siteFilter, setSiteFilter] = useState(safeFilters.site_id || 'all');
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

    const searchQueryRef = useRef(safeFilters.search || '');
    const siteFilterRef = useRef(safeFilters.site_id || 'all');
    const statusFilterRef = useRef(safeFilters.status || 'all');
    const isMounted = useRef(false);

    // Helper untuk menjaga URL browser SELALU bersih (/incidents) tanpa query string
    const cleanBrowserUrl = () => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState(window.history.state, '', window.location.pathname);
        }
    };

    // Bersihkan URL saat initial mount dan pasang router listener
    useEffect(() => {
        cleanBrowserUrl();

        const removeNavigateListener = router.on('navigate', () => {
            cleanBrowserUrl();
        });

        const removeFinishListener = router.on('finish', () => {
            cleanBrowserUrl();
        });

        return () => {
            removeNavigateListener();
            removeFinishListener();
        };
    }, []);

    // Jalankan juga saat props incidents atau filters berubah
    useEffect(() => {
        cleanBrowserUrl();
    }, [incidents, filters]);

    // Sinkronisasi state internal saat props berubah
    useEffect(() => {
        if (safeFilters.search !== undefined) {
            setSearchTerm(safeFilters.search || '');
            searchQueryRef.current = safeFilters.search || '';
        }
        if (safeFilters.site_id !== undefined) {
            setSiteFilter(safeFilters.site_id || 'all');
            siteFilterRef.current = safeFilters.site_id || 'all';
        }
        if (safeFilters.status !== undefined) {
            setStatusFilter(safeFilters.status || 'all');
            statusFilterRef.current = safeFilters.status || 'all';
        }
    }, [safeFilters.search, safeFilters.site_id, safeFilters.status]);

    const executeFilter = (url: string, params: Record<string, any>, msg: string, isPost = false) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        const options = {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: (page: any) => {
                cleanBrowserUrl();
                if (isPost) {
                    const successMsg = page?.props?.flash?.success || 'Seluruh insiden aktif berhasil ditandai sebagai selesai.';
                    toast.success('Berhasil', successMsg);
                }
            },
            onFinish: () => {
                cleanBrowserUrl();
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 350 - elapsed);
                setTimeout(() => {
                    cleanBrowserUrl();
                    setIsFiltering(false);
                }, remaining);
            },
            onError: (errors: any) => {
                cleanBrowserUrl();
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

    // Debounced search (menunggu ketikan berhenti 350ms sebelum request)
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const delayDebounce = setTimeout(() => {
            if (searchTerm !== searchQueryRef.current) {
                searchQueryRef.current = searchTerm;
                const msg = searchTerm.trim() ? `Mencari insiden "${searchTerm.trim()}"...` : 'Memuat data insiden...';
                executeFilter(
                    route('incidents.index'),
                    { site_id: siteFilterRef.current, search: searchTerm.trim(), status: statusFilterRef.current, page: 1 },
                    msg
                );
            }
        }, 350);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const handleSiteFilterChange = (siteId: string) => {
        setSiteFilter(siteId);
        siteFilterRef.current = siteId;
        const targetSite = (sites || []).find((s: any) => s.id === siteId);
        const msg = siteId && siteId !== 'all'
            ? `Memfilter insiden "${targetSite?.name || 'Situs'}"...`
            : 'Memuat insiden seluruh situs...';
        executeFilter(
            route('incidents.index'),
            { site_id: siteId, search: searchQueryRef.current, status: statusFilterRef.current, page: 1 },
            msg
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchQueryRef.current = searchTerm;
            const msg = searchTerm.trim() ? `Mencari insiden "${searchTerm.trim()}"...` : 'Memuat data insiden...';
            executeFilter(
                route('incidents.index'),
                { site_id: siteFilterRef.current, search: searchTerm.trim(), status: statusFilterRef.current, page: 1 },
                msg
            );
        }
    };

    const handleClearSearch = () => {
        searchQueryRef.current = '';
        setSearchTerm('');
        executeFilter(
            route('incidents.index'),
            { site_id: siteFilterRef.current, search: '', status: statusFilterRef.current, page: 1 },
            'Memuat semua data insiden...'
        );
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        statusFilterRef.current = status;
        const statusMap: Record<string, string> = {
            all: 'semua insiden',
            critical: 'insiden Kritis',
            open: 'insiden Terbuka',
            investigating: 'insiden Dalam Peninjauan',
            resolved: 'insiden Selesai',
        };
        executeFilter(
            route('incidents.index'),
            { site_id: siteFilterRef.current, search: searchQueryRef.current, status, page: 1 },
            `Memuat ${statusMap[status] || status}...`
        );
    };

    const handleReset = () => {
        searchQueryRef.current = '';
        siteFilterRef.current = 'all';
        statusFilterRef.current = 'all';
        setSiteFilter('all');
        setSearchTerm('');
        setStatusFilter('all');
        executeFilter(route('incidents.index'), { site_id: 'all', search: '', status: 'all', page: 1 }, 'Mereset filter insiden...');
    };

    const handleExportCsv = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (siteFilter && siteFilter !== 'all') params.append('site_id', siteFilter);

        window.location.href = `${route('incidents.export')}?${params.toString()}`;
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
                    sites={sites}
                    selectedSiteId={siteFilter}
                    onSiteChange={handleSiteFilterChange}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearchKeyDown={handleSearchKeyDown}
                    onClearSearch={handleClearSearch}
                    statusFilter={statusFilter}
                    onStatusFilterChange={handleStatusFilterChange}
                    onReset={handleReset}
                    onExportCsv={handleExportCsv}
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
                    onPageChange={(page) => {
                        executeFilter(
                            route('incidents.index'),
                            { site_id: siteFilterRef.current, search: searchQueryRef.current, status: statusFilterRef.current, page },
                            `Memuat halaman ${page}...`
                        );
                    }}
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
