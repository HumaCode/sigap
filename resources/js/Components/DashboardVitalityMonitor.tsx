import React, { useState, useMemo } from 'react';
import Pagination from '@/Components/Pagination';

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

    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [clusterFilter, setClusterFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const perPage = 10;

    // Filter logic
    const filteredItems = useMemo(() => {
        return data.items.filter((item) => {
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
    }, [data.items, activeFilter, searchTerm, clusterFilter]);

    const totalPages = Math.ceil(filteredItems.length / perPage);
    const paginatedItems = useMemo(() => {
        return filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage);
    }, [filteredItems, currentPage]);

    const handleFilterChange = (filterKey: string) => {
        setActiveFilter(filterKey);
        setCurrentPage(1);
    };

    return (
        <div className="vitality-monitor-wrapper mb-4">
            {/* Header Title Section */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                    <h6 className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f2a3f' }}>
                        <i className="bi bi-activity text-teal" style={{ color: 'var(--teal-1)', fontSize: '1.2rem' }}></i>
                        Monitoring Vitalitas Layanan &amp; Diagnostik HTTP
                    </h6>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                        Klasifikasi keaktifan trafik layanan (Sangat Aktif vs Mati Suri) serta pemantauan waktu respons dan TTFB (*Time to First Byte*).
                    </span>
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
                            <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom border-light">
                                <div>
                                    <h6 className="mb-0 fw-bold" style={{ color: '#0f2a3f', fontSize: '0.94rem' }}>
                                        {cluster.title}
                                    </h6>
                                    <span style={{ fontSize: '0.74rem', color: 'var(--ink-faint)' }}>{cluster.description}</span>
                                </div>
                                <span className="badge rounded-pill bg-white text-dark border px-2.5 py-1" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                    {cluster.total} Layanan
                                </span>
                            </div>

                            {/* Vitality Summary Stats Grid */}
                            <div className="row g-2 mb-2.5 text-center">
                                <div className="col-3">
                                    <div className="p-2 rounded-3" style={{ background: 'rgba(14, 165, 163, 0.1)', border: '1px solid rgba(14, 165, 163, 0.2)' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--teal-1)', lineHeight: 1 }}>{cluster.very_active}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-soft)', marginTop: '2px' }}>Sangat Aktif</div>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="p-2 rounded-3" style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', lineHeight: 1 }}>{cluster.active}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-soft)', marginTop: '2px' }}>Aktif</div>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="p-2 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{cluster.low_activity}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-soft)', marginTop: '2px' }}>Kurang Aktif</div>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="p-2 rounded-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>{cluster.dormant}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#dc2626', marginTop: '2px' }}>Mati Suri</div>
                                    </div>
                                </div>
                            </div>

                            {/* HTTP Diagnostics Quick Footnote */}
                            <div className="d-flex align-items-center justify-content-between pt-1" style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                                <span>Status HTTP:</span>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-success fw-semibold"><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>2xx: {cluster.http.online}</span>
                                    <span className="text-primary fw-semibold"><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>3xx: {cluster.http.redirect}</span>
                                    <span className="text-danger fw-semibold"><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>5xx: {cluster.http.server_error}</span>
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
                            minWidth: '180px',
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
                            🟡 Kurang Aktif
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${activeFilter === 'dormant' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => handleFilterChange('dormant')}
                            style={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
                        >
                            🔴 Mati Suri
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
                                <th style={{ width: '130px', padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Latensi &amp; TTFB</th>
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
                                            <td style={{ padding: '0.75rem' }}>
                                                <div className="d-flex flex-column gap-0.5" style={{ fontSize: '0.74rem' }}>
                                                    <span className="text-muted">
                                                        Respon: <strong className={item.response_time === 'Timeout' ? 'text-danger' : 'text-dark'}>{item.response_time}</strong>
                                                    </span>
                                                    <span className="text-muted">
                                                        TTFB: <strong className="text-secondary">{item.ttfb}</strong>
                                                    </span>
                                                </div>
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
                                    <td colSpan={7} className="text-center py-4 text-muted" style={{ fontSize: '0.84rem' }}>
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
