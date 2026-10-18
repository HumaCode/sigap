import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
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
    can?: {
        create?: boolean;
    };
}

export default function Index({ users, filters, stats, roles, can }: UsersProps) {
    const pageProps = usePage<PageProps>().props as any;
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

    const searchQueryRef = useRef(safeFilters.search || '');
    const roleRef = useRef(safeFilters.role || 'all');
    const statusRef = useRef(safeFilters.status || 'all');
    const isMounted = useRef(false);

    // Helper untuk menjaga URL browser SELALU bersih (/users) tanpa query string
    const cleanBrowserUrl = () => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState(window.history.state, '', window.location.pathname);
        }
    };

    // Bersihkan URL saat initial mount dan pasang router listener
    useEffect(() => {
        cleanBrowserUrl();

        const removeNavigateListener = router.on('navigate', () => {
            cleanBrowserUrl();
        });

        const removeFinishListener = router.on('finish', () => {
            cleanBrowserUrl();
        });

        return () => {
            removeNavigateListener();
            removeFinishListener();
        };
    }, []);

    // Jalankan juga saat props users atau filters berubah
    useEffect(() => {
        cleanBrowserUrl();
    }, [users, filters]);

    // Sinkronisasi state internal saat props berubah
    useEffect(() => {
        if (safeFilters.search !== undefined) {
            setSearchTerm(safeFilters.search || '');
            searchQueryRef.current = safeFilters.search || '';
        }
        if (safeFilters.role !== undefined) {
            setSelectedRole(safeFilters.role || 'all');
            roleRef.current = safeFilters.role || 'all';
        }
        if (safeFilters.status !== undefined) {
            setSelectedStatus(safeFilters.status || 'all');
            statusRef.current = safeFilters.status || 'all';
        }
    }, [safeFilters.search, safeFilters.role, safeFilters.status]);

    // Flash notifications (cegah pemanggilan ganda dengan ref)
    const lastFlashRef = useRef<string | null>(null);
    useEffect(() => {
        const success = pageProps.flash?.success;
        const error = pageProps.flash?.error;
        const key = `${success || ''}#${error || ''}`;

        if (key === '#') return;
        if (lastFlashRef.current === key) return;
        lastFlashRef.current = key;

        if (success) {
            toast.success('Berhasil', success);
        } else if (error) {
            toast.error('Peringatan', error);
        }
    }, [pageProps.flash?.success, pageProps.flash?.error]);

    const executeFilter = (params: Record<string, any>, msg: string) => {
        setLoaderMessage(msg);
        setIsLoading(true);
        const startTime = Date.now();

        router.get(route('users.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                cleanBrowserUrl();
            },
            onFinish: () => {
                cleanBrowserUrl();
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 350 - elapsed);
                setTimeout(() => {
                    cleanBrowserUrl();
                    setIsLoading(false);
                }, remaining);
            },
            onError: () => {
                cleanBrowserUrl();
                setIsLoading(false);
            }
        });
    };

    // Debounced search (menunggu ketikan berhenti 350ms sebelum request)
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const delayDebounce = setTimeout(() => {
            if (searchTerm !== searchQueryRef.current) {
                searchQueryRef.current = searchTerm;
                const msg = searchTerm.trim() 
                    ? `Mencari pengguna "${searchTerm.trim()}"...` 
                    : 'Memuat data pengguna...';
                executeFilter(
                    { search: searchTerm.trim(), role: roleRef.current, status: statusRef.current, page: 1 },
                    msg
                );
            }
        }, 350);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchQueryRef.current = searchTerm;
            const msg = searchTerm.trim() 
                ? `Mencari pengguna "${searchTerm.trim()}"...` 
                : 'Memuat data pengguna...';
            executeFilter({ search: searchTerm.trim(), role: roleRef.current, status: statusRef.current, page: 1 }, msg);
        }
    };

    const handleClearSearch = () => {
        searchQueryRef.current = '';
        setSearchTerm('');
        executeFilter(
            { search: '', role: roleRef.current, status: statusRef.current, page: 1 },
            'Memuat semua data pengguna...'
        );
    };

    const handleRoleChange = (role: string) => {
        setSelectedRole(role);
        roleRef.current = role;
        const roleLabels: Record<string, string> = {
            'all': 'Semua Peran',
            'dev': 'Developer',
            'admin': 'Administrator',
            'user': 'Pengguna'
        };
        executeFilter(
            { search: searchQueryRef.current, role, status: statusRef.current, page: 1 },
            `Memfilter pengguna ${roleLabels[role] || role}...`
        );
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        statusRef.current = status;
        executeFilter(
            { search: searchQueryRef.current, role: roleRef.current, status, page: 1 },
            status === 'active' ? 'Memuat pengguna aktif...' : (status === 'inactive' ? 'Memuat pengguna nonaktif...' : 'Memuat semua pengguna...')
        );
    };

    const handleReset = () => {
        searchQueryRef.current = '';
        roleRef.current = 'all';
        statusRef.current = 'all';
        setSearchTerm('');
        setSelectedRole('all');
        setSelectedStatus('all');
        executeFilter({ search: '', role: 'all', status: 'all', page: 1 }, 'Mereset filter pengguna...');
    };

    const handlePageChange = (page: number) => {
        executeFilter(
            { search: searchQueryRef.current, role: roleRef.current, status: statusRef.current, page },
            `Memuat halaman ${page}...`
        );
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
            replace: true,
            onSuccess: (page: any) => {
                cleanBrowserUrl();
                if (page?.props?.flash?.error) {
                    return;
                }
                if (!page?.props?.flash?.success) {
                    toast.success('Berhasil', `Status akun "${user.name}" berhasil diubah.`);
                }
            },
            onFinish: () => {
                cleanBrowserUrl();
                setIsLoading(false);
            },
            onError: (errs) => {
                cleanBrowserUrl();
                setIsLoading(false);
                const firstErr = Object.values(errs)[0];
                toast.error('Gagal', typeof firstErr === 'string' ? firstErr : 'Tidak dapat mengubah status pengguna.');
            }
        });
    };

    const canCreate = can?.create ?? true;

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
                            Kelola akun pengguna, penetapan peran (RBAC), dan hak akses sistem SIGAP — {stats.total} total akun terdaftar.
                        </p>
                    </div>
                </div>

                {canCreate && (
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
                )}
            </div>

            {/* Stat Cards Partial */}
            <StatCards stats={stats} activeRole={selectedRole} onFilterRole={handleRoleChange} />

            {/* Filter & Toolbar Partial */}
            <UserFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchKeyDown={handleSearchKeyDown}
                onClearSearch={handleClearSearch}
                selectedRole={selectedRole}
                onRoleChange={handleRoleChange}
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusChange}
                onReset={handleReset}
                onOpenCreateModal={handleOpenCreateModal}
                canCreate={canCreate}
            />

            {/* User Table Partial */}
            <UserTable
                users={users}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onToggleStatus={handleToggleStatus}
                onPageChange={handlePageChange}
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
