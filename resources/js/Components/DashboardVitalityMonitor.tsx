import React, { useState, useMemo, useEffect } from 'react';
import Pagination from '@/Components/Pagination';
import { router } from '@inertiajs/react';

export interface VitalityMonitorProps {
    data?: {
        clusters: Array<{
            title: string;
            description: string;
            total: number;
            very_active: number;
            active: number;
            low_activity: number;
            dormant: number;
            http: {
                online: number;
                redirect: number;
                client_error: number;
                server_error: number;
                timeout: number;
            };
        }>;
        items: Array<{
            id: string;
            name: string;
            url: string;
            category: string;
            cluster: string;
            backend_ip: string;
            http_code: number;
            http_label: string;
            status: string;
            response_time: string;
            ttfb: string;
            log_count: string;
            raw_log_count?: number;
            last_activity_time: string;
            last_activity_age: string;
            vitality: 'very_active' | 'active' | 'low_activity' | 'dormant';
            vitality_label: string;
            vitality_color: string;
        }>;
    };
}

export default function DashboardVitalityMonitor({ data }: VitalityMonitorProps) {
    if (!data || !data.items || data.items.length === 0) return null;

    const [liveItems, setLiveItems] = useState(data.items);
    const [isLive, setIsLive] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [recentlyUpdated, setRecentlyUpdated] = useState<Record<string, { diff: number; timestamp: number }>>({});
    const [lastRefreshTime, setLastRefreshTime] = useState<string>('Baru saja');

    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [clusterFilter, setClusterFilter] = useState<string>('all');
    const [trafficFilter, setTrafficFilter] = useState<'all' | 'frequent' | 'rare' | 'never'>('all');
    const [logSortOrder, setLogSortOrder] = useState<'none' | 'desc' | 'asc'>('none');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const perPage = 10;

    // Sync liveItems with incoming 100% REAL server props and detect genuine updates
    useEffect(() => {
        if (!data || !data.items) return;

        // Detect real changes between server updates to highlight rows
        const updatesMap: Record<string, { diff: number; timestamp: number }> = {};
        const now = Date.now();

        data.items.forEach((newItem) => {
            const oldItem = liveItems.find((i) => i.id === newItem.id);
            if (oldItem && (oldItem.response_time !== newItem.response_time || oldItem.log_count !== newItem.log_count)) {
                const parseMs = (str: string) => {
                    const match = str.match(/(\d+(\.\d+)?)/);
                    if (!match) return 0;
                    return str.includes('dtk') ? Math.round(parseFloat(match[1]) * 1000) : parseInt(match[1], 10);
                };
                const oldMs = parseMs(oldItem.response_time);
                const newMs = parseMs(newItem.response_time);
                updatesMap[newItem.id] = { diff: newMs - oldMs, timestamp: now };
            }
        });

        if (Object.keys(updatesMap).length > 0) {
            setRecentlyUpdated((prev) => ({ ...prev, ...updatesMap }));
        }

        setLiveItems(data.items);
        setLastRefreshTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    }, [data.items]);

    // Background Real Server Polling (every 15s if isLive is enabled)
    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            router.reload({
                only: ['vitality_monitor'],
            });
        }, 15000);

        return () => clearInterval(interval);
    }, [isLive]);

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            only: ['vitality_monitor'],
            onFinish: () => setIsRefreshing(false),
        });
    };

    // Filter logic based on liveItems
    const filteredItems = useMemo(() => {
        let result = liveItems.filter((item) => {
            // Cluster Filter
            if (clusterFilter !== 'all' && item.cluster !== clusterFilter) {
                return false;
            }

            // Status / Vitality Filter Chip
            if (activeFilter === 'very_active' && item.vitality !== 'very_active') return false;
            if (activeFilter === 'active' && item.vitality !== 'active') return false;
            if (activeFilter === 'low_activity' && item.vitality !== 'low_activity') return false;
            if (activeFilter === 'dormant' && item.vitality !== 'dormant') return false;
            if (activeFilter === 'server_error' && (item.http_code < 500 || item.http_code >= 600)) return false;
            if (activeFilter === 'timeout' && item.http_code !== 0 && item.status !== 'down') return false;

            // Parameter Log / Traffic Visitor Filter (Based on real detection log count)
            const rawLog = item.raw_log_count ?? parseInt(String(item.log_count).replace(/\D/g, ''), 10) ?? 0;
            if (trafficFilter === 'frequent' && rawLog < 4) return false;
            if (trafficFilter === 'rare' && (rawLog < 2 || rawLog >= 4)) return false;
            if (trafficFilter === 'never' && rawLog > 1) return false;

            // Search Filter
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase();
                const matchName = item.name.toLowerCase().includes(q);
                const matchUrl = item.url.toLowerCase().includes(q);
                const matchIp = item.backend_ip.toLowerCase().includes(q);
                if (!matchName && !matchUrl && !matchIp) return false;
            }

            return true;
        });

        // Sorting by Jumlah Log
        if (logSortOrder === 'desc') {
            result = [...result].sort((a, b) => {
                const countA = a.raw_log_count ?? parseInt(String(a.log_count).replace(/\D/g, ''), 10) ?? 0;
                const countB = b.raw_log_count ?? parseInt(String(b.log_count).replace(/\D/g, ''), 10) ?? 0;
                return countB - countA;
            });
        } else if (logSortOrder === 'asc') {
            result = [...result].sort((a, b) => {
                const countA = a.raw_log_count ?? parseInt(String(a.log_count).replace(/\D/g, ''), 10) ?? 0;
                const countB = b.raw_log_count ?? parseInt(String(b.log_count).replace(/\D/g, ''), 10) ?? 0;
                return countA - countB;
            });
        }

        return result;
    }, [liveItems, activeFilter, searchTerm, clusterFilter, trafficFilter, logSortOrder]);

    const totalPages = Math.ceil(filteredItems.length / perPage);
    const paginatedItems = useMemo(() => {
        return filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage);
    }, [filteredItems, currentPage]);

    // Clear stale flash highlights after 2.5 seconds
    useEffect(() => {
        if (Object.keys(recentlyUpdated).length === 0) return;

        const cleanupTimer = setTimeout(() => {
            const now = Date.now();
            setRecentlyUpdated((prev) => {
                const next: Record<string, { diff: number; timestamp: number }> = {};
                Object.entries(prev).forEach(([id, meta]) => {
                    if (now - meta.timestamp < 2500) {
                        next[id] = meta;
                    }
                });
                return next;
            });
        }, 2500);

        return () => clearTimeout(cleanupTimer);
    }, [recentlyUpdated]);

    const handleFilterChange = (filterKey: string) => {
        setActiveFilter(filterKey);
        setCurrentPage(1);
    };

    return (
        <div className="vitality-monitor-wrapper mt-4 pt-2 mb-4">
            {/* Header Title Section */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-1 flex-wrap gap-2">
                <div>
                    <h5 className="d-flex align-items-center gap-2 mb-1 fw-bold" style={{ fontSize: '1.05rem', color: '#0f2a3f', letterSpacing: '-0.2px' }}>
                        <span 
                            style={{ 
                                width: '30px', 
                                height: '30px', 
                                borderRadius: '8px', 
                                background: 'rgba(14, 165, 163, 0.12)', 
                                color: 'var(--teal-1)', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '1rem',
                                flexShrink: 0
                            }}
                        >
                            <i className="bi bi-activity"></i>
                        </span>
                        <span>Monitoring Vitalitas Layanan &amp; Diagnostik HTTP</span>
                    </h5>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.82rem', lineHeight: 1.5, paddingLeft: '38px' }}>
                        Klasifikasi tingkat aktivitas trafik layanan (Sangat Aktif s/d Tidak Aktif) serta pemantauan waktu respons dan TTFB (<em>Time to First Byte</em>).
                    </p>
                </div>

                {/* Realtime Live Controls */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <div 
                        className="d-flex align-items-center gap-2 bg-white px-3 py-1.5 rounded-pill border shadow-xs" 
                        style={{ 
                            fontSize: '0.78rem',
                            borderColor: isLive ? 'rgba(14, 165, 163, 0.35)' : 'rgba(15, 42, 63, 0.12)',
                            background: isLive ? 'linear-gradient(135deg, #ffffff 0%, rgba(240, 253, 250, 0.8) 100%)' : '#ffffff',
                            transition: 'all 0.25s ease'
                        }}
                    >
                        <span className="text-muted d-none d-md-inline" style={{ fontSize: '0.74rem' }}>
                            Update: <strong className="text-dark">{lastRefreshTime}</strong>
                        </span>
                        <div 
                            className="vr d-none d-md-inline" 
                            style={{ height: '14px', opacity: 0.2 }}
                        ></div>
                        <button
                            type="button"
                            onClick={() => setIsLive(!isLive)}
                            className="btn btn-sm p-0 d-flex align-items-center gap-2 border-0"
                            style={{ 
                                background: 'none', 
                                cursor: 'pointer',
                                fontWeight: 700,
                                color: isLive ? 'var(--teal-1)' : '#64748b'
                            }}
                            title={isLive ? 'Klik untuk menjeda pemantauan realtime' : 'Klik untuk mengaktifkan pemantauan realtime'}
                        >
                            <span
                                style={{
                                    width: '9px',
                                    height: '9px',
                                    borderRadius: '50%',
                                    background: isLive ? '#10b981' : '#94a3b8',
                                    display: 'inline-block',
                                    boxShadow: isLive ? '0 0 10px rgba(16, 185, 129, 0.8)' : 'none',
                                    animation: isLive ? 'livePulse 1.8s infinite' : 'none',
                                }}
                            ></span>
                            <span>{isLive ? 'REALTIME: AKTIF' : 'REALTIME: JEDA'}</span>
                        </button>
                    </div>

                    {/* Manual Server Sync Button */}
                    <button
                        type="button"
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className="btn btn-sm px-3 py-1.5 d-flex align-items-center gap-1.5 shadow-xs"
                        style={{
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: 'var(--teal-1)',
                            background: '#ffffff',
                            border: '1px solid rgba(15, 42, 63, 0.15)',
                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        title="Ambil data real terbaru dari database server sekarang"
                    >
                        <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-icon' : ''}`}></i>
                        <span>{isRefreshing ? 'Menyinkronkan...' : 'Segarkan Data Real'}</span>
                    </button>
                </div>
            </div>

            {/* Top Cards: Cluster Summary Cards */}
            <div className="row g-3 mb-3">
                {data.clusters.map((cluster, idx) => (
                    <div key={idx} className="col-12 col-lg-6">
                        <div 
                            className="glass-card h-100 p-3.5 position-relative overflow-hidden" 
                            style={{ 
                                borderRadius: '16px',
                                border: '1.5px solid rgba(15, 42, 63, 0.08)',
                                background: idx === 0 
                                    ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.8) 100%)'
                                    : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.8) 100%)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between pb-2 mb-2.5 border-bottom border-light">
                                <div>
                                    <h6 className="mb-1 fw-bold" style={{ color: '#0f2a3f', fontSize: '0.94rem' }}>
                                        {cluster.title}
                                    </h6>
                                    <p className="mb-0 text-muted" style={{ fontSize: '0.74rem', lineHeight: 1.4 }}>{cluster.description}</p>
                                </div>
                                <span className="badge rounded-pill bg-white text-dark border px-2.5 py-1 flex-shrink-0 ms-2" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                    {cluster.total} Layanan
                                </span>
                            </div>

                            {/* Vitality Summary Stats Grid */}
                            <div className="row g-2 mb-2.5 text-center">
                                <div className="col-3">
                                    <div className="p-2.5 rounded-3" style={{ background: 'rgba(14, 165, 163, 0.1)', border: '1px solid rgba(14, 165, 163, 0.2)' }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--teal-1)', lineHeight: 1 }}>{cluster.very_active}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-soft)', marginTop: '4px' }}>Sangat Aktif</div>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="p-2.5 rounded-3" style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0284c7', lineHeight: 1 }}>{cluster.active}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-soft)', marginTop: '4px' }}>Aktif</div>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="p-2.5 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{cluster.low_activity}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-soft)', marginTop: '4px' }}>Aktivitas Rendah</div>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="p-2.5 rounded-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>{cluster.dormant}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#dc2626', marginTop: '4px' }}>Tidak Aktif</div>
                                    </div>
                                </div>
                            </div>

                            {/* HTTP Diagnostics Quick Footnote */}
                            <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light" style={{ fontSize: '0.74rem', color: 'var(--ink-soft)' }}>
                                <span className="fw-semibold">Status HTTP:</span>
                                <div className="d-flex align-items-center gap-2.5">
                                    <span className="text-success fw-semibold"><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.45rem' }}></i>2xx: {cluster.http.online}</span>
                                    <span className="text-primary fw-semibold"><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.45rem' }}></i>3xx: {cluster.http.redirect}</span>
                                    <span className="text-danger fw-semibold"><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.45rem' }}></i>5xx: {cluster.http.server_error}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Interactive Table Card */}
            <div className="glass-card p-0 overflow-hidden" style={{ borderRadius: '18px', border: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
                {/* Toolbar Filter & Search */}
                <div className="d-flex align-items-center gap-2 p-3 bg-white border-bottom border-light flex-wrap">
                    {/* Search Box */}
                    <div style={{ position: 'relative', minWidth: '220px', maxWidth: '300px', flex: '1 1 220px' }}>
                        <i className="bi bi-search position-absolute text-muted" style={{ left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}></i>
                        <input
                            type="text"
                            placeholder="Cari domain / layanan..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{
                                borderRadius: '10px',
                                border: '1.5px solid rgba(15, 42, 63, 0.12)',
                                padding: '0.45rem 2.2rem 0.45rem 2.3rem',
                                fontSize: '0.82rem',
                                width: '100%',
                                outline: 'none'
                            }}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="btn btn-sm btn-link position-absolute text-muted p-0"
                                style={{ right: '0.75rem', top: '50%', transform: 'translateY(-50%)', textDecoration: 'none' }}
                            >
                                <i className="bi bi-x-circle-fill"></i>
                            </button>
                        )}
                    </div>

                    {/* Cluster Selector */}
                    <select
                        className="form-select"
                        value={clusterFilter}
                        onChange={(e) => {
                            setClusterFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{
                            width: 'auto',
                            minWidth: '175px',
                            height: '36px',
                            borderRadius: '10px',
                            border: '1.5px solid rgba(15, 42, 63, 0.12)',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Semua Kluster Layanan</option>
                        <option value="Kluster Layanan Inti">Kluster Layanan Inti</option>
                        <option value="Kluster Layanan Ekosistem">Kluster Layanan Ekosistem</option>
                    </select>

                    {/* Parameter Log / Traffic Visitor Filter */}
                    <select
                        className="form-select"
                        value={trafficFilter}
                        onChange={(e) => {
                            setTrafficFilter(e.target.value as any);
                            setCurrentPage(1);
                        }}
                        style={{
                            width: 'auto',
                            minWidth: '190px',
                            height: '36px',
                            borderRadius: '10px',
                            border: `1.5px solid ${trafficFilter !== 'all' ? 'var(--teal-1)' : 'rgba(15, 42, 63, 0.12)'}`,
                            background: trafficFilter !== 'all' ? 'rgba(14, 165, 163, 0.08)' : '#ffffff',
                            color: trafficFilter !== 'all' ? 'var(--teal-1)' : '#0f2a3f',
                            fontSize: '0.8rem',
                            fontWeight: trafficFilter !== 'all' ? 700 : 500,
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Semua Parameter Log</option>
                        <option value="frequent">🔥 Sering Dikunjungi (≥4 Log)</option>
                        <option value="rare">⏳ Jarang Dikunjungi (2-3 Log)</option>
                        <option value="never">🛑 Belum Ada / Nihil (≤1 Log)</option>
                    </select>

                    {/* Filter Chips */}
                    <div className="d-flex align-items-center gap-1.5 flex-wrap ms-auto">
                        <button
                            type="button"
                            className={`btn btn-sm ${activeFilter === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => handleFilterChange('all')}
                            style={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${activeFilter === 'very_active' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => handleFilterChange('very_active')}
                            style={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
                        >
                            🟢 Sangat Aktif
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${activeFilter === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handleFilterChange('active')}
                            style={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
                        >
                            🔵 Aktif
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${activeFilter === 'low_activity' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
                            onClick={() => handleFilterChange('low_activity')}
                            style={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
                        >
                            🟡 Aktivitas Rendah
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${activeFilter === 'dormant' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => handleFilterChange('dormant')}
                            style={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
                        >
                            🔴 Tidak Aktif
                        </button>
                    </div>
                </div>

                {/* Table View */}
                <div className="table-responsive">
                    <table className="table align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
                            <tr>
                                <th style={{ width: '45px', padding: '0.85rem', textAlign: 'center', color: '#475569', fontWeight: 700 }}>No</th>
                                <th style={{ padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Domain &amp; Layanan</th>
                                <th style={{ width: '130px', padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Host / IP Backend</th>
                                <th style={{ width: '100px', padding: '0.85rem', textAlign: 'center', color: '#475569', fontWeight: 700 }}>HTTP Code</th>
                                <th style={{ width: '155px', padding: '0.85rem', color: '#475569', fontWeight: 700 }}>
                                    <div className="d-flex align-items-center gap-1.5">
                                        <i className="bi bi-broadcast" style={{ color: isLive ? 'var(--teal-1)' : '#94a3b8' }}></i>
                                        <span>Latensi &amp; TTFB</span>
                                        {isLive && (
                                            <span 
                                                className="badge rounded-pill ms-auto"
                                                style={{ 
                                                    fontSize: '0.6rem', 
                                                    fontWeight: 700, 
                                                    background: 'rgba(14, 165, 163, 0.12)', 
                                                    color: 'var(--teal-1)',
                                                    border: '1px solid rgba(14, 165, 163, 0.3)',
                                                    padding: '0.15rem 0.4rem',
                                                    letterSpacing: '0.5px'
                                                }}
                                            >
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    style={{ width: '125px', padding: '0.85rem', textAlign: 'center', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                                    onClick={() => {
                                        setLogSortOrder((prev) => (prev === 'desc' ? 'asc' : (prev === 'asc' ? 'none' : 'desc')));
                                        setCurrentPage(1);
                                    }}
                                    title="Klik untuk mengurutkan berdasarkan jumlah log kunjungan"
                                >
                                    <div className="d-flex align-items-center justify-content-center gap-1.5 user-select-none">
                                        <i className="bi bi-file-text"></i>
                                        <span>Jumlah Log</span>
                                        <i 
                                            className={`bi ${
                                                logSortOrder === 'desc' 
                                                    ? 'bi-sort-numeric-down-alt text-teal' 
                                                    : (logSortOrder === 'asc' ? 'bi-sort-numeric-down text-teal' : 'bi-arrow-down-up text-muted')
                                            }`}
                                            style={{ fontSize: '0.78rem' }}
                                        ></i>
                                    </div>
                                </th>
                                <th style={{ width: '160px', padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Akses Terakhir</th>
                                <th style={{ width: '120px', padding: '0.85rem', textAlign: 'center', color: '#475569', fontWeight: 700 }}>Vitalitas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.length > 0 ? (
                                paginatedItems.map((item, index) => {
                                    const isDormant = item.vitality === 'dormant';
                                    const isServerError = item.http_code >= 500;
                                    const rowNumber = (currentPage - 1) * perPage + index + 1;

                                    return (
                                        <tr 
                                            key={item.id}
                                            style={{
                                                background: isDormant 
                                                    ? 'rgba(254, 242, 242, 0.65)' 
                                                    : (isServerError ? 'rgba(255, 241, 242, 0.5)' : '#ffffff'),
                                                borderBottom: '1px solid rgba(15, 42, 63, 0.05)',
                                                transition: 'background 0.15s ease'
                                            }}
                                        >
                                            {/* No */}
                                            <td className="text-center text-muted" style={{ padding: '0.75rem', fontWeight: 600 }}>
                                                {rowNumber}
                                            </td>

                                            {/* Domain & Layanan */}
                                            <td style={{ padding: '0.75rem' }}>
                                                <div className="d-flex flex-column">
                                                    <div className="d-flex align-items-center gap-1.5">
                                                        <strong style={{ color: isDormant ? '#991b1b' : '#0f2a3f', fontSize: '0.88rem' }}>
                                                            {item.name}
                                                        </strong>
                                                        <span className="badge bg-light text-secondary border px-1.5 py-0.5" style={{ fontSize: '0.68rem', fontWeight: 500 }}>
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                    <a 
                                                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-decoration-none text-muted mt-0.5"
                                                        style={{ fontSize: '0.76rem' }}
                                                    >
                                                        {item.url} <i className="bi bi-box-arrow-up-right ms-0.5" style={{ fontSize: '0.65rem' }}></i>
                                                    </a>
                                                </div>
                                            </td>

                                            {/* Host / Backend IP */}
                                            <td style={{ padding: '0.75rem' }}>
                                                <code style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem', borderRadius: '6px', background: 'rgba(15, 42, 63, 0.05)', color: '#0f2a3f' }}>
                                                    {item.backend_ip}
                                                </code>
                                            </td>

                                            {/* HTTP Code */}
                                            <td className="text-center" style={{ padding: '0.75rem' }}>
                                                <span 
                                                    className="badge px-2 py-1"
                                                    style={{
                                                        borderRadius: '8px',
                                                        fontSize: '0.74rem',
                                                        fontWeight: 700,
                                                        background: item.http_code === 200 ? 'rgba(14, 165, 163, 0.12)' : (item.http_code === 301 ? 'rgba(2, 132, 199, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                                                        color: item.http_code === 200 ? 'var(--teal-1)' : (item.http_code === 301 ? '#0284c7' : '#dc2626'),
                                                        border: `1px solid ${item.http_code === 200 ? 'rgba(14, 165, 163, 0.3)' : (item.http_code === 301 ? 'rgba(2, 132, 199, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`
                                                    }}
                                                >
                                                    {item.http_code}
                                                </span>
                                            </td>

                                            {/* Latensi & TTFB */}
                                            <td 
                                                style={{ 
                                                    padding: '0.75rem',
                                                    background: recentlyUpdated[item.id] ? 'rgba(14, 165, 163, 0.14)' : 'transparent',
                                                    transition: 'background-color 0.45s ease',
                                                    borderRadius: '6px'
                                                }}
                                            >
                                                <div className="d-flex flex-column gap-0.5" style={{ fontSize: '0.74rem' }}>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <span className="text-muted">
                                                            Respon: <strong className={item.response_time === 'Timeout' ? 'text-danger' : 'text-dark'}>{item.response_time}</strong>
                                                        </span>
                                                        {recentlyUpdated[item.id] && (
                                                            <span 
                                                                className="badge px-1 py-0 ms-1 d-inline-flex align-items-center gap-0.5"
                                                                style={{ 
                                                                    fontSize: '0.62rem', 
                                                                    fontWeight: 700,
                                                                    background: recentlyUpdated[item.id].diff <= 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                                                                    color: recentlyUpdated[item.id].diff <= 0 ? '#059669' : '#d97706',
                                                                    borderRadius: '4px',
                                                                    border: `1px solid ${recentlyUpdated[item.id].diff <= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                                                }}
                                                                title={recentlyUpdated[item.id].diff <= 0 ? 'Waktu respons membaik' : 'Fluktuasi wajar jaringan'}
                                                            >
                                                                {recentlyUpdated[item.id].diff <= 0 ? '▼' : '▲'} {Math.abs(recentlyUpdated[item.id].diff)}ms
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-muted">
                                                        TTFB: <strong className="text-secondary">{item.ttfb}</strong>
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Jumlah Log */}
                                            <td className="text-center" style={{ padding: '0.75rem' }}>
                                                {(() => {
                                                    const count = item.raw_log_count ?? parseInt(String(item.log_count).replace(/\D/g, ''), 10) ?? 0;
                                                    const isZeroOrNever = count <= 1;
                                                    const isRare = count >= 2 && count < 4;

                                                    let badgeBg = 'rgba(14, 165, 163, 0.12)';
                                                    let badgeColor = 'var(--teal-1)';
                                                    let badgeBorder = 'rgba(14, 165, 163, 0.3)';
                                                    let label = 'Sering';

                                                    if (isZeroOrNever) {
                                                        badgeBg = 'rgba(239, 68, 68, 0.15)';
                                                        badgeColor = '#dc2626';
                                                        badgeBorder = 'rgba(239, 68, 68, 0.35)';
                                                        label = 'Nihil / Belum Ada';
                                                    } else if (isRare) {
                                                        badgeBg = 'rgba(245, 158, 11, 0.14)';
                                                        badgeColor = '#d97706';
                                                        badgeBorder = 'rgba(245, 158, 11, 0.3)';
                                                        label = 'Jarang';
                                                    }

                                                    return (
                                                        <div className="d-inline-flex flex-column align-items-center">
                                                            <span 
                                                                className="badge px-2.5 py-1 fw-bold"
                                                                style={{
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.78rem',
                                                                    background: badgeBg,
                                                                    color: badgeColor,
                                                                    border: `1px solid ${badgeBorder}`,
                                                                    minWidth: '55px',
                                                                    letterSpacing: '0.2px',
                                                                    boxShadow: isZeroOrNever ? '0 0 8px rgba(239, 68, 68, 0.2)' : 'none'
                                                                }}
                                                                title={`${item.name}: ${item.log_count} rekaman log akses (${label})`}
                                                            >
                                                                {item.log_count}
                                                            </span>
                                                            <span 
                                                                className="mt-0.5 fw-semibold" 
                                                                style={{ 
                                                                    fontSize: '0.64rem', 
                                                                    color: isZeroOrNever ? '#dc2626' : (isRare ? '#b45309' : '#0f766e') 
                                                                }}
                                                            >
                                                                {label}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            {/* Waktu Akses Terakhir & Umur */}
                                            <td style={{ padding: '0.75rem' }}>
                                                <div className="d-flex flex-column">
                                                    <span style={{ fontSize: '0.74rem', color: '#0f2a3f', fontWeight: 600 }}>
                                                        {item.last_activity_age}
                                                    </span>
                                                    <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                                                        {item.last_activity_time}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status Vitalitas */}
                                            <td className="text-center" style={{ padding: '0.75rem' }}>
                                                <span 
                                                    className="badge px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5"
                                                    style={{
                                                        borderRadius: '999px',
                                                        fontSize: '0.74rem',
                                                        fontWeight: 700,
                                                        background: isDormant ? '#fee2e2' : (item.vitality === 'very_active' ? '#ccfbf1' : (item.vitality === 'active' ? '#e0f2fe' : '#fef3c7')),
                                                        color: item.vitality_color,
                                                        border: `1px solid ${item.vitality_color}`
                                                    }}
                                                >
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.vitality_color }}></span>
                                                    {item.vitality_label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-4 text-muted" style={{ fontSize: '0.84rem' }}>
                                        Tidak ada data layanan yang sesuai dengan filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Standard Reusable SIGAP Pagination Component */}
                {filteredItems.length > 0 && (
                    <div className="bg-white">
                        <Pagination
                            meta={{
                                current_page: currentPage,
                                last_page: totalPages,
                                from: ((currentPage - 1) * perPage) + 1,
                                to: Math.min(currentPage * perPage, filteredItems.length),
                                total: filteredItems.length,
                                per_page: perPage,
                            }}
                            itemLabel="layanan"
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
