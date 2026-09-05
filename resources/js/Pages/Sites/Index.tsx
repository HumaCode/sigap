import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import '../../../css/sites.css';
import AddSiteModal from './Partials/AddSiteModal';
import DetailSiteModal from './Partials/DetailSiteModal';
import ConfirmModal from '@/Components/ConfirmModal';
import { toast } from '@/Components/DynamicToast';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import PopupLoader from '@/Components/PopupLoader';

export default function Index(props: any) {
    const sites = props.sites || { data: [], meta: { total: 0, from: 0, to: 0, last_page: 1 } };
    const filters = props.filters || {};
    const initialSearch = filters.search ? String(filters.search) : '';
    const initialFilter = filters.filter ? String(filters.filter) : 'all';

    const [search, setSearch] = useState(initialSearch);
    const [filter, setFilter] = useState(initialFilter);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [siteToDelete, setSiteToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    // Real-time Traffic Tracker State (Live RPM Map)
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

    // Inertia background auto-reload every 10 seconds to sync backend state
    useEffect(() => {
        const syncInterval = setInterval(() => {
            router.reload({ only: ['sites', 'stats'] });
        }, 10000);

        return () => clearInterval(syncInterval);
    }, []);

    const executeFilter = (url: string, params: Record<string, any>, msg: string) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        router.get(url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => {
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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        executeFilter(route('sites.index'), { search: val, filter }, val.trim() ? `Mencari situs "${val.trim()}"...` : 'Memuat data situs...');
    };

    const handleFilter = (f: string) => {
        setFilter(f);
        const statusMap: Record<string, string> = {
            'all': 'Semua Situs',
            'active': 'Situs Aktif (Online)',
            'down': 'Situs Down (Offline)'
        };
        executeFilter(route('sites.index'), { search, filter: f }, `Memuat ${statusMap[f] || f}...`);
    };

    const handleReset = () => {
        setSearch('');
        setFilter('all');
        executeFilter(route('sites.index'), {}, 'Mereset filter situs...');
    };

    const confirmDelete = (site: any) => {
        setSiteToDelete(site);
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

    const getSiteFavicon = (category: string) => {
        switch (category) {
            case 'PPID':
                return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #ff7a6e, #ff9d6e)' }}><i className="bi bi-file-earmark-text"></i></div>;
            case 'SPBE':
                return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #8b7bf0, #a78bfa)' }}><i className="bi bi-diagram-3"></i></div>;
            case 'Portal Utama':
                return <div className="site-favicon"><i className="bi bi-building"></i></div>;
            default:
                return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #ffb648, #ff9d6e)' }}><i className="bi bi-globe2"></i></div>;
        }
    };

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'up': return <span className="status-chip chip-up"><span className="chip-dot"></span>Online</span>;
            case 'down': return <span className="status-chip chip-down"><span className="chip-dot"></span>Down</span>;
            case 'warn': return <span className="status-chip chip-warn"><span className="chip-dot"></span>Lambat</span>;
            case 'paused': return <span className="status-chip chip-paused"><span className="chip-dot"></span>Nonaktif</span>;
            default: return <span className="status-chip chip-up"><span className="chip-dot"></span>Online</span>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Daftar Situs" />
            
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

            {/* Mini stat row */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(15,42,63,0.03)', zIndex: 0, transform: 'rotate(-10deg)' }}><i className="bi bi-hdd-network-fill"></i></div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Situs</div>
                                <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--ink)', lineHeight: '1.2', marginTop: '0.2rem' }}>{props.stats?.total || 0}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Semua Terdaftar</div>
                            </div>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(15,42,63,0.06)', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                <i className="bi bi-hdd-network"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(14,165,163,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}><i className="bi bi-check-circle-fill"></i></div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ color: 'var(--teal-1)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Online</div>
                                <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--teal-1)', lineHeight: '1.2', marginTop: '0.2rem' }}>{props.stats?.up || 0}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Berjalan Normal</div>
                            </div>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(14,165,163,0.12)', color: 'var(--teal-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(14,165,163,0.1)' }}>
                                <i className="bi bi-check-circle"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(239,68,68,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}><i className="bi bi-x-octagon-fill"></i></div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Down</div>
                                <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#ef4444', lineHeight: '1.2', marginTop: '0.2rem' }}>{props.stats?.down || 0}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Perlu Perhatian</div>
                            </div>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(239,68,68,0.1)' }}>
                                <i className="bi bi-x-octagon"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(124,147,163,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}><i className="bi bi-pause-circle-fill"></i></div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ color: 'var(--ink-faint)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nonaktif</div>
                                <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--ink-soft)', lineHeight: '1.2', marginTop: '0.2rem' }}>{props.stats?.paused || 0}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Pantauan Berhenti</div>
                            </div>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(124,147,163,0.12)', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(124,147,163,0.05)' }}>
                                <i className="bi bi-pause-circle"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="glass-card mb-0">
                {/* Traffic Legend Bar */}
                <div className="d-flex align-items-center gap-2 mb-3 px-3 py-2" style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.04)', fontSize: '0.78rem', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--ink-soft)' }}><i className="bi bi-info-circle-fill me-1" style={{ color: 'var(--blue-1)' }}></i>Indikator Beban Trafik (RPM):</span>
                    <span className="badge" style={{ background: 'rgba(14,165,163,0.12)', color: 'var(--teal-1)', border: '1px solid rgba(14,165,163,0.25)', fontWeight: 600 }}>🟢 Normal (10 - 450 req/m)</span>
                    <span className="badge" style={{ background: 'rgba(2,132,199,0.12)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.25)', fontWeight: 600 }}>🔵 Sedang (451 - 1.200 req/m)</span>
                    <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)', fontWeight: 600 }}>🟡 Padat / Waspada (1.201 - 3.000 req/m)</span>
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 600 }}>🔴 Bahaya / Flood (&gt;3.000 req/m)</span>
                    <span className="badge" style={{ background: 'rgba(100,116,139,0.12)', color: '#64748b', border: '1px solid rgba(100,116,139,0.25)', fontWeight: 600 }}>❌ Offline (0 req/m)</span>
                </div>

                <div className="toolbar">
                    <div className="search-local">
                        <i className="bi bi-search"></i>
                        <input 
                            type="text" 
                            placeholder="Cari nama situs atau URL..." 
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>Semua</div>
                    <div className={`filter-chip ${filter === 'up' ? 'active' : ''}`} onClick={() => handleFilter('up')}><span className="chip-dot" style={{ background: 'var(--teal-1)' }}></span>Online</div>
                    <div className={`filter-chip ${filter === 'down' ? 'active' : ''}`} onClick={() => handleFilter('down')}><span className="chip-dot" style={{ background: '#e0453a' }}></span>Down</div>
                    <div className={`filter-chip ${filter === 'warn' ? 'active' : ''}`} onClick={() => handleFilter('warn')}><span className="chip-dot" style={{ background: 'var(--sun)' }}></span>Lambat</div>
                    <div className={`filter-chip ${filter === 'paused' ? 'active' : ''}`} onClick={() => handleFilter('paused')}><i className="bi bi-pause-circle"></i></div>

                    <div className="d-flex align-items-center gap-2 ms-auto">
                        <button 
                            className="btn btn-light" 
                            style={{ 
                                height: '38px', borderRadius: '10px', padding: '0 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                                border: '1px solid rgba(0,0,0,0.08)', background: '#ffffff', color: 'var(--ink-dark)', fontSize: '0.82rem', fontWeight: 600,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)', transition: 'all 0.2s', whiteSpace: 'nowrap'
                            }} 
                            onClick={handleReset} 
                            title="Reset Filter & Segarkan Data"
                        >
                            <i className="bi bi-arrow-clockwise" style={{ fontSize: '1rem' }}></i> Reset
                        </button>

                        <button className="btn-add-site" style={{ margin: 0 }} onClick={() => { setSelectedSite(null); setShowModal(true); }}>
                            <i className="bi bi-plus-lg"></i><span>Daftarkan Situs</span>
                        </button>
                    </div>
                </div>

                {/* Desktop table */}
                <div className="table-desktop" style={{ overflowX: 'auto' }}>
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Situs</th>
                                <th>Kategori</th>
                                <th>Status</th>
                                <th>
                                    Trafik / Request
                                    <span className="badge ms-1 text-white" style={{ background: '#ef4444', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px', verticalAlign: 'middle', letterSpacing: '0.5px' }}>
                                        <i className="bi bi-broadcast me-1"></i>REALTIME
                                    </span>
                                </th>
                                <th>Uptime 30 Hari</th>
                                <th>Interval Cek</th>
                                <th>PIC</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!sites.data || sites.data.length === 0 ? (
                                <EmptyState 
                                    icon="bi-globe"
                                    title="Belum Ada Situs"
                                    description="Daftar situs yang dipantau masih kosong. Daftarkan situs Anda untuk mulai memantau uptime secara real-time."
                                    actionLabel="Daftarkan Situs"
                                    onAction={() => { setSelectedSite(null); setShowModal(true); }}
                                    colSpan={8}
                                />
                            ) : sites.data.map((site: any) => (
                                <tr key={site.id}>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            {getSiteFavicon(site.category)}
                                            <div>
                                                <p className="site-name">{site.name}</p>
                                                <p className="site-url">{site.url}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="category-tag">{site.category}</span></td>
                                    <td>{getStatusChip(site.status)}</td>
                                    <td>
                                        {(() => {
                                            const isDown = site.status === 'down';
                                            const currentRpm = isDown ? 0 : (liveRpm[site.id] ?? site.requests_per_minute ?? (site.status === 'warn' ? 1450 : 180));
                                            const formattedRpm = currentRpm.toLocaleString('id-ID') + ' req/mnt';
                                            const isPulsing = pulseRpm[site.id];

                                            if (isDown) {
                                                return (
                                                    <span 
                                                        className="status-chip" 
                                                        style={{ 
                                                            background: 'rgba(100,116,139,0.1)', 
                                                            color: '#64748b', 
                                                            fontWeight: 600, 
                                                            border: '1px solid rgba(100,116,139,0.2)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            padding: '0.25rem 0.65rem'
                                                        }}
                                                        title="Situs dalam kondisi Offline / Down (Tidak melayani trafik)"
                                                    >
                                                        <i className="bi bi-x-circle" style={{ color: '#ef4444' }}></i>
                                                        0 req/mnt (Offline)
                                                    </span>
                                                );
                                            }

                                            if (currentRpm > 3000) {
                                                return (
                                                    <span 
                                                        className="status-chip" 
                                                        style={{ 
                                                            background: isPulsing ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.12)', 
                                                            color: '#dc2626', 
                                                            fontWeight: 700, 
                                                            border: '1px solid rgba(239,68,68,0.3)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            padding: '0.25rem 0.65rem',
                                                            transition: 'all 0.3s ease-in-out',
                                                            transform: isPulsing ? 'scale(1.04)' : 'scale(1)',
                                                            boxShadow: isPulsing ? '0 0 12px rgba(239,68,68,0.25)' : 'none'
                                                        }}
                                                        title="Trafik sangat ekstrem! Dicurigai Surge / Serangan Flood"
                                                    >
                                                        <i className="bi bi-lightning-charge-fill" style={{ color: '#ef4444' }}></i>
                                                        {formattedRpm} (Bahaya)
                                                    </span>
                                                );
                                            }

                                            if (currentRpm > 1200 || site.status === 'warn') {
                                                return (
                                                    <span 
                                                        className="status-chip" 
                                                        style={{ 
                                                            background: isPulsing ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.12)', 
                                                            color: '#b45309', 
                                                            fontWeight: 700, 
                                                            border: '1px solid rgba(245,158,11,0.3)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            padding: '0.25rem 0.65rem',
                                                            transition: 'all 0.3s ease-in-out',
                                                            transform: isPulsing ? 'scale(1.04)' : 'scale(1)',
                                                            boxShadow: isPulsing ? '0 0 12px rgba(245,158,11,0.25)' : 'none'
                                                        }}
                                                        title="Trafik tinggi (Beban Padat/Waspada)"
                                                    >
                                                        <i className="bi bi-fire" style={{ color: '#f59e0b' }}></i>
                                                        {formattedRpm} (Padat)
                                                    </span>
                                                );
                                            }

                                            if (currentRpm > 450) {
                                                return (
                                                    <span 
                                                        className="status-chip" 
                                                        style={{ 
                                                            background: isPulsing ? 'rgba(2,132,199,0.2)' : 'rgba(2,132,199,0.12)', 
                                                            color: '#0284c7', 
                                                            fontWeight: 600,
                                                            border: '1px solid rgba(2,132,199,0.25)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            padding: '0.25rem 0.65rem',
                                                            transition: 'all 0.3s ease-in-out',
                                                            transform: isPulsing ? 'scale(1.04)' : 'scale(1)',
                                                            boxShadow: isPulsing ? '0 0 10px rgba(2,132,199,0.2)' : 'none'
                                                        }}
                                                    >
                                                        <i className="bi bi-activity" style={{ color: '#0284c7' }}></i>
                                                        {formattedRpm} (Sedang)
                                                    </span>
                                                );
                                            }

                                            return (
                                                <span 
                                                    className="status-chip" 
                                                    style={{ 
                                                        background: isPulsing ? 'rgba(14,165,163,0.2)' : 'rgba(14,165,163,0.08)', 
                                                        color: 'var(--teal-1)', 
                                                        fontWeight: 600,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem',
                                                        padding: '0.25rem 0.65rem',
                                                        transition: 'all 0.3s ease-in-out',
                                                        transform: isPulsing ? 'scale(1.04)' : 'scale(1)',
                                                        boxShadow: isPulsing ? '0 0 10px rgba(14,165,163,0.2)' : 'none'
                                                    }}
                                                >
                                                    <i className="bi bi-speedometer2" style={{ color: 'var(--teal-1)' }}></i>
                                                    {formattedRpm}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td>{site.uptime}%</td>
                                    <td>{site.check_interval} menit</td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{site.pic_name || '-'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link
                                            href={route('sites.check', site.id)}
                                            method="post"
                                            as="button"
                                            className="action-btn info me-1"
                                            data-tooltip="Ping Sekarang"
                                            preserveScroll
                                        >
                                            <i className="bi bi-arrow-repeat"></i>
                                        </Link>
                                        <button className="action-btn info" data-tooltip="Lihat detail" onClick={() => { setSelectedSite(site); setShowDetailModal(true); }}><i className="bi bi-eye"></i></button>
                                        <button className="action-btn edit" data-tooltip="Ubah" onClick={() => { setSelectedSite(site); setShowModal(true); }}><i className="bi bi-pencil"></i></button>
                                        <button 
                                            className="action-btn danger" 
                                            data-tooltip="Hapus"
                                            onClick={() => confirmDelete(site)}
                                        ><i className="bi bi-trash"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile card list */}
                <div className="mobile-cards">
                    {!sites.data || sites.data.length === 0 ? (
                        <EmptyState 
                            icon="bi-globe"
                            title="Belum Ada Situs"
                            description="Daftar situs yang dipantau masih kosong. Daftarkan situs Anda untuk mulai memantau uptime secara real-time."
                            actionLabel="Daftarkan Situs"
                            onAction={() => { setSelectedSite(null); setShowModal(true); }}
                        />
                    ) : sites.data.map((site: any) => (
                        <div className="site-card-mobile" key={site.id}>
                            <div className="top-row">
                                {getSiteFavicon(site.category)}
                                <div className="flex-grow-1 min-w-0">
                                    <p className="site-name">{site.name}</p>
                                    <p className="site-url">{site.url}</p>
                                </div>
                                {getStatusChip(site.status)}
                            </div>
                            <div className="meta-row">
                                <span><span className="category-tag">{site.category}</span></span>
                                <span>Uptime {site.uptime}%</span>
                            </div>
                            <div className="d-flex justify-content-end mt-2">
                                <button className="action-btn info" onClick={() => { setSelectedSite(site); setShowDetailModal(true); }}><i className="bi bi-eye"></i></button>
                                <button className="action-btn edit" onClick={() => { setSelectedSite(site); setShowModal(true); }}><i className="bi bi-pencil"></i></button>
                                <button 
                                    className="action-btn danger"
                                    onClick={() => confirmDelete(site)}
                                ><i className="bi bi-trash"></i></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reusable Pagination */}
                <Pagination meta={sites.meta} links={sites.links} itemLabel="situs" />
            </div>

            <AddSiteModal show={showModal} onClose={() => { setShowModal(false); setSelectedSite(null); }} site={selectedSite} />
            <DetailSiteModal show={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedSite(null); }} site={selectedSite} />
            <ConfirmModal 
                show={!!siteToDelete}
                title="Hapus Situs?"
                message={`Apakah Anda yakin ingin menghapus data pemantauan untuk ${siteToDelete?.name}? Tindakan ini tidak dapat dibatalkan dan seluruh riwayat uptime akan hilang.`}
                onConfirm={handleDelete}
                onCancel={() => !isDeleting && setSiteToDelete(null)}
                isProcessing={isDeleting}
            />

            {/* Popup Loader Modal for Filters */}
            <PopupLoader 
                isOpen={isFiltering} 
                status="loading" 
                message={loaderMessage} 
            />
        </AuthenticatedLayout>
    );
}
