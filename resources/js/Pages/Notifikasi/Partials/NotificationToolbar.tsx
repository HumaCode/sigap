import React from 'react';

interface NotificationToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onClearSearch?: () => void;
    selectedStatus: string;
    onStatusChange: (status: string) => void;
    selectedSeverity: string;
    onSeverityChange: (severity: string) => void;
    onReset: () => void;
}

export default function NotificationToolbar({
    searchTerm,
    onSearchChange,
    onSearchKeyDown,
    onClearSearch,
    selectedStatus,
    onStatusChange,
    selectedSeverity,
    onSeverityChange,
    onReset,
}: NotificationToolbarProps) {
    const severities = [
        { id: 'all', label: 'Semua Tingkat' },
        { id: 'critical', label: 'Kritis' },
        { id: 'warning', label: 'Peringatan' },
        { id: 'info', label: 'Info' },
    ];

    const hasActiveFilter =
        searchTerm.trim() !== '' ||
        selectedStatus !== 'all' ||
        selectedSeverity !== 'all';

    return (
        <div className="glass-card mb-4 p-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
                {/* Search input */}
                <div className="search-local position-relative" style={{ minWidth: '240px', maxWidth: '320px' }}>
                    <i
                        className="bi bi-search position-absolute"
                        style={{
                            left: '0.85rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--ink-faint)',
                            fontSize: '0.85rem',
                            pointerEvents: 'none',
                        }}
                    ></i>
                    <input
                        type="text"
                        placeholder="Cari judul, konten, situs..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={onSearchKeyDown}
                        style={{
                            borderRadius: '12px',
                            border: '1.5px solid var(--line)',
                            padding: '0.55rem 2.4rem 0.55rem 2.3rem',
                            fontSize: '0.85rem',
                            width: '100%',
                            background: 'rgba(255,255,255,0.75)',
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    />
                    {searchTerm.length > 0 && (
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
                                height: '22px',
                                color: 'var(--ink-faint)',
                            }}
                            title="Bersihkan pencarian"
                            aria-label="Bersihkan pencarian"
                        >
                            <i className="bi bi-x-circle-fill" style={{ fontSize: '0.95rem' }}></i>
                        </button>
                    )}
                </div>

                {/* Status Dropdown */}
                <select
                    value={selectedStatus}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="select-mini"
                    style={{
                        borderRadius: '10px',
                        border: '1.5px solid var(--line)',
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        background: 'rgba(255,255,255,0.75)',
                        fontFamily: 'Poppins, sans-serif',
                        color: 'var(--ink-soft)',
                    }}
                >
                    <option value="all">Semua Status</option>
                    <option value="unread">Hanya Belum Dibaca</option>
                    <option value="read">Telah Dibaca</option>
                </select>

                {/* Severity Filter Chips */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    {severities.map((s) => {
                        const isActive = selectedSeverity === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => onSeverityChange(s.id)}
                                className={`filter-chip ${isActive ? 'active' : ''}`}
                                style={{
                                    fontSize: '0.78rem',
                                    padding: '0.45rem 0.85rem',
                                    borderRadius: '10px',
                                    border: '1.5px solid',
                                    borderColor: isActive ? 'var(--teal-1)' : 'var(--line)',
                                    background: isActive ? 'var(--teal-1)' : 'rgba(255,255,255,0.7)',
                                    color: isActive ? '#fff' : 'var(--ink-soft)',
                                    fontWeight: isActive ? 600 : 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {s.label}
                            </button>
                        );
                    })}
                </div>

                {/* Reset button */}
                {hasActiveFilter && (
                    <button
                        onClick={onReset}
                        className="btn btn-sm text-secondary d-flex align-items-center gap-1 border-0"
                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.7rem' }}
                        title="Reset Filter"
                    >
                        <i className="bi bi-x-circle"></i>
                        <span>Reset</span>
                    </button>
                )}
            </div>
        </div>
    );
}
