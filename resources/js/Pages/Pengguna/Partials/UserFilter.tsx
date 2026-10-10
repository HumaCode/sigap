import React from 'react';

interface UserFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    selectedRole: string;
    onRoleChange: (role: string) => void;
    selectedStatus: string;
    onStatusChange: (status: string) => void;
    onReset: () => void;
    onOpenCreateModal: () => void;
}

export default function UserFilter({
    searchTerm,
    onSearchChange,
    onSearchKeyDown,
    selectedRole,
    onRoleChange,
    selectedStatus,
    onStatusChange,
    onReset,
    onOpenCreateModal,
}: UserFilterProps) {
    const roles = [
        { id: 'all', label: 'Semua Peran' },
        { id: 'dev', label: 'Developer' },
        { id: 'admin', label: 'Administrator' },
        { id: 'user', label: 'Pengguna' },
    ];

    const hasActiveFilter = searchTerm.trim() !== '' || selectedRole !== 'all' || selectedStatus !== 'all';

    return (
        <div className="glass-card mb-4 p-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
            {/* Left side: Search and Filters */}
            <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
                {/* Search input */}
                <div className="search-local position-relative" style={{ minWidth: '240px', maxWidth: '320px' }}>
                    <i className="bi bi-search position-absolute" style={{ left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', fontSize: '0.85rem' }}></i>
                    <input
                        type="text"
                        placeholder="Cari nama, username, email... (Enter)"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={onSearchKeyDown}
                        style={{
                            borderRadius: '12px',
                            border: '1.5px solid var(--line)',
                            padding: '0.55rem 1rem 0.55rem 2.4rem',
                            fontSize: '0.85rem',
                            width: '100%',
                            background: 'rgba(255,255,255,0.75)',
                            fontFamily: 'Poppins, sans-serif'
                        }}
                    />
                </div>

                {/* Role Chips */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    {roles.map((r) => {
                        const isActive = selectedRole === r.id;
                        return (
                            <button
                                key={r.id}
                                onClick={() => onRoleChange(r.id)}
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
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {r.label}
                            </button>
                        );
                    })}
                </div>

                {/* Status Select */}
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
                        color: 'var(--ink-soft)'
                    }}
                >
                    <option value="all">Semua Status</option>
                    <option value="active">Hanya Aktif</option>
                    <option value="inactive">Nonaktif</option>
                </select>

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

            {/* Right side: Add User button */}
            <div>
                <button
                    onClick={onOpenCreateModal}
                    className="btn d-flex align-items-center gap-1.5 shadow-sm"
                    style={{
                        background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.55rem 1.1rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        fontFamily: 'Poppins, sans-serif'
                    }}
                >
                    <i className="bi bi-person-plus-fill" style={{ fontSize: '0.95rem' }}></i>
                    <span>Tambah Pengguna</span>
                </button>
            </div>
        </div>
    );
}
