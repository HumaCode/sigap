import React, { useState, useEffect } from 'react';
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

    // URL parameter masking (keep address bar clean as http://localhost:8000/notifications)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [notifications, filters]);

    // Flash Toast Notification
    useEffect(() => {
        if (pageProps.flash?.success) {
            toast.success('Berhasil', pageProps.flash.success);
        } else if (pageProps.flash?.error) {
            toast.error('Peringatan', pageProps.flash.error);
        }
    }, [pageProps.flash]);

    const executeFilter = (params: Record<string, any>, msg: string) => {
        setLoaderMessage(msg);
        setIsLoading(true);
        const startTime = Date.now();

        router.get(route('notifications.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            },
            onFinish: () => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 350 - elapsed);
                setTimeout(() => {
                    setIsLoading(false);
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }, remaining);
            },
            onError: () => {
                setIsLoading(false);
            },
        });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const msg = searchTerm.trim()
                ? `Mencari notifikasi "${searchTerm.trim()}"...`
                : 'Memuat data notifikasi...';
            executeFilter(
                { search: searchTerm, status: selectedStatus, severity: selectedSeverity },
                msg
            );
        }
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        const statusMap: Record<string, string> = {
            all: 'Semua Status',
            unread: 'Belum Dibaca',
            read: 'Telah Dibaca',
        };
        executeFilter(
            { search: searchTerm, status, severity: selectedSeverity },
            `Memfilter notifikasi ${statusMap[status] || status}...`
        );
    };

    const handleSeverityChange = (severity: string) => {
        setSelectedSeverity(severity);
        const severityMap: Record<string, string> = {
            all: 'Semua Tingkat',
            critical: 'Kritis',
            warning: 'Peringatan',
            info: 'Info',
        };
        executeFilter(
            { search: searchTerm, status: selectedStatus, severity },
            `Memfilter alert ${severityMap[severity] || severity}...`
        );
    };

    const handleStatCardFilter = (type: 'status' | 'severity', val: string) => {
        if (type === 'status') {
            setSelectedStatus(val);
            setSelectedSeverity('all');
            executeFilter(
                { search: searchTerm, status: val, severity: 'all' },
                val === 'unread' ? 'Memuat notifikasi belum dibaca...' : 'Memuat semua notifikasi...'
            );
        } else {
            setSelectedSeverity(val);
            setSelectedStatus('all');
            executeFilter(
                { search: searchTerm, status: 'all', severity: val },
                `Memuat alert berkategori ${val}...`
            );
        }
    };

    const handleReset = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedSeverity('all');
        executeFilter({}, 'Mereset filter notifikasi...');
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
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                    toast.success('Berhasil', 'Notifikasi telah ditandai sebagai sudah dibaca.');
                },
                onFinish: () => setIsLoading(false),
                onError: () => {
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
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                    const msg = page?.props?.flash?.success || 'Seluruh notifikasi telah ditandai sebagai sudah dibaca.';
                    toast.success('Berhasil', msg);
                },
                onFinish: () => setIsLoading(false),
                onError: () => {
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
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                toast.success('Berhasil', 'Notifikasi berhasil dihapus.');
                setIsDeleting(false);
                setShowDeleteModal(false);
                setDeletingItem(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
            onError: (errs) => {
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
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                const msg = page?.props?.flash?.success || 'Seluruh riwayat notifikasi telah dibersihkan.';
                toast.success('Berhasil', msg);
                setIsClearing(false);
                setShowClearModal(false);
            },
            onFinish: () => {
                setIsClearing(false);
            },
            onError: (errs) => {
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
