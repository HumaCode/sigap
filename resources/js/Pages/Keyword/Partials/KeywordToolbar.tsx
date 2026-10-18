import React from 'react';

interface KeywordToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
    onReset: () => void;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    canCreate?: boolean;
    onAdd: () => void;
}

export default function KeywordToolbar({
    searchTerm,
    onSearchChange,
    onClearSearch,
    onReset,
    activeFilter,
    onFilterChange,
    canCreate = true,
    onAdd,
}: KeywordToolbarProps) {
    return (
        <div className="toolbar flex-wrap gap-2">
            <div className="search-local position-relative">
                <i className="bi bi-search"></i>
                <input 
                    type="text" 
                    placeholder="Cari kata kunci atau deskripsi..." 
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{ padding: '0.55rem 2.4rem 0.55rem 2.3rem' }}
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={onClearSearch}
                        className="btn btn-sm btn-link position-absolute text-muted p-0"
                        style={{ 
                            right: '0.75rem', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            textDecoration: 'none', 
                            background: 'transparent', 
                            border: 'none', 
                            cursor: 'pointer', 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '22px',
                            height: '22px'
                        }}
                        title="Bersihkan pencarian"
                        aria-label="Bersihkan pencarian"
                    >
                        <i className="bi bi-x-circle-fill" style={{ fontSize: '0.95rem' }}></i>
                    </button>
                )}
            </div>

            <div className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>Semua</div>
            <div className={`filter-chip ${activeFilter === 'judol' ? 'active' : ''}`} onClick={() => onFilterChange('judol')}>Judi Online</div>
            <div className={`filter-chip ${activeFilter === 'obat' ? 'active' : ''}`} onClick={() => onFilterChange('obat')}>Obat Terlarang</div>
            <div className={`filter-chip ${activeFilter === 'hidden' ? 'active' : ''}`} onClick={() => onFilterChange('hidden')}>Teks Tersembunyi</div>
            <div className={`filter-chip ${activeFilter === 'newpage' ? 'active' : ''}`} onClick={() => onFilterChange('newpage')}>Halaman Baru</div>
            <div className={`filter-chip ${activeFilter === 'phising' ? 'active' : ''}`} onClick={() => onFilterChange('phising')}>Phising</div>

            {/* Reset Filter Button */}
            <button
                type="button"
                onClick={onReset}
                className="btn btn-sm btn-light ms-auto d-inline-flex align-items-center gap-1.5"
                style={{
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: '#ffffff',
                    color: 'var(--ink)'
                }}
                title="Reset Semua Filter"
            >
                <i className="bi bi-arrow-clockwise"></i>
                <span>Reset</span>
            </button>

            {canCreate && (
                <button type="button" className="btn-add ms-2" onClick={onAdd}>
                    <i className="bi bi-plus-lg"></i>
                    <span className="d-none d-sm-inline">Tambah Kata Kunci</span>
                </button>
            )}
        </div>
    );
}
