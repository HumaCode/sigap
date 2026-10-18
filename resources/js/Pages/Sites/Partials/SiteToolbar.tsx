import React from 'react';

interface SiteToolbarProps {
    search: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onClearSearch?: () => void;
    filter: string;
    onFilterChange: (filter: string) => void;
    onReset: () => void;
    onAddSite: () => void;
    onExportCsv?: () => void;
    can?: {
        create?: boolean;
        update?: boolean;
        delete?: boolean;
        check?: boolean;
    };
}

export default function SiteToolbar({
    search,
    onSearchChange,
    onSearchKeyDown,
    onClearSearch,
    filter,
    onFilterChange,
    onReset,
    onAddSite,
    onExportCsv,
    can = { create: true }
}: SiteToolbarProps) {
    return (
        <>
            {/* Traffic Legend Bar */}
            <div 
                className="d-flex align-items-center gap-2 mb-3 px-3 py-2" 
                style={{ 
                    background: 'rgba(255,255,255,0.7)', 
                    borderRadius: '14px', 
                    border: '1px solid rgba(0,0,0,0.04)', 
                    fontSize: '0.78rem', 
                    flexWrap: 'wrap', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
                }}
            >
                <span style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>
                    <i className="bi bi-info-circle-fill me-1" style={{ color: 'var(--blue-1)' }}></i>
                    Indikator Beban Trafik (RPM):
                </span>
                <span className="badge" style={{ background: 'rgba(14,165,163,0.12)', color: 'var(--teal-1)', border: '1px solid rgba(14,165,163,0.25)', fontWeight: 600 }}>
                    🟢 Normal (10 - 450 req/m)
                </span>
                <span className="badge" style={{ background: 'rgba(2,132,199,0.12)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.25)', fontWeight: 600 }}>
                    🔵 Sedang (451 - 1.200 req/m)
                </span>
                <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)', fontWeight: 600 }}>
                    🟡 Padat / Waspada (1.201 - 3.000 req/m)
                </span>
                <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 600 }}>
                    🔴 Bahaya / Flood (&gt;3.000 req/m)
                </span>
                <span className="badge" style={{ background: 'rgba(100,116,139,0.12)', color: '#64748b', border: '1px solid rgba(100,116,139,0.25)', fontWeight: 600 }}>
                    ❌ Offline (0 req/m)
                </span>
            </div>

            {/* Main Toolbar */}
            <div className="toolbar">
                <div className="search-local">
                    <i className="bi bi-search"></i>
                    <input 
                        type="text" 
                        placeholder="Cari nama situs, URL, kategori, atau PIC..." 
                        value={search}
                        onChange={onSearchChange}
                        onKeyDown={onSearchKeyDown}
                        style={{ paddingRight: search ? '2.4rem' : '1rem' }}
                    />
                    {search && onClearSearch && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="clear-search-btn"
                            title="Hapus pencarian"
                            aria-label="Hapus pencarian"
                        >
                            <i className="bi bi-x-circle-fill"></i>
                        </button>
                    )}
                </div>
                
                <div className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>
                    Semua
                </div>
                <div className={`filter-chip ${filter === 'up' ? 'active' : ''}`} onClick={() => onFilterChange('up')}>
                    <span className="chip-dot" style={{ background: 'var(--teal-1)' }}></span>Online
                </div>
                <div className={`filter-chip ${filter === 'down' ? 'active' : ''}`} onClick={() => onFilterChange('down')}>
                    <span className="chip-dot" style={{ background: '#e0453a' }}></span>Down
                </div>
                <div className={`filter-chip ${filter === 'warn' ? 'active' : ''}`} onClick={() => onFilterChange('warn')}>
                    <span className="chip-dot" style={{ background: 'var(--sun)' }}></span>Lambat
                </div>
                <div className={`filter-chip ${filter === 'paused' ? 'active' : ''}`} onClick={() => onFilterChange('paused')} title="Situs Dinonaktifkan">
                    <i className="bi bi-pause-circle"></i>
                </div>

                <div className="d-flex align-items-center gap-2 ms-auto">
                    <button 
                        className="btn btn-light" 
                        style={{ 
                            height: '38px', borderRadius: '10px', padding: '0 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                            border: '1px solid rgba(0,0,0,0.08)', background: '#ffffff', color: 'var(--ink-dark)', fontSize: '0.82rem', fontWeight: 600,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)', transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }} 
                        onClick={onReset} 
                        title="Reset Filter & Segarkan Data"
                    >
                        <i className="bi bi-arrow-clockwise" style={{ fontSize: '1rem' }}></i> Reset
                    </button>

                    {onExportCsv && (
                        <button
                            type="button"
                            className="btn btn-light"
                            style={{
                                height: '38px', borderRadius: '10px', padding: '0 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                border: '1px solid rgba(0,0,0,0.08)', background: '#ffffff', color: 'var(--ink-dark)', fontSize: '0.82rem', fontWeight: 600,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)', transition: 'all 0.2s', whiteSpace: 'nowrap'
                            }}
                            onClick={onExportCsv}
                            title="Unduh Rekap Inventaris Aset Web format CSV/Excel"
                        >
                            <i className="bi bi-file-earmark-spreadsheet-fill text-success" style={{ fontSize: '0.95rem' }}></i>
                            <span>Ekspor CSV</span>
                        </button>
                    )}

                    {can?.create && (
                        <button className="btn-add-site" style={{ margin: 0 }} onClick={onAddSite}>
                            <i className="bi bi-plus-lg"></i><span>Daftarkan Situs</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
