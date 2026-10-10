import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import '../../../css/users.css';

import StatCards from './Partials/StatCards';
import UserFilter from './Partials/UserFilter';
import UserTable from './Partials/UserTable';
import UserModal from './Partials/UserModal';
import DeleteUserModal from './Partials/DeleteUserModal';
import PopupLoader from '@/Components/PopupLoader';
import { toast } from '@/Components/DynamicToast';

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

interface RoleOption {
    id: string;
    name: string;
    slug?: string;
    description?: string;
}

interface UsersProps extends PageProps {
    users: {
        data: UserItem[];
        meta: any;
    };
    filters: {
        search?: string;
        role?: string;
        status?: string;
    };
    stats: {
        total: number;
        active: number;
        inactive: number;
        dev: number;
        admin: number;
        user: number;
    };
    roles: RoleOption[];
}

export default function Index({ users, filters, stats, roles }: UsersProps) {
    const safeFilters = filters || {};
    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [selectedRole, setSelectedRole] = useState(safeFilters.role || 'all');
    const [selectedStatus, setSelectedStatus] = useState(safeFilters.status || 'all');

    // Modals state
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

    // Popup loader state
    const [isLoading, setIsLoading] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Memuat data pengguna...');

    const executeFilter = (params: Record<string, any>, msg: string) => {
        setLoaderMessage(msg);
        setIsLoading(true);
        const startTime = Date.now();

        router.get(route('users.index'), params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 350 - elapsed);
                setTimeout(() => {
                    setIsLoading(false);
                }, remaining);
            },
            onError: () => {
                setIsLoading(false);
            }
        });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const msg = searchTerm.trim() 
                ? `Mencari pengguna "${searchTerm.trim()}"...` 
                : 'Memuat data pengguna...';
            executeFilter({ search: searchTerm, role: selectedRole, status: selectedStatus }, msg);
        }
    };

    const handleRoleChange = (role: string) => {
        setSelectedRole(role);
        const roleLabels: Record<string, string> = {
            'all': 'Semua Peran',
            'dev': 'Developer',
            'admin': 'Administrator',
            'user': 'Pengguna'
        };
        executeFilter(
            { search: searchTerm, role, status: selectedStatus },
            `Memfilter pengguna ${roleLabels[role] || role}...`
        );
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        executeFilter(
            { search: searchTerm, role: selectedRole, status },
            status === 'active' ? 'Memuat pengguna aktif...' : (status === 'inactive' ? 'Memuat pengguna nonaktif...' : 'Memuat semua pengguna...')
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedRole('all');
        setSelectedStatus('all');
        executeFilter({}, 'Mereset filter pengguna...');
    };

    const handleOpenCreateModal = () => {
        setEditingUser(null);
        setShowUserModal(true);
    };

    const handleEditUser = (user: UserItem) => {
        setEditingUser(user);
        setShowUserModal(true);
    };

    const handleDeleteUser = (user: UserItem) => {
        setDeletingUser(user);
        setShowDeleteModal(true);
    };

    const handleToggleStatus = (user: UserItem) => {
        setLoaderMessage(`Mengubah status akun ${user.name}...`);
        setIsLoading(true);

        router.patch(route('users.toggle-status', user.id), {}, {
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
            onError: (errs) => {
                const firstErr = Object.values(errs)[0];
                toast.error('Gagal', typeof firstErr === 'string' ? firstErr : 'Tidak dapat mengubah status pengguna.');
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pengguna & Peran" />

            {/* Page Header */}
            <div className="users-page-header mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="users-icon-badge">
                        <i className="bi bi-people-fill" style={{ fontSize: '1.35rem' }}></i>
                    </div>
                    <div>
                        <div className="page-title mb-0" style={{ lineHeight: 1.2 }}>Pengguna & Peran</div>
                        <p className="page-sub mb-0 mt-1" style={{ margin: 0 }}>
                            Kelola akun pengguna, penetapan peran (RBAC), dan hak akses sistem SIGAP — {stats.total} total akun.
                        </p>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button
                        onClick={handleOpenCreateModal}
                        className="btn shadow-sm d-flex align-items-center gap-1.5"
                        style={{
                            background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '0.55rem 1.15rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif'
                        }}
                    >
                        <i className="bi bi-person-plus-fill"></i>
                        <span>Tambah Pengguna</span>
                    </button>
                </div>
            </div>

            {/* Stat Cards Partial */}
            <StatCards stats={stats} onFilterRole={handleRoleChange} />

            {/* Filter & Toolbar Partial */}
            <UserFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchKeyDown={handleSearchKeyDown}
                selectedRole={selectedRole}
                onRoleChange={handleRoleChange}
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusChange}
                onReset={handleReset}
                onOpenCreateModal={handleOpenCreateModal}
            />

            {/* User Table Partial */}
            <UserTable
                users={users}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onToggleStatus={handleToggleStatus}
            />

            {/* Create & Edit Modal Partial */}
            <UserModal
                show={showUserModal}
                onClose={() => setShowUserModal(false)}
                user={editingUser}
                roles={roles}
            />

            {/* Delete Confirmation Modal Partial */}
            <DeleteUserModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                user={deletingUser}
            />

            {/* Popup Loader */}
            <PopupLoader isOpen={isLoading} status="loading" message={loaderMessage} />
        </AuthenticatedLayout>
    );
}
