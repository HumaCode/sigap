import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import '../../../css/laporan.css';
import '../../../css/report-print.css';

import PageHeader from '@/Components/PageHeader';
import PopupLoader from '@/Components/PopupLoader';
import EmptyState from '@/Components/EmptyState';

import ReportToolbar from './Partials/ReportToolbar';
import SlaSummaryCards from './Partials/SlaSummaryCards';
import ApexUptimeChart from './Partials/ApexUptimeChart';
import ReportList from './Partials/ReportList';
import DetailReportModal from './Partials/DetailReportModal';
import OfficialPrintDocument from './Partials/OfficialPrintDocument';

interface LaporanProps extends PageProps {
    sites: { 
        data: any[]; 
        links?: any[]; 
        meta?: {
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            total: number;
        }; 
    };
    filters: { search?: string; category?: string; range?: string };
    stats: any;
    can?: {
        export?: boolean;
        viewDetail?: boolean;
    };
}

export default function LaporanUptime({ 
    sites, 
    filters, 
    stats, 
    can = { export: true, viewDetail: true } 
    }: LaporanProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'Semua Kategori Situs');
    const [rangeFilter, setRangeFilter] = useState(filters.range || '7d');
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [selectedDay, setSelectedDay] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Loader modal state for filtering
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    const searchQueryRef = useRef(filters.search || '');
    const categoryRef = useRef(filters.category || 'Semua Kategori Situs');
    const rangeRef = useRef(filters.range || '7d');
    const isMounted = useRef(false);

    const rangeTextMap: Record<string, string> = {
        '24h': '24 Jam',
        '7d': '7 Hari',
        '30d': '30 Hari',
        '90d': '90 Hari',
    };

    // Helper untuk menjaga URL browser SELALU bersih (/uptime-reports) tanpa query string
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

    // Jalankan juga saat props sites atau filters berubah
    useEffect(() => {
        cleanBrowserUrl();
    }, [sites, filters]);

    // Sinkronisasi state internal saat props berubah
    useEffect(() => {
        if (filters.search !== undefined) {
            setSearchTerm(filters.search || '');
            searchQueryRef.current = filters.search || '';
        }
        if (filters.category !== undefined) {
            setCategoryFilter(filters.category || 'Semua Kategori Situs');
            categoryRef.current = filters.category || 'Semua Kategori Situs';
        }
        if (filters.range !== undefined) {
            setRangeFilter(filters.range || '7d');
            rangeRef.current = filters.range || '7d';
        }
    }, [filters.search, filters.category, filters.range]);

    const executeFilter = (url: string, params: Record<string, any>, msg: string) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        router.get(url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                cleanBrowserUrl();
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
            onError: () => {
                cleanBrowserUrl();
                setIsFiltering(false);
            }
        });
    };

    // Debounced Search Effect (menunggu ketikan selesai 350ms sebelum request)
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const delayDebounce = setTimeout(() => {
            if (searchTerm !== searchQueryRef.current) {
                searchQueryRef.current = searchTerm;
                const msg = searchTerm.trim() ? `Mencari situs "${searchTerm.trim()}"...` : 'Memuat data Laporan Uptime...';
                executeFilter(
                    route('reports.uptime'),
                    { search: searchTerm.trim(), category: categoryRef.current, range: rangeRef.current, page: 1 },
                    msg
                );
            }
        }, 350);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchQueryRef.current = searchTerm;
            const msg = searchTerm.trim() ? `Mencari situs "${searchTerm.trim()}"...` : 'Memuat data Laporan Uptime...';
            executeFilter(route('reports.uptime'), { search: searchTerm.trim(), category: categoryFilter, range: rangeFilter, page: 1 }, msg);
        }
    };

    const handleClearSearch = () => {
        searchQueryRef.current = '';
        setSearchTerm('');
        executeFilter(
            route('reports.uptime'),
            { search: '', category: categoryFilter, range: rangeFilter, page: 1 },
            'Memuat semua data laporan...'
        );
    };

    const handleReset = () => {
        searchQueryRef.current = '';
        setSearchTerm('');
        setCategoryFilter('Semua Kategori Situs');
        categoryRef.current = 'Semua Kategori Situs';
        setRangeFilter('7d');
        rangeRef.current = '7d';
        executeFilter(
            route('reports.uptime'),
            { search: '', category: 'Semua Kategori Situs', range: '7d', page: 1 },
            'Mereset filter laporan uptime...'
        );
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setCategoryFilter(value);
        categoryRef.current = value;
        const msg = value === 'Semua Kategori Situs' ? 'Memuat semua kategori situs...' : `Memuat kategori ${value}...`;
        executeFilter(route('reports.uptime'), { search: searchTerm.trim(), category: value, range: rangeFilter, page: 1 }, msg);
    };

    const handleRangeChange = (range: string) => {
        setRangeFilter(range);
        rangeRef.current = range;
        const label = rangeTextMap[range] || range;
        executeFilter(route('reports.uptime'), { search: searchTerm.trim(), category: categoryFilter, range, page: 1 }, `Memuat laporan periode ${label}...`);
    };

    const handlePrintOverall = () => {
        if (typeof document !== 'undefined') {
            document.querySelectorAll('.sigap-print-document').forEach(el => el.classList.remove('sigap-print-active'));
            const target = document.getElementById('print-overall-report');
            if (target) {
                target.classList.add('sigap-print-active');
            }
        }
        window.print();
    };

    const handleExportCsv = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter && categoryFilter !== 'Semua Kategori Situs') params.append('category', categoryFilter);
        if (rangeFilter) params.append('range', rangeFilter);

        window.location.href = `${route('reports.uptime.export')}?${params.toString()}`;
    };

    const hasActiveFilters = Boolean(
        (searchTerm && searchTerm.trim() !== '') || 
        (categoryFilter && categoryFilter !== 'Semua Kategori Situs') || 
        (rangeFilter && rangeFilter !== '7d')
    );

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Uptime" />

            <PageHeader 
                title="Laporan Uptime"
                subtitle="Ringkasan performa ketersediaan seluruh situs terpantau berdasarkan periode."
                icon="bi-graph-up-arrow"
            />

            {/* Filter and Action Toolbar */}
            <ReportToolbar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchKeyDown={handleSearch}
                onClearSearch={handleClearSearch}
                rangeFilter={rangeFilter}
                onRangeChange={handleRangeChange}
                categoryFilter={categoryFilter}
                onCategoryChange={handleCategoryChange}
                onReset={handleReset}
                hasActiveFilters={hasActiveFilters}
                canExport={can?.export}
                onExportPdf={handlePrintOverall}
                onExportCsv={handleExportCsv}
            />

            {/* SLA KPI Summary Cards */}
            <SlaSummaryCards stats={stats} />

            {/* Realtime Overall Trend Chart */}
            <div className="glass-card section-card mb-3">
                <div className="section-head">
                    <div>
                        <h6>Tren Uptime Keseluruhan</h6>
                        <span className="muted">Rata-rata harian dibanding target SLA</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                        <span className="legend-dot" style={{ background: 'var(--teal-1)' }}></span>Uptime aktual
                        <span className="legend-dot ms-3" style={{ background: 'var(--ink-faint)' }}></span>Target SLA (99.5%)
                    </div>
                </div>
                {stats.total_sites > 0 ? (
                    <div className="py-2">
                        <ApexUptimeChart avgUptime={stats.avg_uptime} />
                    </div>
                ) : (
                    <EmptyState
                        icon="bi-graph-up"
                        title="Belum Ada Data Tren Uptime"
                        description="Grafik tren ketersediaan akan muncul setelah Anda menambahkan minimal satu website terpantau."
                    />
                )}
            </div>

            {/* Per-site Detailed Report List & Pagination */}
            <ReportList 
                sites={sites}
                totalSites={stats.total_sites}
                canViewDetail={can?.viewDetail}
                onSelectSite={(site, dayMeta) => {
                    setSelectedSite(site);
                    setSelectedDay(dayMeta || null);
                    setShowDetailModal(true);
                }}
                onPageChange={(page) => {
                    executeFilter(
                        route('reports.uptime'),
                        { search: searchTerm, category: categoryFilter, range: rangeFilter, page },
                        `Memuat halaman ${page}...`
                    );
                }}
            />

            {/* Modal Detail Uptime Per-Site */}
            <DetailReportModal 
                show={showDetailModal}
                onClose={() => { 
                    setShowDetailModal(false); 
                    setSelectedSite(null); 
                    setSelectedDay(null); 
                }}
                site={selectedSite}
                initialDay={selectedDay}
            />

            {/* Popup Loader Modal */}
            <PopupLoader 
                isOpen={isFiltering} 
                status="loading" 
                message={loaderMessage} 
            />

            {/* Official Government Print Document (Visible when Printing / Exporting to PDF) */}
            {!showDetailModal && (
                <OfficialPrintDocument 
                    type="all" 
                    sites={sites.data} 
                    stats={stats} 
                    filters={filters} 
                />
            )}

        </AuthenticatedLayout>
    );
}
