import React from 'react';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import Tooltip from '@/Components/Tooltip';

interface UserItem {
    id: string;
    name: string;
    username: string;
    email: string;
    is_active: boolean;
    role_name: string;
    role_label: string;
    created_at: string;
    created_at_human: string;
}

interface UserTableProps {
    users: {
        data: UserItem[];
        meta: any;
    };
    onEdit: (user: UserItem) => void;
    onDelete: (user: UserItem) => void;
    onToggleStatus: (user: UserItem) => void;
}

export default function UserTable({ users, onEdit, onDelete, onToggleStatus }: UserTableProps) {
    const data = users.data || [];

    const getAvatarClass = (roleName: string) => {
        switch (roleName) {
            case 'dev':
                return 'avatar-dev';
            case 'admin':
                return 'avatar-admin';
            default:
                return 'avatar-user';
        }
    };

    const getRoleBadge = (roleName: string, roleLabel: string) => {
        switch (roleName) {
            case 'dev':
                return (
                    <span className="role-badge role-badge-dev">
                        <i className="bi bi-shield-shaded"></i> {roleLabel}
                    </span>
                );
            case 'admin':
                return (
                    <span className="role-badge role-badge-admin">
                        <i className="bi bi-person-gear"></i> {roleLabel}
                    </span>
                );
            default:
                return (
                    <span className="role-badge role-badge-user">
                        <i className="bi bi-person"></i> {roleLabel}
                    </span>
                );
        }
    };

    if (data.length === 0) {
        return (
            <div className="glass-card p-5">
                <EmptyState
                    icon="bi-people"
                    title="Tidak Ada Pengguna Ditemukan"
                    description="Tidak ada akun pengguna yang sesuai dengan kriteria filter atau pencarian Anda."
                />
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div className="table-responsive">
                <table className="table table-borderless align-middle mb-0" style={{ fontSize: '0.88rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(15,42,63,0.03)', borderBottom: '1.5px solid var(--line)', color: 'var(--ink-faint)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <th className="py-3 px-4" style={{ width: '32%' }}>Pengguna & Identitas</th>
                            <th className="py-3 px-3" style={{ width: '25%' }}>Email & Kontak</th>
                            <th className="py-3 px-3" style={{ width: '18%' }}>Peran / Role</th>
                            <th className="py-3 px-3 text-center" style={{ width: '12%' }}>Status Akun</th>
                            <th className="py-3 px-4 text-end" style={{ width: '13%' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((user) => {
                            const initials = user.name
                                ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
                                : user.username.slice(0, 2).toUpperCase();

                            return (
                                <tr key={user.id} className="user-row">
                                    {/* User Avatar, Name & Username */}
                                    <td className="py-3.5 px-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`users-avatar ${getAvatarClass(user.role_name)}`}>
                                                {initials}
                                            </div>
                                            <div>
                                                <div className="fw-semibold text-dark" style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>
                                                    {user.name}
                                                </div>
                                                <div className="d-flex align-items-center gap-2 mt-0.5" style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
                                                    <span>@{user.username}</span>
                                                    <span>•</span>
                                                    <span>Dibuat {user.created_at_human}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className="py-3.5 px-3">
                                        <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.86rem' }}>
                                            <i className="bi bi-envelope text-muted"></i>
                                            <span className="text-truncate" style={{ maxWidth: '220px' }}>{user.email}</span>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="py-3.5 px-3">
                                        {getRoleBadge(user.role_name, user.role_label)}
                                    </td>

                                    {/* Status Toggle */}
                                    <td className="py-3.5 px-3 text-center">
                                        <div className="d-inline-flex align-items-center gap-2">
                                            <Tooltip
                                                title={user.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                                                description={user.is_active ? 'Pengguna tidak dapat login' : 'Izinkan akses masuk'}
                                                variant={user.is_active ? 'amber' : 'teal'}
                                            >
                                                <label className="status-toggle-switch mb-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={user.is_active}
                                                        onChange={() => onToggleStatus(user)}
                                                    />
                                                    <span className="status-slider"></span>
                                                </label>
                                            </Tooltip>
                                            <span 
                                                className="fw-semibold" 
                                                style={{ 
                                                    fontSize: '0.76rem', 
                                                    color: user.is_active ? 'var(--teal-1)' : 'var(--ink-faint)' 
                                                }}
                                            >
                                                {user.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3.5 px-4 text-end">
                                        <div className="d-inline-flex align-items-center gap-1.5">
                                            <Tooltip 
                                                title="Edit Pengguna" 
                                                description="Ubah data & perizinan peran"
                                                variant="blue"
                                            >
                                                <button
                                                    onClick={() => onEdit(user)}
                                                    className="action-btn-custom edit"
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                            </Tooltip>

                                            <Tooltip 
                                                title="Hapus Pengguna" 
                                                description="Hapus akun secara permanen"
                                                variant="danger"
                                            >
                                                <button
                                                    onClick={() => onDelete(user)}
                                                    className="action-btn-custom delete"
                                                >
                                                    <i className="bi bi-trash3"></i>
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer */}
            {users.meta && users.meta.total > 0 && (
                <div className="px-4 py-3 border-top" style={{ borderColor: 'var(--line)' }}>
                    <Pagination meta={users.meta} />
                </div>
            )}
        </div>
    );
}
