import React, { useState, useEffect } from 'react';
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
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Loader modal state for filtering
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    const rangeTextMap: Record<string, string> = {
        '24h': '24 Jam',
        '7d': '7 Hari',
        '30d': '30 Hari',
        '90d': '90 Hari',
    };

    // Always keep URL address bar clean (mask query parameters)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [sites, filters]);

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
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }, remaining);
            },
            onError: () => {
                setIsFiltering(false);
            }
        });
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const msg = searchTerm.trim() ? `Mencari situs "${searchTerm.trim()}"...` : 'Memuat data Laporan Uptime...';
            executeFilter(route('reports.uptime'), { search: searchTerm, category: categoryFilter, range: rangeFilter }, msg);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        executeFilter(route('reports.uptime'), { search: '', category: categoryFilter, range: rangeFilter }, 'Memuat semua data laporan...');
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setCategoryFilter(value);
        const msg = value === 'Semua Kategori Situs' ? 'Memuat semua kategori situs...' : `Memuat kategori ${value}...`;
        executeFilter(route('reports.uptime'), { search: searchTerm, category: value, range: rangeFilter }, msg);
    };

    const handleRangeChange = (range: string) => {
        setRangeFilter(range);
        const label = rangeTextMap[range] || range;
        executeFilter(route('reports.uptime'), { search: searchTerm, category: categoryFilter, range }, `Memuat laporan periode ${label}...`);
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
                canExport={can?.export}
                onExportPdf={handlePrintOverall}
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
                onSelectSite={(site) => {
                    setSelectedSite(site);
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
                onClose={() => { setShowDetailModal(false); setSelectedSite(null); }}
                site={selectedSite}
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
