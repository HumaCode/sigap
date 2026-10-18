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
    onReset?: () => void;
    hasActiveFilters?: boolean;
    canExport?: boolean;
    onExportPdf: () => void;
    onExportCsv?: () => void;
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
    onReset,
    hasActiveFilters,
    canExport = false,
    onExportPdf,
    onExportCsv,
}: ReportToolbarProps) {
    return (
        <div className="report-toolbar d-flex align-items-center gap-2 flex-wrap mb-3">
            {/* Search Box */}
            <div className="search-local me-2">
                <i 
                    className="bi bi-search" 
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }}
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
                        padding: '0.55rem 2.4rem 0.55rem 2.3rem', 
                        fontSize: '0.84rem', 
                        width: '100%', 
                        background: 'rgba(255,255,255,0.7)', 
                        fontFamily: 'Poppins, sans-serif' 
                    }}
                />
                {searchTerm && (
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

            {/* Reset Button */}
            {onReset && hasActiveFilters && (
                <button
                    type="button"
                    className="btn-reset-filter"
                    onClick={onReset}
                    title="Reset semua filter dan pencarian laporan"
                >
                    <i className="bi bi-arrow-counterclockwise"></i>
                    <span>Reset</span>
                </button>
            )}
            
            {/* Action Buttons */}
            {canExport && (
                <div className="d-flex align-items-center gap-2 ms-auto">
                    <Tooltip title="Export Spreadsheet Excel/CSV" description="Unduh file rekapitulasi data uptime bulanan berformat .csv yang kompatibel dengan Microsoft Excel" variant="dark">
                        <button 
                            type="button" 
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5" 
                            style={{ 
                                height: '36px', 
                                borderRadius: '10px', 
                                padding: '0 0.85rem', 
                                fontWeight: 600, 
                                fontSize: '0.8rem',
                                border: '1.5px solid rgba(15, 42, 63, 0.15)',
                                background: '#ffffff',
                                color: '#0f2a3f',
                                cursor: 'pointer'
                            }}
                            onClick={onExportCsv}
                        >
                            <i className="bi bi-file-earmark-spreadsheet-fill text-success" style={{ fontSize: '0.95rem' }}></i>
                            <span>Ekspor CSV</span>
                        </button>
                    </Tooltip>

                    <Tooltip title="Export Laporan PDF" description="Buka dokumen pratinjau resmi & cetak laporan uptime" variant="teal">
                        <button className="btn-export" onClick={onExportPdf}>
                            <i className="bi bi-file-earmark-pdf-fill"></i>
                            <span>Cetak PDF</span>
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
}
