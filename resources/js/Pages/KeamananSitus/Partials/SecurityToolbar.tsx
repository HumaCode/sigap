import React from 'react';
import Tooltip from '@/Components/Tooltip';

interface SecurityToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onClearSearch: () => void;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onScanAll: () => void;
    isScanningAll: boolean;
    canScan?: boolean;
}

export default function SecurityToolbar({
    searchTerm,
    onSearchChange,
    onClearSearch,
    activeFilter,
    onFilterChange,
    onScanAll,
    isScanningAll,
    canScan = true,
}: SecurityToolbarProps) {
    const filterOptions = [
        { id: 'all', label: 'Semua' },
        { id: 'critical', label: 'Temuan Kritis' },
        { id: 'warn', label: 'Ada Peringatan' },
        { id: 'clean', label: 'Aman' },
    ];

    return (
        <div>
            {/* Grade Legend Bar */}
            <div className="d-flex align-items-center gap-3 px-3 pt-3 pb-2 flex-wrap" style={{ fontSize: '0.78rem', borderBottom: '1px solid var(--line)', background: 'rgba(255,255,255,0.4)', borderRadius: '16px 16px 0 0' }}>
                <span className="fw-semibold text-muted me-1">
                    <i className="bi bi-info-circle me-1" style={{ color: 'var(--teal-1)' }}></i>
                    Legenda Audit:
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#0ea5a3' }}></span> Grade A (≥90% Sempurna)
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#3b82f6' }}></span> Grade B (75-89% Baik)
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ffb648' }}></span> Grade C (60-74% Perbaikan)
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff7a6e' }}></span> Grade F (&lt;60% Kritis)
                </span>
                <span className="d-inline-flex align-items-center gap-1">
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }}></span> Offline (Ditangguhkan)
                </span>
            </div>

            {/* Toolbar Inputs and Action Controls */}
            <div className="toolbar flex-wrap gap-2">
                {/* Search Input with Clear Button */}
                <div className="search-local" style={{ position: 'relative' }}>
                    <i className="bi bi-search"></i>
                    <input 
                        type="text" 
                        placeholder="Cari nama situs atau URL..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{ paddingRight: searchTerm ? '2rem' : '1rem' }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="btn btn-sm border-0 position-absolute"
                            style={{ 
                                right: '0.4rem', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                background: 'transparent',
                                color: '#94a3b8',
                                padding: '0.2rem'
                            }}
                            title="Hapus pencarian"
                        >
                            <i className="bi bi-x-circle-fill"></i>
                        </button>
                    )}
                </div>

                {/* Filter Chips */}
                {filterOptions.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        className={`filter-chip border-0 ${activeFilter === f.id ? 'active' : ''}`}
                        onClick={() => onFilterChange(f.id)}
                    >
                        {f.label}
                    </button>
                ))}

                {/* Scan All Button */}
                {canScan && (
                    <div className="ms-auto">
                        <Tooltip 
                            title="Pindai Ulang Seluruh Situs" 
                            description="Audit keamanan header HTTP & sertifikat SSL untuk seluruh domain yang terdaftar."
                            variant="teal"
                        >
                            <button 
                                type="button"
                                className="btn-scan" 
                                onClick={onScanAll}
                                disabled={isScanningAll}
                            >
                                {isScanningAll ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        <span>Memindai...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-arrow-repeat"></i>
                                        <span>Pindai Ulang Semua</span>
                                    </>
                                )}
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>
        </div>
    );
}
