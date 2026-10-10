import React from 'react';

interface DetectionToolbarProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onClearSearch: () => void;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    statusFilter: string;
    onStatusFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onMarkAllReviewed: () => void;
    canMarkAllReviewed?: boolean;
    onRefresh: () => void;
    isRefreshing?: boolean;
}

export default function DetectionToolbar({
    searchTerm,
    onSearchChange,
    onSearchKeyDown,
    onClearSearch,
    activeFilter,
    onFilterChange,
    statusFilter,
    onStatusFilterChange,
    onMarkAllReviewed,
    canMarkAllReviewed = true,
    onRefresh,
    isRefreshing = false,
}: DetectionToolbarProps) {
    return (
        <div>
            {/* Live feed sub-header bar */}
            <div className="live-feed-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                    <span className="scan-pulse"></span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink-soft)' }}>
                        Pemindaian berjalan otomatis — entri baru akan muncul di atas secara real-time
                    </span>
                </div>
                
                <div className="d-flex align-items-center gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 500 }}>Status:</span>
                        <select 
                            value={statusFilter} 
                            onChange={onStatusFilterChange}
                            style={{ 
                                borderRadius: '10px', 
                                border: '1px solid var(--line)', 
                                padding: '0.25rem 0.65rem', 
                                fontSize: '0.8rem', 
                                background: '#fff', 
                                color: 'var(--ink)', 
                                fontWeight: 500 
                            }}
                        >
                            <option value="all">Semua Status</option>
                            <option value="new">Baru (Ditemukan)</option>
                            <option value="reviewed">Telah Ditinjau</option>
                            <option value="blocked">Diblokir</option>
                            <option value="false_positive">Bukan Spam</option>
                        </select>
                    </div>

                    {canMarkAllReviewed && (
                        <button 
                            type="button"
                            className="btn btn-sm d-inline-flex align-items-center gap-1.5 shadow-sm ms-2"
                            style={{ 
                                border: '1px solid var(--line)', 
                                color: 'var(--ink)', 
                                background: 'rgba(255,255,255,0.95)', 
                                borderRadius: '10px', 
                                padding: '0.3rem 0.75rem', 
                                fontSize: '0.78rem', 
                                fontWeight: 600, 
                                fontFamily: 'Poppins, sans-serif' 
                            }}
                            onClick={onMarkAllReviewed}
                            title="Tandai Semua Baru Sebagai Ditinjau"
                        >
                            <i className="bi bi-check2-all" style={{ color: 'var(--teal-1)', fontSize: '0.9rem' }}></i>
                            <span>Tandai Semua Ditinjau</span>
                        </button>
                    )}

                    <button 
                        type="button"
                        className="btn btn-sm btn-light shadow-sm d-flex align-items-center justify-content-center"
                        style={{ 
                            border: '1px solid var(--line)', 
                            color: 'var(--ink-soft)', 
                            background: 'rgba(255,255,255,0.9)', 
                            borderRadius: '10px', 
                            width: '32px', 
                            height: '32px' 
                        }}
                        title="Segarkan Data"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                    >
                        <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spinner-border spinner-border-sm' : ''}`} style={isRefreshing ? { borderWidth: '2px' } : {}}></i>
                    </button>
                </div>
            </div>

            {/* Category Filter and Search Toolbar */}
            <div className="toolbar">
                <div className="search-local position-relative">
                    <i className="bi bi-search"></i>
                    <input 
                        type="text" 
                        placeholder="Cari kata kunci, URL, situs..."
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        onKeyDown={onSearchKeyDown}
                        style={{ paddingRight: searchTerm ? '2rem' : undefined }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            style={{ 
                                position: 'absolute', 
                                right: '0.65rem', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--ink-faint)', 
                                cursor: 'pointer', 
                                padding: '0.2rem' 
                            }}
                            title="Hapus pencarian"
                        >
                            <i className="bi bi-x-circle-fill"></i>
                        </button>
                    )}
                </div>
                <div className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>Semua Deteksi</div>
                <div className={`filter-chip ${activeFilter === 'judol' ? 'active' : ''}`} onClick={() => onFilterChange('judol')}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c8332a', display: 'inline-block' }}></span>Judi Online</div>
                <div className={`filter-chip ${activeFilter === 'obat' ? 'active' : ''}`} onClick={() => onFilterChange('obat')}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--violet)', display: 'inline-block' }}></span>Obat Terlarang</div>
                <div className={`filter-chip ${activeFilter === 'hidden' ? 'active' : ''}`} onClick={() => onFilterChange('hidden')}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue-1)', display: 'inline-block' }}></span>Teks Tersembunyi</div>
                <div className={`filter-chip ${activeFilter === 'newpage' ? 'active' : ''}`} onClick={() => onFilterChange('newpage')}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal-1)', display: 'inline-block' }}></span>Halaman Baru</div>
                <div className={`filter-chip ${activeFilter === 'uptime' ? 'active' : ''}`} onClick={() => onFilterChange('uptime')}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }}></span>Log Uptime HTTP</div>
            </div>
        </div>
    );
}
