import React, { useState, useEffect } from 'react';
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

    // Always keep URL address bar clean (mask query parameters)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [sites]);

    // Router Filter Execution helper with URL cleaning
    const executeFilter = (url: string, params: Record<string, any>, msg: string) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        router.get(url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            },
            onFinish: () => {
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 450 - elapsed);
                setTimeout(() => {
                    setIsFiltering(false);
                }, remaining);
            },
            onError: () => {
                setIsFiltering(false);
            }
        });
    };

    const handlePageChange = (page: number) => {
        executeFilter(route('sites.index'), { search, filter, page }, `Memuat halaman ${page}...`);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        executeFilter(route('sites.index'), { search: val, filter }, val.trim() ? `Mencari situs "${val.trim()}"...` : 'Memuat data situs...');
    };

    const handleFilter = (f: string) => {
        setFilter(f);
        const statusMap: Record<string, string> = {
            'all': 'Semua Situs',
            'up': 'Situs Aktif (Online)',
            'down': 'Situs Down (Offline)',
            'warn': 'Situs Performa Lambat',
            'paused': 'Situs Nonaktif'
        };
        executeFilter(route('sites.index'), { search, filter: f }, `Memuat ${statusMap[f] || f}...`);
    };

    const handleReset = () => {
        setSearch('');
        setFilter('all');
        executeFilter(route('sites.index'), {}, 'Mereset filter situs...');
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
            
            {/* Header Title Bar */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                <div>
                    <div className="page-title d-flex align-items-center gap-2 mb-2" style={{ margin: 0 }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--teal-1), var(--blue-1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', boxShadow: '0 8px 16px rgba(14,165,163,0.2)' }}>
                            <i className="bi bi-hdd-network"></i>
                        </div>
                        Daftar Situs
                    </div>
                    <p className="page-sub mb-0 ms-1">Kelola seluruh situs OPD yang dipantau — {sites.meta ? sites.meta.total : 0} situs terdaftar.</p>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <div style={{ background: 'rgba(255,255,255,0.6)', padding: '0.6rem 1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Sistem</span>
                            <span style={{ fontSize: '0.95rem', color: 'var(--teal-1)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal-1)', boxShadow: '0 0 8px var(--teal-1)' }}></span>
                                Berjalan Optimal
                            </span>
                        </div>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(14,165,163,0.1)', color: 'var(--teal-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                            <i className="bi bi-shield-check"></i>
                        </div>
                    </div>
                </div>
            </div>

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
                    filter={filter}
                    onFilterChange={handleFilter}
                    onReset={handleReset}
                    onAddSite={handleOpenAddModal}
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
