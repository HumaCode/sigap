import React from 'react';

interface ScorecardToolbarProps {
    search: string;
    onSearchChange: (val: string) => void;
    onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onClearSearch?: () => void;
    category: string;
    onCategoryChange: (cat: string) => void;
    categories: string[];
    onReset: () => void;
    onExportCsv: () => void;
    onPrint: () => void;
    canExport?: boolean;
}

export default function ScorecardToolbar({
    search,
    onSearchChange,
    onSearchKeyDown,
    onClearSearch,
    category,
    onCategoryChange,
    categories = [],
    onReset,
    onExportCsv,
    onPrint,
    canExport = true,
}: ScorecardToolbarProps) {
    return (
        <div className="d-flex align-items-center gap-2.5 flex-wrap p-3 mb-3 bg-white" style={{ borderRadius: '16px', border: '1.5px solid rgba(15, 42, 63, 0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', maxWidth: '340px', flex: 1 }}>
                <i 
                    className="bi bi-search position-absolute text-muted" 
                    style={{ left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', pointerEvents: 'none' }} 
                />
                <input 
                    type="text" 
                    placeholder="Cari situs atau domain..." 
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                    style={{
                        borderRadius: '12px',
                        border: '1.5px solid rgba(15, 42, 63, 0.12)',
                        padding: '0.55rem 2.4rem 0.55rem 2.3rem',
                        fontSize: '0.84rem',
                        width: '100%',
                        background: '#ffffff',
                        color: '#0f2a3f',
                        outline: 'none'
                    }}
                />
                {search && (
                    <button
                        type="button"
                        onClick={onClearSearch ? onClearSearch : () => onSearchChange('')}
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

            {/* Category Filter */}
            <select
                className="form-select"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                style={{
                    minWidth: '200px',
                    maxWidth: '260px',
                    height: '38px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(15, 42, 63, 0.12)',
                    fontSize: '0.84rem',
                    fontWeight: 500,
                    color: '#0f2a3f',
                    cursor: 'pointer'
                }}
            >
                <option value="all">Semua Kategori Situs</option>
                {categories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>

            {/* Action Buttons */}
            <div className="d-flex align-items-center gap-2 ms-auto">
                <button
                    type="button"
                    className="btn btn-light"
                    onClick={onReset}
                    title="Reset Filter"
                    style={{
                        height: '38px',
                        borderRadius: '10px',
                        padding: '0 0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        border: '1px solid rgba(15, 42, 63, 0.12)',
                        background: '#ffffff',
                        color: '#0f2a3f',
                        fontSize: '0.82rem',
                        fontWeight: 600
                    }}
                >
                    <i className="bi bi-arrow-clockwise"></i>
                    <span>Reset</span>
                </button>

                {canExport && (
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={onExportCsv}
                        title="Unduh Rapor Mutu format spreadsheet CSV/Excel"
                        style={{
                            height: '38px',
                            borderRadius: '10px',
                            padding: '0 0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            border: '1.5px solid rgba(14, 165, 163, 0.25)',
                            background: '#f0fdfa',
                            color: 'var(--teal-1)',
                            fontSize: '0.82rem',
                            fontWeight: 600
                        }}
                    >
                        <i className="bi bi-file-earmark-spreadsheet-fill"></i>
                        <span>Ekspor Excel (.CSV)</span>
                    </button>
                )}

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onPrint}
                    title="Buka Pratinjau Dokumen Cetak Resmi untuk Pimpinan"
                    style={{
                        height: '38px',
                        borderRadius: '10px',
                        padding: '0 1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        background: 'linear-gradient(135deg, #0ea5a3 0%, #0284c7 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(14, 165, 163, 0.25)'
                    }}
                >
                    <i className="bi bi-printer-fill"></i>
                    <span>Cetak Rapor Resmi</span>
                </button>
            </div>
        </div>
    );
}
