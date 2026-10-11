import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';
import PageHeader from '@/Components/PageHeader';
import PopupLoader from '@/Components/PopupLoader';
import AiRemediationModal from '@/Components/AiRemediationModal';
import '../../../css/security.css';

import { PaginationMeta, PaginationLink } from '@/Components/Pagination';
import SecurityStatCards from './Partials/SecurityStatCards';
import SecurityToolbar from './Partials/SecurityToolbar';
import SecurityList, { SecurityData } from './Partials/SecurityList';

interface IndexProps {
    securities: {
        data: SecurityData[];
        links?: PaginationLink[];
        meta?: PaginationMeta;
    };
    filters: {
        search?: string;
        filter?: string;
    };
    stats: {
        avg_score: number;
        env_exposed: number;
        csp_missing: number;
        ssl_warning: number;
    };
    can?: {
        scan?: boolean;
    };
}

export default function SecurityIndex({ 
    securities, 
    filters, 
    stats,
    can = { scan: true }
}: IndexProps) {
    const safeSecurities = securities || { data: [], meta: { current_page: 1, from: 0, to: 0, total: 0, last_page: 1, links: [] } };
    const safeFilters = Array.isArray(filters) ? {} : (filters || {});
    const safeStats = stats || { avg_score: 0, env_exposed: 0, csp_missing: 0, ssl_warning: 0 };

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [activeFilter, setActiveFilter] = useState(safeFilters.filter || 'all');
    const [isScanningAll, setIsScanningAll] = useState(false);

    // AI Remediation Modal state
    const [aiIncident, setAiIncident] = useState<any>(null);
    const [showAiModal, setShowAiModal] = useState(false);

    // Popup loader modal state
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    // URL parameter masking (hide queries like ?filter=critical&search= from address bar)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState(
                {}, 
                document.title, 
                window.location.pathname
            );
        }
    }, [securities, filters]);

    const executeFilter = (url: string, params: Record<string, any>, msg: string, isPost = false) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        const options = {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 400 - elapsed);
                setTimeout(() => {
                    setIsFiltering(false);
                    if (isPost) {
                        setIsScanningAll(false);
                    }
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }, remaining);
            },
            onError: () => {
                setIsFiltering(false);
                if (isPost) {
                    setIsScanningAll(false);
                    toast.error('Gagal', 'Terjadi kesalahan saat menjalankan pemindaian audit keamanan.');
                }
            }
        };

        if (isPost) {
            router.post(url, params, options);
        } else {
            router.get(url, params, options);
        }
    };

    // Debounced search
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchTerm !== (safeFilters.search || '')) {
                const msg = searchTerm.trim() ? `Mencari situs "${searchTerm.trim()}"...` : 'Memuat data audit keamanan...';
                executeFilter(route('security.index'), { search: searchTerm, filter: activeFilter }, msg);
            }
        }, 350);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const handleFilterChange = (filterType: string) => {
        setActiveFilter(filterType);
        const filterNameMap: Record<string, string> = {
            'all': 'semua laporan keamanan',
            'critical': 'temuan kritis (Grade F)',
            'warn': 'situs ada peringatan (Grade B & C)',
            'clean': 'situs aman (Grade A)'
        };
        executeFilter(route('security.index'), { search: searchTerm, filter: filterType }, `Memuat ${filterNameMap[filterType] || filterType}...`);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        executeFilter(route('security.index'), { search: '', filter: activeFilter }, 'Memuat semua laporan keamanan...');
    };

    const handleRefresh = () => {
        setSearchTerm('');
        setActiveFilter('all');
        executeFilter(route('security.index'), { search: '', filter: 'all' }, 'Menyegarkan data audit keamanan...');
    };

    const handleScanAll = () => {
        setIsScanningAll(true);
        executeFilter(route('security.scan'), {}, 'Memindai ulang keamanan seluruh situs...', true);
    };

    const handlePageChange = (page: number) => {
        executeFilter(
            route('security.index'),
            { search: searchTerm, filter: activeFilter, page },
            `Memuat halaman ${page}...`
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Keamanan Situs" />

            {/* Standard Page Header Component */}
            <PageHeader 
                title="Keamanan Situs"
                subtitle="Pemeriksaan header keamanan, berkas terekspos, dan sertifikat SSL seluruh situs."
                icon="bi-shield-check"
            >
                <button 
                    type="button"
                    className="btn btn-light shadow-sm d-flex align-items-center justify-content-center"
                    style={{ 
                        border: '1px solid var(--line)', 
                        color: 'var(--ink-soft)', 
                        background: 'rgba(255,255,255,0.8)', 
                        borderRadius: '12px', 
                        width: '42px', 
                        height: '42px',
                        cursor: 'pointer' 
                    }}
                    title="Segarkan Data & Reset Filter"
                    onClick={handleRefresh}
                    disabled={isFiltering}
                >
                    <i className={`bi bi-arrow-clockwise ${isFiltering ? 'spin' : ''}`} style={{ fontSize: '1.1rem' }}></i>
                </button>
            </PageHeader>

            {/* 4 Security Metric Stat Cards */}
            <SecurityStatCards stats={safeStats} />

            {/* Main Content Glass Card Container */}
            <div className="glass-card mb-4">
                {/* Grade Legend, Search & Filter Controls */}
                <SecurityToolbar 
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onClearSearch={handleClearSearch}
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                    onScanAll={handleScanAll}
                    isScanningAll={isScanningAll}
                    canScan={can?.scan}
                />

                {/* List View with Rows, Empty State, and Pagination */}
                <SecurityList 
                    securities={safeSecurities}
                    canScan={can?.scan}
                    onOpenAi={(incidentData) => {
                        setAiIncident(incidentData);
                        setShowAiModal(true);
                    }}
                    onScanAll={handleScanAll}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* AI Remediation Modal */}
            <AiRemediationModal 
                show={showAiModal}
                onClose={() => setShowAiModal(false)}
                incident={aiIncident}
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
