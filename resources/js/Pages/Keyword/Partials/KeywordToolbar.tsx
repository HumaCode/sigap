import React from 'react';

interface KeywordToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    canCreate?: boolean;
    onAdd: () => void;
}

export default function KeywordToolbar({
    searchTerm,
    onSearchChange,
    onClearSearch,
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

            <div className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>Semua</div>
            <div className={`filter-chip ${activeFilter === 'judol' ? 'active' : ''}`} onClick={() => onFilterChange('judol')}>Judi Online</div>
            <div className={`filter-chip ${activeFilter === 'obat' ? 'active' : ''}`} onClick={() => onFilterChange('obat')}>Obat Terlarang</div>
            <div className={`filter-chip ${activeFilter === 'hidden' ? 'active' : ''}`} onClick={() => onFilterChange('hidden')}>Teks Tersembunyi</div>
            <div className={`filter-chip ${activeFilter === 'newpage' ? 'active' : ''}`} onClick={() => onFilterChange('newpage')}>Halaman Baru</div>
            <div className={`filter-chip ${activeFilter === 'phising' ? 'active' : ''}`} onClick={() => onFilterChange('phising')}>Phising</div>

            {canCreate && (
                <button type="button" className="btn-add ms-auto" onClick={onAdd}>
                    <i className="bi bi-plus-lg"></i>
                    <span className="d-none d-sm-inline">Tambah Kata Kunci</span>
                </button>
            )}
        </div>
    );
}
