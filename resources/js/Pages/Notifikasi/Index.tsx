import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import '../../../css/notifications.css';

import NotificationHeader from './Partials/NotificationHeader';
import NotificationStatCards from './Partials/NotificationStatCards';
import NotificationToolbar from './Partials/NotificationToolbar';
import NotificationList from './Partials/NotificationList';
import { NotificationItemData } from './Partials/NotificationItem';
import ConfirmModal from '@/Components/ConfirmModal';
import PopupLoader from '@/Components/PopupLoader';
import { toast } from '@/Components/DynamicToast';

interface NotificationProps extends PageProps {
    notifications: {
        data: NotificationItemData[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
        severity?: string;
    };
    stats: {
        total: number;
        unread: number;
        read: number;
        critical: number;
        warning: number;
    };
    can?: {
        clearAll?: boolean;
        markAllRead?: boolean;
    };
}

export default function Index({
    notifications,
    filters,
    stats,
    can,
}: NotificationProps) {
    const pageProps = usePage<PageProps>().props as any;
    const safeFilters = filters || {};

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(safeFilters.status || 'all');
    const [selectedSeverity, setSelectedSeverity] = useState(safeFilters.severity || 'all');

    // Modals & Confirmation States
    const [showClearModal, setShowClearModal] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState<NotificationItemData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Loader State
    const [isLoading, setIsLoading] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Memuat notifikasi...');

    const searchQueryRef = useRef(safeFilters.search || '');
    const statusRef = useRef(safeFilters.status || 'all');
    const severityRef = useRef(safeFilters.severity || 'all');
    const isMounted = useRef(false);

    // Helper untuk menjaga URL browser SELALU bersih (/notifications) tanpa query string
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

    // Jalankan juga saat props notifications atau filters berubah
    useEffect(() => {
        cleanBrowserUrl();
    }, [notifications, filters]);

    // Sinkronisasi state internal saat props berubah
    useEffect(() => {
        if (safeFilters.search !== undefined) {
            setSearchTerm(safeFilters.search || '');
            searchQueryRef.current = safeFilters.search || '';
        }
        if (safeFilters.status !== undefined) {
            setSelectedStatus(safeFilters.status || 'all');
            statusRef.current = safeFilters.status || 'all';
        }
        if (safeFilters.severity !== undefined) {
            setSelectedSeverity(safeFilters.severity || 'all');
            severityRef.current = safeFilters.severity || 'all';
        }
    }, [safeFilters.search, safeFilters.status, safeFilters.severity]);

    // Flash Toast Notification (cegah pemanggilan ganda dengan ref)
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

        router.get(route('notifications.index'), params, {
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
            },
        });
    };

    // Debounced search (350ms)
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const delayDebounce = setTimeout(() => {
            if (searchTerm !== searchQueryRef.current) {
                searchQueryRef.current = searchTerm;
                const msg = searchTerm.trim()
                    ? `Mencari notifikasi "${searchTerm.trim()}"...`
                    : 'Memuat data notifikasi...';
                executeFilter(
                    { search: searchTerm.trim(), status: statusRef.current, severity: severityRef.current, page: 1 },
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
                ? `Mencari notifikasi "${searchTerm.trim()}"...`
                : 'Memuat data notifikasi...';
            executeFilter(
                { search: searchTerm.trim(), status: statusRef.current, severity: severityRef.current, page: 1 },
                msg
            );
        }
    };

    const handleClearSearch = () => {
        searchQueryRef.current = '';
        setSearchTerm('');
        executeFilter(
            { search: '', status: statusRef.current, severity: severityRef.current, page: 1 },
            'Memuat semua data notifikasi...'
        );
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        statusRef.current = status;
        const statusMap: Record<string, string> = {
            all: 'Semua Status',
            unread: 'Belum Dibaca',
            read: 'Telah Dibaca',
        };
        executeFilter(
            { search: searchQueryRef.current, status, severity: severityRef.current, page: 1 },
            `Memfilter notifikasi ${statusMap[status] || status}...`
        );
    };

    const handleSeverityChange = (severity: string) => {
        setSelectedSeverity(severity);
        severityRef.current = severity;
        const severityMap: Record<string, string> = {
            all: 'Semua Tingkat',
            critical: 'Kritis',
            warning: 'Peringatan',
            info: 'Info',
        };
        executeFilter(
            { search: searchQueryRef.current, status: statusRef.current, severity, page: 1 },
            `Memfilter alert ${severityMap[severity] || severity}...`
        );
    };

    const handleStatCardFilter = (type: 'status' | 'severity', val: string) => {
        if (type === 'status') {
            setSelectedStatus(val);
            statusRef.current = val;
            setSelectedSeverity('all');
            severityRef.current = 'all';
            executeFilter(
                { search: searchQueryRef.current, status: val, severity: 'all', page: 1 },
                val === 'unread' ? 'Memuat notifikasi belum dibaca...' : 'Memuat semua notifikasi...'
            );
        } else {
            setSelectedSeverity(val);
            severityRef.current = val;
            setSelectedStatus('all');
            statusRef.current = 'all';
            executeFilter(
                { search: searchQueryRef.current, status: 'all', severity: val, page: 1 },
                `Memuat alert berkategori ${val}...`
            );
        }
    };

    const handleReset = () => {
        searchQueryRef.current = '';
        statusRef.current = 'all';
        severityRef.current = 'all';
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedSeverity('all');
        executeFilter({ search: '', status: 'all', severity: 'all', page: 1 }, 'Mereset filter notifikasi...');
    };

    const handlePageChange = (page: number) => {
        executeFilter(
            { search: searchQueryRef.current, status: statusRef.current, severity: severityRef.current, page },
            `Memuat halaman ${page}...`
        );
    };

    const handleMarkAsRead = (item: NotificationItemData) => {
        setLoaderMessage('Menandai notifikasi sebagai dibaca...');
        setIsLoading(true);

        router.patch(
            route('notifications.read', item.id),
            {},
            {
                preserveScroll: true,
                replace: true,
                onSuccess: (page: any) => {
                    cleanBrowserUrl();
                    toast.success('Berhasil', 'Notifikasi telah ditandai sebagai sudah dibaca.');
                },
                onFinish: () => {
                    cleanBrowserUrl();
                    setIsLoading(false);
                },
                onError: () => {
                    cleanBrowserUrl();
                    setIsLoading(false);
                    toast.error('Gagal', 'Tidak dapat memperbarui status notifikasi.');
                },
            }
        );
    };

    const handleMarkAllRead = () => {
        setLoaderMessage('Menandai seluruh notifikasi sebagai sudah dibaca...');
        setIsLoading(true);

        router.post(
            route('notifications.mark-all-read'),
            {},
            {
                preserveScroll: true,
                replace: true,
                onSuccess: (page: any) => {
                    cleanBrowserUrl();
                    const msg = page?.props?.flash?.success || 'Seluruh notifikasi telah ditandai sebagai sudah dibaca.';
                    toast.success('Berhasil', msg);
                },
                onFinish: () => {
                    cleanBrowserUrl();
                    setIsLoading(false);
                },
                onError: () => {
                    cleanBrowserUrl();
                    setIsLoading(false);
                    toast.error('Gagal', 'Terjadi kesalahan sistem saat memperbarui notifikasi.');
                },
            }
        );
    };

    const handleOpenDeleteModal = (item: NotificationItemData) => {
        setDeletingItem(item);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (!deletingItem) return;
        setIsDeleting(true);

        router.delete(route('notifications.destroy', deletingItem.id), {
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                cleanBrowserUrl();
                toast.success('Berhasil', 'Notifikasi berhasil dihapus.');
                setIsDeleting(false);
                setShowDeleteModal(false);
                setDeletingItem(null);
            },
            onFinish: () => {
                cleanBrowserUrl();
                setIsDeleting(false);
            },
            onError: (errs) => {
                cleanBrowserUrl();
                setIsDeleting(false);
                const firstErr = Object.values(errs)[0];
                toast.error('Gagal Menghapus', typeof firstErr === 'string' ? firstErr : 'Terjadi kesalahan sistem.');
            },
        });
    };

    const handleConfirmClearAll = () => {
        setIsClearing(true);

        router.delete(route('notifications.clear-all'), {
            preserveScroll: true,
            replace: true,
            onSuccess: (page: any) => {
                cleanBrowserUrl();
                const msg = page?.props?.flash?.success || 'Seluruh riwayat notifikasi telah dibersihkan.';
                toast.success('Berhasil', msg);
                setIsClearing(false);
                setShowClearModal(false);
            },
            onFinish: () => {
                cleanBrowserUrl();
                setIsClearing(false);
            },
            onError: (errs) => {
                cleanBrowserUrl();
                setIsClearing(false);
                const firstErr = Object.values(errs)[0];
                toast.error('Gagal', typeof firstErr === 'string' ? firstErr : 'Terjadi kesalahan sistem.');
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pusat Notifikasi & Alert" />

            {/* Notification Header Partial */}
            <NotificationHeader
                total={stats.total}
                unread={stats.unread}
                onMarkAllRead={handleMarkAllRead}
                onClearAll={() => setShowClearModal(true)}
                isProcessing={isLoading}
            />

            {/* Stat Cards Partial */}
            <NotificationStatCards
                stats={stats}
                activeStatus={selectedStatus}
                activeSeverity={selectedSeverity}
                onFilterClick={handleStatCardFilter}
            />

            {/* Toolbar Partial */}
            <NotificationToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchKeyDown={handleSearchKeyDown}
                onClearSearch={handleClearSearch}
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusChange}
                selectedSeverity={selectedSeverity}
                onSeverityChange={handleSeverityChange}
                onReset={handleReset}
            />

            {/* Notification List Partial */}
            <NotificationList
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleOpenDeleteModal}
                onPageChange={handlePageChange}
            />

            {/* Modal Konfirmasi Hapus Notifikasi Tunggal */}
            {deletingItem && (
                <ConfirmModal
                    show={showDeleteModal}
                    title="Hapus Notifikasi?"
                    itemName={deletingItem.title}
                    itemDetails={deletingItem.site_name ? `${deletingItem.site_name} • ${deletingItem.category}` : deletingItem.category}
                    message="Pesan notifikasi ini akan dihapus dari riwayat kotak masuk Anda."
                    confirmText="Hapus Notifikasi"
                    cancelText="Batal"
                    variant="danger"
                    onConfirm={handleConfirmDelete}
                    onCancel={() => !isDeleting && setShowDeleteModal(false)}
                    isProcessing={isDeleting}
                />
            )}

            {/* Modal Konfirmasi Bersihkan Seluruh Riwayat */}
            <ConfirmModal
                show={showClearModal}
                title="Bersihkan Seluruh Notifikasi?"
                itemName={`${stats.total} Pesan Notifikasi`}
                itemDetails="Kotak Masuk Notifikasi Sistem SIGAP"
                message="Seluruh riwayat notifikasi dan alert yang tersimpan akan dihapus secara permanen dari akun Anda."
                confirmText="Ya, Bersihkan Semua"
                cancelText="Batal"
                variant="danger"
                warningPoints={[
                    'Seluruh daftar notifikasi yang tersimpan akan dikosongkan.',
                    'Data riwayat insiden dan status situs tetap aman tersimpan di sistem.',
                    'Tindakan ini permanen dan tidak dapat dibatalkan.',
                ]}
                onConfirm={handleConfirmClearAll}
                onCancel={() => !isClearing && setShowClearModal(false)}
                isProcessing={isClearing}
            />

            {/* Popup Loader */}
            <PopupLoader isOpen={isLoading} status="loading" message={loaderMessage} />
        </AuthenticatedLayout>
    );
}
