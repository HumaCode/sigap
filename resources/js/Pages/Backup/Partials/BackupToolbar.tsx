import React from 'react';

interface BackupToolbarProps {
    search: string;
    onSearchChange: (val: string) => void;
    siteId: string;
    onSiteIdChange: (val: string) => void;
    type: string;
    onTypeChange: (val: string) => void;
    onReset: () => void;
    onOpenCreateModal: () => void;
    sshSites: Array<{ id: string; name: string; url: string }>;
}

export default function BackupToolbar({
    search,
    onSearchChange,
    siteId,
    onSiteIdChange,
    type,
    onTypeChange,
    onReset,
    onOpenCreateModal,
    sshSites,
}: BackupToolbarProps) {
    return (
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 p-3 rounded-4"
            style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(226,232,240,0.8)',
            }}
        >
            {/* Search & Filters */}
            <div className="d-flex align-items-center flex-wrap gap-2.5 flex-grow-1">
                {/* Search */}
                <div className="position-relative" style={{ minWidth: '220px', maxWidth: '320px', flex: 1 }}>
                    <i 
                        className="bi bi-search position-absolute top-50 translate-middle-y text-muted"
                        style={{ left: '12px', fontSize: '0.85rem' }}
                    ></i>
                    <input 
                        type="text"
                        className="form-control"
                        style={{
                            paddingLeft: '34px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.85rem',
                            background: '#ffffff',
                        }}
                        placeholder="Cari file arsip atau nama situs..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Filter by Site */}
                <select
                    className="form-select"
                    style={{
                        width: 'auto',
                        minWidth: '180px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.85rem',
                        background: '#ffffff',
                    }}
                    value={siteId}
                    onChange={(e) => onSiteIdChange(e.target.value)}
                >
                    <option value="">Semua Situs</option>
                    {sshSites.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>

                {/* Filter by Type */}
                <select
                    className="form-select"
                    style={{
                        width: 'auto',
                        minWidth: '140px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.85rem',
                        background: '#ffffff',
                    }}
                    value={type}
                    onChange={(e) => onTypeChange(e.target.value)}
                >
                    <option value="">Semua Tipe</option>
                    <option value="manual">Manual</option>
                    <option value="scheduled">Terjadwal</option>
                    <option value="pre_mitigation">Pre-Mitigasi</option>
                </select>

                {(search || siteId || type) && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5"
                        style={{ borderRadius: '12px', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        onClick={onReset}
                    >
                        <i className="bi bi-x-circle"></i> Reset
                    </button>
                )}
            </div>

            {/* Action Button: Create Backup */}
            <button
                type="button"
                className="btn text-white d-inline-flex align-items-center gap-2 shadow-sm transition-all"
                style={{
                    background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    padding: '0.55rem 1.25rem',
                    border: 'none',
                }}
                onClick={onOpenCreateModal}
            >
                <i className="bi bi-plus-circle-fill"></i> Buat Cadangan Baru
            </button>
        </div>
    );
}
