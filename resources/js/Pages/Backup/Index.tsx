import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import { toast } from '@/Components/DynamicToast';
import ConfirmModal from '@/Components/ConfirmModal';

import BackupStatCards from './Partials/BackupStatCards';
import BackupToolbar from './Partials/BackupToolbar';
import BackupTable, { BackupItem } from './Partials/BackupTable';
import CreateBackupModal from './Partials/CreateBackupModal';
import RestoreModal from './Partials/RestoreModal';
import DownloadProgressModal, { DownloadProgressState } from './Partials/DownloadProgressModal';
import axios from 'axios';



interface BackupIndexProps {
    backups: {
        data: BackupItem[];
        links?: any[];
        meta?: any;
    };
    filters: {
        search?: string;
        site_id?: string;
        type?: string;
    };
    stats: {
        total_backups: number;
        total_size_formatted: string;
        protected_sites_count: number;
        latest_backup_time: string;
    };
    sshSites: Array<{ id: string; name: string; url: string; ssh_app_path?: string; ssh_host?: string }>;
}

export default function BackupIndex({
    backups,
    filters = {},
    stats,
    sshSites = [],
}: BackupIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [siteId, setSiteId] = useState(filters.site_id || '');
    const [type, setType] = useState(filters.type || '');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupItem | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [backupToDelete, setBackupToDelete] = useState<BackupItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Real-time Download Progress State
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgressState>({
        active: false,
        filename: '',
        loaded: 0,
        total: 0,
        percent: 0,
        speed: '',
        completed: false,
    });


    // Apply Filters
    const applyFilters = (newFilters: { search?: string; site_id?: string; type?: string }) => {
        router.get(route('backups.index'), {
            search: newFilters.search !== undefined ? newFilters.search : search,
            site_id: newFilters.site_id !== undefined ? newFilters.site_id : siteId,
            type: newFilters.type !== undefined ? newFilters.type : type,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        applyFilters({ search: val });
    };

    const handleSiteIdChange = (val: string) => {
        setSiteId(val);
        applyFilters({ site_id: val });
    };

    const handleTypeChange = (val: string) => {
        setType(val);
        applyFilters({ type: val });
    };

    const handleReset = () => {
        setSearch('');
        setSiteId('');
        setType('');
        applyFilters({ search: '', site_id: '', type: '' });
    };

    const handlePageChange = (page: number) => {
        router.get(route('backups.index'), {
            search,
            site_id: siteId,
            type,
            page,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Actions
    const handleDownload = async (item: BackupItem) => {
        setDownloadProgress({
            active: true,
            filename: item.filename,
            loaded: 0,
            total: item.file_size || 0,
            percent: 0,
            speed: 'Menghubungkan ke SFTP...',
            completed: false,
        });

        try {
            let lastLoaded = 0;
            let lastTime = Date.now();

            const response = await axios.get(route('backups.download', item.id), {
                headers: {
                    'X-Download-Mode': 'stream',
                },
                params: {
                    stream: 1,
                },
                responseType: 'blob',
                timeout: 600000,
                onDownloadProgress: (progressEvent) => {
                    const currentTime = Date.now();
                    const timeDiff = (currentTime - lastTime) / 1000;
                    let speedText = '';

                    if (timeDiff > 0.3) {
                        const bytesDiff = progressEvent.loaded - lastLoaded;
                        const speedBps = bytesDiff / timeDiff;
                        const speedMbps = (speedBps / (1024 * 1024)).toFixed(1);
                        speedText = `${speedMbps} MB/s`;
                        lastLoaded = progressEvent.loaded;
                        lastTime = currentTime;
                    }

                    const total = progressEvent.total || item.file_size || progressEvent.loaded;
                    const percent = total > 0 ? Math.min(99, Math.round((progressEvent.loaded * 100) / total)) : 50;

                    setDownloadProgress(prev => ({
                        ...prev,
                        loaded: progressEvent.loaded,
                        total: total,
                        percent: percent,
                        speed: speedText || prev.speed,
                    }));
                }
            });

            // Ensure blob is valid and not empty
            const rawData = response.data;
            const blob = rawData instanceof Blob ? rawData : new Blob([rawData], { type: 'application/gzip' });

            if (blob.size === 0) {
                throw new Error('Ukuran data 0 bytes. IDM atau ekstensi browser mungkin mencegat XHR request.');
            }

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = blobUrl;
            link.setAttribute('download', item.filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Crucial: delay revoking by 60s so browser thread can write the full file to disk
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 60000);

            setDownloadProgress(prev => ({
                ...prev,
                loaded: blob.size || item.file_size,
                total: blob.size || item.file_size,
                percent: 100,
                completed: true,
                speed: 'Selesai diunduh!',
            }));

            toast.success('Unduhan Selesai', `File ${item.filename} berhasil disimpan ke komputer Anda.`);
            setTimeout(() => {
                setDownloadProgress(prev => ({ ...prev, active: false }));
            }, 3500);
        } catch (error: any) {
            console.error('Download error:', error);
            toast.error('Gagal Mengunduh', 'Terjadi kesalahan saat mengunduh berkas arsip via SFTP.');
            setDownloadProgress(prev => ({ ...prev, active: false }));
        }
    };

    const handleOpenRestore = (item: BackupItem) => {
        setSelectedBackupForRestore(item);
        setShowRestoreModal(true);
    };

    const handleOpenDelete = (item: BackupItem) => {
        setBackupToDelete(item);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (!backupToDelete) return;

        setIsDeleting(true);
        router.delete(route('backups.destroy', backupToDelete.id), {
            onSuccess: () => {
                toast.success('Berhasil Dihapus', `Arsip ${backupToDelete.filename} telah dihapus.`);
                setShowDeleteModal(false);
                setBackupToDelete(null);
                setIsDeleting(false);
            },
            onError: () => {
                toast.error('Gagal Menghapus', 'Gagal menghapus file arsip backup.');
                setIsDeleting(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Backup & Pemulihan" />

            {/* Page Header */}
            <PageHeader 
                title="Backup & Pemulihan"
                subtitle="Cadangkan kode program situs via SSH (.tar.gz) dan pulihkan dengan aman saat terjadi defacement atau kegagalan sistem."
                icon="bi-archive-fill"
                status={{
                    label: 'Status Arsip',
                    value: `${stats.total_backups} Tersimpan`,
                    icon: 'bi-hdd-fill',
                    type: 'optimal',
                }}
            />

            {/* Stat Cards */}
            <BackupStatCards stats={stats} />

            {/* Main Content Card */}
            <div 
                className="p-4 rounded-4"
                style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(226,232,240,0.9)',
                    boxShadow: '0 8px 30px rgba(15,42,63,0.04)',
                }}
            >
                {/* Toolbar */}
                <BackupToolbar 
                    search={search}
                    onSearchChange={handleSearchChange}
                    siteId={siteId}
                    onSiteIdChange={handleSiteIdChange}
                    type={type}
                    onTypeChange={handleTypeChange}
                    onReset={handleReset}
                    onOpenCreateModal={() => setShowCreateModal(true)}
                    sshSites={sshSites}
                />

                {/* Table */}
                <BackupTable 
                    backups={backups}
                    onDownload={handleDownload}
                    onRestore={handleOpenRestore}
                    onDelete={handleOpenDelete}
                    onPageChange={handlePageChange}
                    onOpenCreateModal={() => setShowCreateModal(true)}
                />
            </div>

            {/* Create Backup Modal */}
            <CreateBackupModal 
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                sshSites={sshSites}
            />

            {/* Restore Confirmation Modal */}
            <RestoreModal 
                show={showRestoreModal}
                onClose={() => {
                    setShowRestoreModal(false);
                    setSelectedBackupForRestore(null);
                }}
                backup={selectedBackupForRestore}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal 
                show={showDeleteModal}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setBackupToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Hapus Arsip Cadangan"
                itemName={backupToDelete?.filename}
                message="Apakah Anda yakin ingin menghapus arsip cadangan ini? File fisik di server juga akan dihapus permanen."
                confirmText="Hapus Arsip"
                variant="danger"
                isProcessing={isDeleting}
            />

            {/* Floating Real-time Download Progress Bar */}
            <DownloadProgressModal 
                progress={downloadProgress}
                onClose={() => setDownloadProgress(prev => ({ ...prev, active: false }))}
            />
        </AuthenticatedLayout>
    );
}
