import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import '../../../css/sites.css';

// Reusable Components & Modals
import SiteStatCards from './Partials/SiteStatCards';
import SiteToolbar from './Partials/SiteToolbar';
import SiteTable from './Partials/SiteTable';
import AddSiteModal from './Partials/AddSiteModal';
import DetailSiteModal from './Partials/DetailSiteModal';
import ConfirmModal from '@/Components/ConfirmModal';
import PopupLoader from '@/Components/PopupLoader';
import PageHeader from '@/Components/PageHeader';
import { toast } from '@/Components/DynamicToast';

export default function Index(props: any) {
    const sites = props.sites || { data: [], meta: { total: 0, from: 0, to: 0, last_page: 1 } };
    const filters = props.filters || {};
    const initialSearch = filters.search ? String(filters.search) : '';
    const initialFilter = filters.filter ? String(filters.filter) : 'all';

    // Filter & Search State
    const [search, setSearch] = useState(initialSearch);
    const [filter, setFilter] = useState(initialFilter);
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    const isMounted = useRef(false);
    const filterRef = useRef(filter);
    const searchQueryRef = useRef(initialSearch);

    useEffect(() => {
        filterRef.current = filter;
    }, [filter]);

    useEffect(() => {
        if (filters.search !== undefined) {
            searchQueryRef.current = String(filters.search);
        }
    }, [filters.search]);

    // Modal & Selection State
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [siteToDelete, setSiteToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pingingSiteId, setPingingSiteId] = useState<string | null>(null);

    // Real-time Traffic Tracker State (Live RPM Map & Pulse)
    const [liveRpm, setLiveRpm] = useState<{ [key: string]: number }>({});
    const [pulseRpm, setPulseRpm] = useState<{ [key: string]: boolean }>({});

    // Initialize & update live RPM state when props.sites changes
    useEffect(() => {
        if (sites.data && Array.isArray(sites.data)) {
            const initialMap: { [key: string]: number } = {};
            sites.data.forEach((s: any) => {
                initialMap[s.id] = s.status === 'down' ? 0 : (s.requests_per_minute || (s.status === 'warn' ? 1200 : 180));
            });
            setLiveRpm((prev) => ({ ...initialMap, ...prev }));
        }
    }, [sites]);

    // Live 2.5s Micro-fluctuations Interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (!sites.data || !Array.isArray(sites.data)) return;

            setLiveRpm((prevMap) => {
                const nextMap = { ...prevMap };
                const newPulse: { [key: string]: boolean } = {};

                sites.data.forEach((s: any) => {
                    if (s.status === 'down') {
                        nextMap[s.id] = 0;
                        return;
                    }

                    const current = prevMap[s.id] || s.requests_per_minute || (s.status === 'warn' ? 1200 : 180);
                    // Fluctuate by +/- 1% to 4%
                    const deltaPercent = (Math.random() * 0.08 - 0.04); 
                    const delta = Math.round(current * deltaPercent);
                    const updated = Math.max(30, current + delta);
                    nextMap[s.id] = updated;
                    newPulse[s.id] = true;
                });

                setPulseRpm(newPulse);
                setTimeout(() => setPulseRpm({}), 600); // clear pulse highlight

                return nextMap;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, [sites]);

    // Synchronize search and filter when props change
    useEffect(() => {
        if (filters.search !== undefined) {
            setSearch(filters.search || '');
            searchQueryRef.current = filters.search || '';
        }
        if (filters.filter !== undefined) {
            setFilter(filters.filter || 'all');
            filterRef.current = filters.filter || 'all';
        }
    }, [filters.search, filters.filter]);

    // Helper untuk menjaga URL browser SELALU bersih (/sites) tanpa query string apapun
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

    // Router Filter Execution helper
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
                const remaining = Math.max(0, 450 - elapsed);
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

    const handlePageChange = (page: number) => {
        executeFilter(route('sites.index'), { search: search.trim(), filter: filterRef.current || 'all', page }, `Memuat halaman ${page}...`);
    };

    // Debounced Search Effect (menunggu ketikan selesai 350ms sebelum request)
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const delayDebounce = setTimeout(() => {
            if (search !== searchQueryRef.current) {
                searchQueryRef.current = search;
                const msg = search.trim() ? `Mencari situs "${search.trim()}"...` : 'Memuat data situs...';
                executeFilter(route('sites.index'), { search: search.trim(), filter: filterRef.current || 'all', page: 1 }, msg);
            }
        }, 350);

        return () => clearTimeout(delayDebounce);
    }, [search]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchQueryRef.current = search;
            const msg = search.trim() ? `Mencari situs "${search.trim()}"...` : 'Memuat data situs...';
            executeFilter(route('sites.index'), { search: search.trim(), filter: filterRef.current || 'all', page: 1 }, msg);
        }
    };

    const handleClearSearch = () => {
        searchQueryRef.current = '';
        setSearch('');
        executeFilter(route('sites.index'), { search: '', filter: filterRef.current || 'all', page: 1 }, 'Memuat semua situs...');
    };

    const handleFilter = (f: string) => {
        const nextFilter = f || 'all';
        setFilter(nextFilter);
        filterRef.current = nextFilter;
        const statusMap: Record<string, string> = {
            'all': 'Semua Situs',
            'up': 'Situs Aktif (Online)',
            'down': 'Situs Down (Offline)',
            'warn': 'Situs Performa Lambat',
            'paused': 'Situs Nonaktif'
        };
        executeFilter(route('sites.index'), { search: search.trim(), filter: nextFilter, page: 1 }, `Memuat ${statusMap[nextFilter] || nextFilter}...`);
    };

    const handleReset = () => {
        searchQueryRef.current = '';
        setSearch('');
        setFilter('all');
        filterRef.current = 'all';
        executeFilter(route('sites.index'), { search: '', filter: 'all', page: 1 }, 'Mereset filter situs...');
    };

    const handleExportCsv = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filter && filter !== 'all') params.append('filter', filter);

        window.location.href = `${route('sites.export')}?${params.toString()}`;
    };

    // Actions: Ping, Create, Edit, Delete
    const handlePing = (site: any) => {
        setPingingSiteId(site.id);
        setLoaderMessage(`Menguji respon HTTP & Ping untuk ${site.name}...`);
        setIsFiltering(true);

        router.post(route('sites.check', site.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pengecekan Uptime Selesai', `Status & respon HTTP ${site.name} telah diperbarui.`);
            },
            onError: () => {
                toast.error('Pengecekan Gagal', `Gagal menguji koneksi ke ${site.name}.`);
            },
            onFinish: () => {
                setPingingSiteId(null);
                setIsFiltering(false);
            }
        });
    };

    const handleOpenAddModal = () => {
        setSelectedSite(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (site: any) => {
        setSelectedSite(site);
        setShowModal(true);
    };

    const handleOpenDetailModal = (site: any) => {
        setSelectedSite(site);
        setShowDetailModal(true);
    };

    const handleDelete = () => {
        if (!siteToDelete) return;
        setIsDeleting(true);
        router.delete(route('sites.destroy', siteToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Berhasil Dihapus', `Situs ${siteToDelete.name} telah dihapus dari sistem.`);
                setSiteToDelete(null);
            },
            onFinish: () => setIsDeleting(false)
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Daftar Situs" />
            
            {/* Reusable Header Title Bar & Status */}
            <PageHeader 
                title="Daftar Situs"
                subtitle={`Kelola seluruh situs OPD yang dipantau — ${sites.meta ? sites.meta.total : 0} situs terdaftar.`}
                icon="bi-hdd-network"
                status={{
                    label: 'Status Sistem',
                    value: 'Berjalan Optimal',
                    icon: 'bi-shield-check',
                    type: 'optimal',
                }}
            />

            {/* Modular Stat Cards Row */}
            <SiteStatCards 
                stats={props.stats || {}} 
                onFilter={handleFilter} 
            />

            {/* Main Content Area */}
            <div className="glass-card mb-0">
                {/* Modular Toolbar (Legend, Search, Filters, Add Button) */}
                <SiteToolbar 
                    search={search}
                    onSearchChange={handleSearch}
                    onSearchKeyDown={handleSearchKeyDown}
                    onClearSearch={handleClearSearch}
                    filter={filter}
                    onFilterChange={handleFilter}
                    onReset={handleReset}
                    onAddSite={handleOpenAddModal}
                    onExportCsv={handleExportCsv}
                    can={props.can}
                />

                {/* Modular Table & Mobile List */}
                <SiteTable 
                    sites={sites}
                    liveRpm={liveRpm}
                    pulseRpm={pulseRpm}
                    pingingSiteId={pingingSiteId}
                    can={props.can}
                    onPageChange={handlePageChange}
                    onPing={handlePing}
                    onViewDetail={handleOpenDetailModal}
                    onEdit={handleOpenEditModal}
                    onDelete={(site) => setSiteToDelete(site)}
                    onAddSite={handleOpenAddModal}
                />
            </div>

            {/* Modals & Loaders */}
            <AddSiteModal 
                show={showModal} 
                onClose={() => { setShowModal(false); setSelectedSite(null); }} 
                site={selectedSite} 
            />
            <DetailSiteModal 
                show={showDetailModal} 
                onClose={() => { setShowDetailModal(false); setSelectedSite(null); }} 
                site={selectedSite} 
            />
            <ConfirmModal 
                show={!!siteToDelete}
                title="Hapus Pemantauan Situs?"
                itemName={siteToDelete?.name}
                itemDetails={siteToDelete?.url}
                message="Data pemantauan situs ini akan dihapus dari server SIGAP. Seluruh histori statistik tidak dapat dipulihkan kembali."
                confirmText="Ya, Hapus Situs"
                warningPoints={[
                    "Pengecekan uptime otomatis ke domain ini akan dihentikan seketika.",
                    "Seluruh riwayat uptime 30 hari & log deteksi konten akan dihapus permanen.",
                    "Kredensial SSH (jika ada) akan dihapus secara aman dari database."
                ]}
                onConfirm={handleDelete}
                onCancel={() => !isDeleting && setSiteToDelete(null)}
                isProcessing={isDeleting}
            />

            <PopupLoader 
                isOpen={isFiltering} 
                status="loading" 
                message={loaderMessage} 
            />
        </AuthenticatedLayout>
    );
}
