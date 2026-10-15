import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PageHeader from '@/Components/PageHeader';
import PopupLoader from '@/Components/PopupLoader';

import ScorecardSummaryCards from './Partials/ScorecardSummaryCards';
import ScorecardPodium from './Partials/ScorecardPodium';
import ScorecardToolbar from './Partials/ScorecardToolbar';
import ScorecardTable from './Partials/ScorecardTable';
import ScorecardDetailModal from './Partials/ScorecardDetailModal';
import OfficialScorecardPrint from './Partials/OfficialScorecardPrint';

interface ScorecardProps extends PageProps {
    leaderboard: any[];
    summary: {
        total_sites: number;
        avg_score: number;
        compliance_percentage: number;
        podium: any[];
        grade_counts: {
            A_plus: number;
            A: number;
            B: number;
            C: number;
            D: number;
        };
    };
    categories: string[];
    filters: {
        search?: string;
        category?: string;
    };
    can?: {
        export?: boolean;
    };
}

export default function Index({ leaderboard, summary, categories = [], filters, can = { export: true } }: ScorecardProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Loader state
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Memuat data rapor...');

    // Clean address bar URL parameters
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [leaderboard, filters]);

    const executeFilter = (url: string, params: Record<string, any>, msg: string) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        router.get(url, params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 300 - elapsed);
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
            const msg = searchTerm.trim() ? `Mencari rapor "${searchTerm.trim()}"...` : 'Memuat data rapor...';
            executeFilter(route('scorecard.index'), { search: searchTerm, category: categoryFilter }, msg);
        }
    };

    const handleCategoryChange = (cat: string) => {
        setCategoryFilter(cat);
        const msg = cat === 'all' ? 'Memuat seluruh kategori situs...' : `Memuat kategori ${cat}...`;
        executeFilter(route('scorecard.index'), { search: searchTerm, category: cat }, msg);
    };

    const handleReset = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        executeFilter(route('scorecard.index'), {}, 'Mereset filter rapor mutu...');
    };

    const handleExportCsv = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);

        window.location.href = `${route('scorecard.export')}?${params.toString()}`;
    };

    const handlePrint = () => {
        if (typeof document !== 'undefined') {
            document.querySelectorAll('.sigap-print-document').forEach(el => el.classList.remove('sigap-print-active'));
            const target = document.getElementById('print-scorecard-document');
            if (target) {
                target.classList.add('sigap-print-active');
            }
        }
        window.print();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Rapor Mutu & Scorecard Website" />

            <PageHeader
                title="Rapor Mutu & Scorecard Website"
                subtitle="Sistem penilaian otomatis ketersediaan layanan SLA (40%), standar keamanan SSL/Port (30%), dan riwayat bebas insiden siber (30%)."
                icon="bi-award-fill"
            />

            {/* Executive KPI Summary Cards */}
            <ScorecardSummaryCards summary={summary} />

            {/* Top 3 Champion Podium */}
            <ScorecardPodium
                podium={summary.podium}
                onSelectSite={(site) => {
                    setSelectedSite(site);
                    setShowDetailModal(true);
                }}
            />

            {/* Action & Filter Toolbar */}
            <ScorecardToolbar
                search={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchKeyDown={handleSearch}
                category={categoryFilter}
                onCategoryChange={handleCategoryChange}
                categories={categories}
                onReset={handleReset}
                onExportCsv={handleExportCsv}
                onPrint={handlePrint}
                canExport={can?.export}
            />

            {/* Full Leaderboard Table */}
            <ScorecardTable
                leaderboard={leaderboard}
                onSelectSite={(site) => {
                    setSelectedSite(site);
                    setShowDetailModal(true);
                }}
            />

            {/* Transparent Calculation Detail Modal */}
            <ScorecardDetailModal
                show={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedSite(null);
                }}
                site={selectedSite}
            />

            {/* Official Government Print Document (Visible on Print) */}
            <OfficialScorecardPrint
                leaderboard={leaderboard}
                summary={summary}
                filters={filters}
            />

            {/* Popup Loader Modal */}
            <PopupLoader
                isOpen={isFiltering}
                status="loading"
                message={loaderMessage}
            />
        </AuthenticatedLayout>
    );
}
