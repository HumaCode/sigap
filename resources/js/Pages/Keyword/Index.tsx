import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import '../../../css/keyword.css';

import PageHeader from '@/Components/PageHeader';
import PopupLoader from '@/Components/PopupLoader';
import ConfirmModal from '@/Components/ConfirmModal';
import { toast } from '@/Components/DynamicToast';

import KeywordStatCards from './Partials/KeywordStatCards';
import KeywordToolbar from './Partials/KeywordToolbar';
import KeywordTable, { KeywordItem } from './Partials/KeywordTable';
import KeywordModal from './Partials/KeywordModal';
import DeleteKeywordModal from './Partials/DeleteKeywordModal';
import ToggleKeywordModal from './Partials/ToggleKeywordModal';

interface KeywordProps extends PageProps {
    keywords: {
        data: KeywordItem[];
        meta: any;
        links?: any[];
    };
    filters: {
        search?: string;
        filter?: string;
    };
    stats: {
        total: number;
        judol: number;
        obat: number;
        regex: number;
    };
    can?: {
        create?: boolean;
        edit?: boolean;
        delete?: boolean;
    };
}

export default function KeywordIndex({ 
    keywords, 
    filters, 
    stats,
    can = { create: true, edit: true, delete: true }
}: KeywordProps) {
    const safeKeywords = keywords || { data: [], meta: { links: [], last_page: 1, current_page: 1, from: 0, to: 0, total: 0 } };
    const safeFilters = Array.isArray(filters) ? {} : (filters || {});
    const safeStats = stats || { total: 0, judol: 0, obat: 0, regex: 0 };

    const [searchTerm, setSearchTerm] = useState(safeFilters?.search || '');
    const [activeFilter, setActiveFilter] = useState(safeFilters?.filter || 'all');
    const [showModal, setShowModal] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState<KeywordItem | null>(null);
    const [keywordToDelete, setKeywordToDelete] = useState<KeywordItem | null>(null);
    const [keywordToToggle, setKeywordToToggle] = useState<KeywordItem | null>(null);

    // Popup loader modal state
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    // Always keep URL address bar clean (mask query parameters like ?filter=judol&search=)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState(
                {}, 
                document.title, 
                window.location.pathname
            );
        }
    }, [keywords, filters]);

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

    // Debounced Search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchTerm !== (safeFilters?.search || '')) {
                const msg = searchTerm.trim() ? `Mencari kata kunci "${searchTerm.trim()}"...` : 'Memuat kamus kata kunci...';
                executeFilter(route('keywords.index'), { search: searchTerm, filter: activeFilter }, msg);
            }
        }, 350);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        const catMap: Record<string, string> = {
            'all': 'semua kata kunci',
            'judol': 'kategori Judi Online',
            'obat': 'kategori Obat Terlarang',
            'hidden': 'kategori Teks Tersembunyi',
            'newpage': 'kategori Halaman Baru',
            'phising': 'kategori Phising',
        };
        executeFilter(route('keywords.index'), { search: searchTerm, filter }, `Memuat ${catMap[filter] || filter}...`);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        executeFilter(route('keywords.index'), { search: '', filter: activeFilter }, 'Memuat semua data kata kunci...');
    };

    const handleAdd = () => {
        setSelectedKeyword(null);
        setShowModal(true);
    };

    const handleEdit = (keyword: KeywordItem) => {
        setSelectedKeyword(keyword);
        setShowModal(true);
    };

    const handleToggleStatus = (keyword: KeywordItem) => {
        setKeywordToToggle(keyword);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kamus Kata Kunci" />

            {/* Standard Page Header */}
            <PageHeader 
                title="Kamus Kata Kunci"
                subtitle="Kelola daftar kata kunci & pola yang digunakan mesin deteksi sisipan konten."
                icon="bi-journal-text"
            />

            {/* 4 Metric Stat Cards */}
            <KeywordStatCards stats={safeStats} />

            {/* Main Glass Card Container */}
            <div className="glass-card mb-4">
                {/* Search, Filter Chips, and Add Button */}
                <KeywordToolbar 
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onClearSearch={handleClearSearch}
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                    canCreate={can?.create}
                    onAdd={handleAdd}
                />

                {/* Table View & Pagination */}
                <KeywordTable 
                    keywords={safeKeywords}
                    canEdit={can?.edit}
                    canDelete={can?.delete}
                    onEdit={handleEdit}
                    onDelete={(kw) => setKeywordToDelete(kw)}
                    onToggleStatus={handleToggleStatus}
                    onAdd={handleAdd}
                    onPageChange={(page) => {
                        executeFilter(
                            route('keywords.index'),
                            { search: searchTerm, filter: activeFilter, page },
                            `Memuat halaman ${page}...`
                        );
                    }}
                />
            </div>

            {/* Add / Edit Keyword Modal */}
            <KeywordModal 
                show={showModal} 
                onClose={() => { setShowModal(false); setSelectedKeyword(null); }} 
                keyword={selectedKeyword} 
            />

            {/* Delete Confirmation Modal */}
            <DeleteKeywordModal 
                show={!!keywordToDelete}
                onClose={() => setKeywordToDelete(null)}
                keyword={keywordToDelete}
            />

            {/* Status Toggle Confirmation Modal */}
            <ToggleKeywordModal 
                show={!!keywordToToggle}
                onClose={() => setKeywordToToggle(null)}
                keyword={keywordToToggle}
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
