import React from 'react';
import Tooltip from '@/Components/Tooltip';

interface ReportToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onClearSearch: () => void;
    rangeFilter: string;
    onRangeChange: (range: string) => void;
    categoryFilter: string;
    onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    canExport?: boolean;
    onExportPdf: () => void;
}

export default function ReportToolbar({
    searchTerm,
    onSearchChange,
    onSearchKeyDown,
    onClearSearch,
    rangeFilter,
    onRangeChange,
    categoryFilter,
    onCategoryChange,
    canExport = false,
    onExportPdf,
}: ReportToolbarProps) {
    return (
        <div className="report-toolbar d-flex align-items-center gap-2 flex-wrap mb-3">
            {/* Search Box */}
            <div className="search-local me-2" style={{ position: 'relative', minWidth: '220px', maxWidth: '300px' }}>
                <i 
                    className="bi bi-search" 
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}
                ></i>
                <input 
                    type="text" 
                    placeholder="Cari nama atau URL situs..." 
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                    style={{ 
                        borderRadius: '12px', 
                        border: '1.5px solid var(--line)', 
                        padding: '0.5rem 2.2rem 0.5rem 2.3rem', 
                        fontSize: '0.84rem', 
                        width: '100%', 
                        background: 'rgba(255,255,255,0.7)', 
                        fontFamily: 'Poppins, sans-serif' 
                    }}
                />
                {searchTerm && (
                    <Tooltip title="Hapus Pencarian" description="Bersihkan kata kunci filter pencarian" variant="dark">
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
                        >
                            <i className="bi bi-x-circle-fill"></i>
                        </button>
                    </Tooltip>
                )}
            </div>

            {/* Range Filter Chips */}
            <Tooltip title="Periode 24 Jam" description="Tampilkan data ketersediaan 24 jam terakhir" variant="dark">
                <div className={`range-chip ${rangeFilter === '24h' ? 'active' : ''}`} onClick={() => onRangeChange('24h')}>24 Jam</div>
            </Tooltip>
            <Tooltip title="Periode 7 Hari" description="Tampilkan data ketersediaan 7 hari terakhir" variant="dark">
                <div className={`range-chip ${rangeFilter === '7d' ? 'active' : ''}`} onClick={() => onRangeChange('7d')}>7 Hari</div>
            </Tooltip>
            <Tooltip title="Periode 30 Hari" description="Tampilkan data ketersediaan 30 hari terakhir" variant="dark">
                <div className={`range-chip ${rangeFilter === '30d' ? 'active' : ''}`} onClick={() => onRangeChange('30d')}>30 Hari</div>
            </Tooltip>
            <Tooltip title="Periode 90 Hari" description="Tampilkan data ketersediaan 90 hari terakhir" variant="dark">
                <div className={`range-chip ${rangeFilter === '90d' ? 'active' : ''}`} onClick={() => onRangeChange('90d')}>90 Hari</div>
            </Tooltip>
            
            {/* Category Selector */}
            <select className="select-site d-none d-md-block" value={categoryFilter} onChange={onCategoryChange}>
                <option value="Semua Kategori Situs">Semua Kategori Situs</option>
                <option value="Portal Utama">Portal Utama</option>
                <option value="SPBE">SPBE</option>
                <option value="PPID">PPID</option>
            </select>
            
            {/* PDF Export Button */}
            {canExport && (
                <Tooltip title="Export Laporan PDF" description="Buka dokumen pratinjau resmi & cetak laporan uptime" variant="teal">
                    <button className="btn-export ms-auto" onClick={onExportPdf}>
                        <i className="bi bi-file-earmark-pdf-fill"></i>
                        <span>Cetak PDF</span>
                    </button>
                </Tooltip>
            )}
        </div>
    );
}
