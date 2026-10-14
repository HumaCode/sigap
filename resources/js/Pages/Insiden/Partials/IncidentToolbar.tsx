import React from 'react';
import SearchableSelect, { SelectOption } from '@/Components/SearchableSelect';

interface IncidentToolbarProps {
    sites?: any[];
    selectedSiteId: string;
    onSiteChange: (siteId: string) => void;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    statusFilter: string;
    onStatusFilterChange: (status: string) => void;
    onReset: () => void;
}

export default function IncidentToolbar({
    sites = [],
    selectedSiteId,
    onSiteChange,
    searchTerm,
    onSearchChange,
    onSearchKeyDown,
    statusFilter,
    onStatusFilterChange,
    onReset,
}: IncidentToolbarProps) {
    const filterOptions = [
        { key: 'all', label: 'Semua' },
        { key: 'critical', label: 'Kritis', dotColor: '#c8332a' },
        { key: 'open', label: 'Terbuka', dotColor: '#ef4444' },
        { key: 'investigating', label: 'Ditinjau', dotColor: '#d97706' },
        { key: 'resolved', label: 'Selesai', dotColor: '#0ea5a3' },
    ];

    const siteOptions: SelectOption[] = [
        {
            value: 'all',
            label: 'Semua Situs Terpantau',
            subLabel: 'Menampilkan seluruh insiden dari semua situs',
            icon: 'bi bi-grid-fill'
        },
        ...sites.map((s: any) => ({
            value: s.id,
            label: s.name,
            subLabel: s.url,
            badge: s.status === 'down' ? 'Down' : (s.status === 'warn' ? 'High Load' : 'Online'),
            icon: s.status === 'down' ? 'bi bi-x-octagon-fill' : 'bi bi-hdd-network-fill',
        }))
    ];

    return (
        <div className="incident-toolbar d-flex align-items-center gap-2.5 flex-wrap p-3.5 border-bottom border-light">
            <style>{`
                .incident-toolbar {
                    background: rgba(255, 255, 255, 0.85);
                }
                .incident-search-box {
                    position: relative;
                    flex: 1;
                    min-width: 220px;
                    max-width: 340px;
                }
                .incident-search-input {
                    border-radius: 12px;
                    border: 1.5px solid rgba(15, 42, 63, 0.12);
                    padding: 0.55rem 2.2rem 0.55rem 2.4rem;
                    font-size: 0.85rem;
                    width: 100%;
                    background: #ffffff;
                    color: #0f2a3f;
                    transition: all 0.2s ease;
                }
                .incident-search-input:focus {
                    outline: none;
                    border-color: #0ea5a3;
                    box-shadow: 0 0 0 3px rgba(14, 165, 163, 0.15);
                }
                .incident-filter-chip {
                    font-size: 0.8rem;
                    padding: 0.45rem 0.95rem;
                    border-radius: 12px;
                    border: 1.5px solid rgba(15, 42, 63, 0.1);
                    background: #ffffff;
                    color: #475569;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    white-space: nowrap;
                    user-select: none;
                }
                .incident-filter-chip:hover:not(.active) {
                    background: #f0fdfa;
                    border-color: rgba(14, 165, 163, 0.4);
                    color: #0ea5a3;
                }
                .incident-filter-chip.active {
                    background: #0f2a3f;
                    color: #ffffff;
                    border-color: #0f2a3f;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(15, 42, 63, 0.18);
                }
                .btn-incident-reset {
                    height: 36px;
                    border-radius: 10px;
                    padding: 0 0.85rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    border: 1px solid rgba(15, 42, 63, 0.12);
                    background: #ffffff;
                    color: #0f2a3f;
                    font-size: 0.82rem;
                    font-weight: 600;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
                    transition: all 0.2s ease;
                }
                .btn-incident-reset:hover {
                    background: #f8fafc;
                    border-color: #0ea5a3;
                    color: #0ea5a3;
                }
            `}</style>

            {/* Site Select2 Filter */}
            <div style={{ minWidth: '240px', maxWidth: '320px', flex: '1 1 240px' }}>
                <SearchableSelect
                    options={siteOptions}
                    value={selectedSiteId}
                    onChange={onSiteChange}
                    placeholder="Semua Situs Terpantau..."
                    searchPlaceholder="Cari nama atau URL situs..."
                    leadingIcon="bi bi-globe2"
                    dropdownWidth="360px"
                    triggerStyle={{
                        height: '40px',
                        borderRadius: '12px',
                        border: '1.5px solid rgba(15, 42, 63, 0.12)',
                        background: '#ffffff',
                        fontSize: '0.84rem',
                        fontWeight: 500,
                    }}
                />
            </div>

            {/* Search Input Box */}
            <div className="incident-search-box">
                <i
                    className="bi bi-search position-absolute text-muted"
                    style={{ left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.88rem' }}
                ></i>
                <input
                    type="text"
                    className="incident-search-input"
                    placeholder="Cari insiden, kata kunci..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="btn btn-sm btn-link position-absolute text-muted p-0"
                        style={{ right: '0.75rem', top: '50%', transform: 'translateY(-50%)', textDecoration: 'none' }}
                        title="Hapus pencarian"
                    >
                        <i className="bi bi-x-circle-fill" style={{ fontSize: '0.85rem' }}></i>
                    </button>
                )}
            </div>

            {/* Filter Chips */}
            {filterOptions.map((opt) => {
                const isActive = statusFilter === opt.key;
                return (
                    <div
                        key={opt.key}
                        className={`incident-filter-chip ${isActive ? 'active' : ''}`}
                        onClick={() => onStatusFilterChange(opt.key)}
                    >
                        {opt.dotColor && (
                            <span
                                style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: opt.dotColor,
                                    display: 'inline-block',
                                }}
                            />
                        )}
                        <span>{opt.label}</span>
                    </div>
                );
            })}

            {/* Reset Button */}
            <button
                type="button"
                className="btn-incident-reset ms-auto"
                onClick={onReset}
                title="Reset filter & muat ulang data"
            >
                <i className="bi bi-arrow-clockwise"></i>
                <span>Reset</span>
            </button>
        </div>
    );
}
