import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import { toast } from '@/Components/DynamicToast';
import ConfirmModal from '@/Components/ConfirmModal';

interface SiteItem {
    id: string;
    name: string;
    url: string;
    category: string;
}

interface MaintenanceItem {
    id: string;
    title: string;
    description: string | null;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    start_time: string;
    end_time: string;
    created_at: string;
    sites: SiteItem[];
    creator?: { id: string; name: string };
}

interface MaintenanceIndexProps {
    maintenances: {
        data: MaintenanceItem[];
        links?: any[];
        meta?: any;
    };
    stats: {
        total: number;
        in_progress: number;
        scheduled: number;
        completed: number;
    };
    availableSites: SiteItem[];
    filters: {
        search?: string;
        status?: string;
    };
}

export default function PemeliharaanIndex({
    maintenances,
    stats,
    availableSites = [],
    filters = {},
}: MaintenanceIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingItem, setEditingItem] = useState<MaintenanceItem | null>(null);

    // Form fields
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formStatus, setFormStatus] = useState<'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('scheduled');
    const [formStartTime, setFormStartTime] = useState('');
    const [formEndTime, setFormEndTime] = useState('');
    const [formSiteIds, setFormSiteIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Site search in modal
    const [modalSiteSearch, setModalSiteSearch] = useState('');

    // Delete Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<MaintenanceItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter Trigger
    const applyFilters = (newSearch?: string, newStatus?: string) => {
        router.get(
            route('maintenance.index'),
            {
                search: newSearch !== undefined ? newSearch : search,
                status: newStatus !== undefined ? newStatus : statusFilter,
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    // Open Create Modal
    const openCreateModal = () => {
        setModalMode('create');
        setEditingItem(null);
        setFormTitle('');
        setFormDescription('');
        setFormStatus('scheduled');
        
        // Default start time: today at next hour
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        const end = new Date(now);
        end.setHours(end.getHours() + 3);

        const formatForInput = (d: Date) => {
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setFormStartTime(formatForInput(now));
        setFormEndTime(formatForInput(end));
        setFormSiteIds([]);
        setModalSiteSearch('');
        setShowModal(true);
    };

    // Open Edit Modal
    const openEditModal = (item: MaintenanceItem) => {
        setModalMode('edit');
        setEditingItem(item);
        setFormTitle(item.title);
        setFormDescription(item.description || '');
        setFormStatus(item.status);

        const formatForInput = (isoStr: string) => {
            const d = new Date(isoStr);
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setFormStartTime(formatForInput(item.start_time));
        setFormEndTime(formatForInput(item.end_time));
        setFormSiteIds(item.sites ? item.sites.map(s => s.id) : []);
        setModalSiteSearch('');
        setShowModal(true);
    };

    // Submit Create or Update
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formTitle.trim()) {
            toast.error('Judul pemeliharaan wajib diisi.');
            return;
        }

        if (formSiteIds.length === 0) {
            toast.error('Pilih minimal satu situs yang terdampak.');
            return;
        }

        if (!formStartTime || !formEndTime) {
            toast.error('Waktu mulai dan estimasi selesai wajib diisi.');
            return;
        }

        if (new Date(formEndTime) <= new Date(formStartTime)) {
            toast.error('Waktu selesai harus setelah waktu mulai.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            title: formTitle,
            description: formDescription,
            status: formStatus,
            start_time: formStartTime,
            end_time: formEndTime,
            site_ids: formSiteIds,
        };

        if (modalMode === 'create') {
            router.post(route('maintenance.store'), payload, {
                onSuccess: () => {
                    setShowModal(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const firstErr = Object.values(errors)[0];
                    if (firstErr) toast.error(String(firstErr));
                },
            });
        } else if (editingItem) {
            router.put(route('maintenance.update', editingItem.id), payload, {
                onSuccess: () => {
                    setShowModal(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const firstErr = Object.values(errors)[0];
                    if (firstErr) toast.error(String(firstErr));
                },
            });
        }
    };

    // Quick Status Update
    const handleQuickStatus = (item: MaintenanceItem, newStatus: string) => {
        router.patch(route('maintenance.update-status', item.id), { status: newStatus }, {
            preserveScroll: true,
        });
    };

    // Delete Item
    const handleDeleteConfirm = () => {
        if (!itemToDelete) return;
        setIsDeleting(true);

        router.delete(route('maintenance.destroy', itemToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setItemToDelete(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
                toast.error('Gagal menghapus jadwal pemeliharaan.');
            },
        });
    };

    // Format Date Display
    const formatDate = (isoStr: string) => {
        try {
            const d = new Date(isoStr);
            return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }) + ' WIB';
        } catch {
            return isoStr;
        }
    };

    // Filter available sites in modal
    const filteredModalSites = availableSites.filter(s =>
        s.name.toLowerCase().includes(modalSiteSearch.toLowerCase()) ||
        s.url.toLowerCase().includes(modalSiteSearch.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(modalSiteSearch.toLowerCase()))
    );

    return (
        <AuthenticatedLayout>
            <Head title="Jadwal Pemeliharaan Resmi — SIGAP" />

            <div className="container-fluid px-4 py-4">
                {/* Header */}
                <PageHeader
                    title="Jadwal Pemeliharaan Resmi"
                    subtitle="Kelola jadwal pemeliharaan sistem terencana (Scheduled Maintenance), transparansi situs terdampak, dan banner informatif warga di status page publik."
                    actions={
                        <div className="d-flex align-items-center gap-2">
                            <a
                                href={route('status.index')}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                                style={{ borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500 }}
                            >
                                <i className="bi bi-box-arrow-up-right"></i>
                                <span>Lihat Halaman Publik</span>
                            </a>
                            <button
                                onClick={openCreateModal}
                                className="btn btn-primary d-flex align-items-center gap-2"
                                style={{ borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}
                            >
                                <i className="bi bi-plus-circle"></i>
                                <span>Buat Jadwal Baru</span>
                            </button>
                        </div>
                    }
                />

                {/* Stat Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div className="card-body p-3 d-flex align-items-center justify-content-between">
                                <div>
                                    <span className="text-secondary small d-block mb-1">Total Jadwal</span>
                                    <h3 className="mb-0 fw-bold">{stats.total}</h3>
                                </div>
                                <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary">
                                    <i className="bi bi-calendar-check fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                            <div className="card-body p-3 d-flex align-items-center justify-content-between">
                                <div>
                                    <span className="text-info small d-block mb-1">Sedang Berlangsung</span>
                                    <h3 className="mb-0 fw-bold text-info">{stats.in_progress}</h3>
                                </div>
                                <div className="p-3 rounded-circle bg-info bg-opacity-10 text-info">
                                    <i className="bi bi-gear-wide-connected fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <div className="card-body p-3 d-flex align-items-center justify-content-between">
                                <div>
                                    <span className="text-warning small d-block mb-1">Terjadwal Mendatang</span>
                                    <h3 className="mb-0 fw-bold text-warning">{stats.scheduled}</h3>
                                </div>
                                <div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning">
                                    <i className="bi bi-clock-history fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div className="card-body p-3 d-flex align-items-center justify-content-between">
                                <div>
                                    <span className="text-success small d-block mb-1">Selesai Terlaksana</span>
                                    <h3 className="mb-0 fw-bold text-success">{stats.completed}</h3>
                                </div>
                                <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success">
                                    <i className="bi bi-check-circle fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar Filter */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div className="card-body p-3">
                        <div className="row g-2 align-items-center">
                            <div className="col-12 col-md-6 col-lg-4">
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-end-0 text-secondary">
                                        <i className="bi bi-search"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control bg-transparent border-start-0 text-white"
                                        placeholder="Cari judul, deskripsi, atau situs terdampak..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            applyFilters(e.target.value, statusFilter);
                                        }}
                                    />
                                    {search && (
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                setSearch('');
                                                applyFilters('', statusFilter);
                                            }}
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="col-12 col-md-4 col-lg-3">
                                <select
                                    className="form-select bg-dark text-white border-secondary"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        applyFilters(search, e.target.value);
                                    }}
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="in_progress">Sedang Berlangsung (In Progress)</option>
                                    <option value="scheduled">Terjadwal (Scheduled)</option>
                                    <option value="completed">Selesai (Completed)</option>
                                    <option value="cancelled">Dibatalkan (Cancelled)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table List */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="table table-dark table-hover mb-0 align-middle">
                            <thead style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                <tr>
                                    <th className="py-3 px-3">Judul & Pekerjaan</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3">Situs Terdampak</th>
                                    <th className="py-3 px-3">Jadwal Pelaksanaan</th>
                                    <th className="py-3 px-3 text-end">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {maintenances.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5 text-secondary">
                                            <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                                            Belum ada data jadwal pemeliharaan yang cocok.
                                        </td>
                                    </tr>
                                ) : (
                                    maintenances.data.map((item) => {
                                        const statusBadges = {
                                            in_progress: { text: 'Sedang Berlangsung', class: 'badge bg-info bg-opacity-20 text-info border border-info border-opacity-30' },
                                            scheduled: { text: 'Terjadwal', class: 'badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30' },
                                            completed: { text: 'Selesai', class: 'badge bg-success bg-opacity-20 text-success border border-success border-opacity-30' },
                                            cancelled: { text: 'Dibatalkan', class: 'badge bg-secondary bg-opacity-20 text-secondary border border-secondary border-opacity-30' },
                                        };
                                        const currentBadge = statusBadges[item.status] || statusBadges.scheduled;

                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                <td className="py-3 px-3">
                                                    <strong className="d-block text-white mb-1">{item.title}</strong>
                                                    {item.description ? (
                                                        <span className="text-secondary small line-clamp-2" style={{ maxWidth: '380px' }}>
                                                            {item.description}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted small fst-italic">Tidak ada catatan rincian</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`px-2 py-1 ${currentBadge.class}`} style={{ borderRadius: '6px', fontSize: '0.8rem' }}>
                                                        {item.status === 'in_progress' && (
                                                            <span className="spinner-grow spinner-grow-sm me-1" role="status" aria-hidden="true" style={{ width: '8px', height: '8px' }}></span>
                                                        )}
                                                        {currentBadge.text}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '300px' }}>
                                                        {item.sites && item.sites.slice(0, 3).map((site) => (
                                                            <span
                                                                key={site.id}
                                                                className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-20 px-2 py-1"
                                                                style={{ fontSize: '0.75rem', borderRadius: '5px' }}
                                                                title={site.url}
                                                            >
                                                                {site.name}
                                                            </span>
                                                        ))}
                                                        {item.sites && item.sites.length > 3 && (
                                                            <span
                                                                className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 px-2 py-1"
                                                                style={{ fontSize: '0.75rem', borderRadius: '5px' }}
                                                            >
                                                                +{item.sites.length - 3} situs lain
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="small">
                                                        <div className="text-white mb-1">
                                                            <i className="bi bi-play-circle text-info me-1"></i>
                                                            {formatDate(item.start_time)}
                                                        </div>
                                                        <div className="text-secondary">
                                                            <i className="bi bi-stop-circle text-warning me-1"></i>
                                                            {formatDate(item.end_time)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-end">
                                                    <div className="dropdown d-inline-block">
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                            type="button"
                                                            data-bs-toggle="dropdown"
                                                            aria-expanded="false"
                                                            style={{ borderRadius: '8px' }}
                                                        >
                                                            Opsi
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                                                            <li><h6 className="dropdown-header">Ubah Status Cepat</h6></li>
                                                            {item.status !== 'in_progress' && (
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item text-info"
                                                                        onClick={() => handleQuickStatus(item, 'in_progress')}
                                                                    >
                                                                        <i className="bi bi-play-fill me-2"></i>Mulai Sekarang
                                                                    </button>
                                                                </li>
                                                            )}
                                                            {item.status !== 'completed' && (
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item text-success"
                                                                        onClick={() => handleQuickStatus(item, 'completed')}
                                                                    >
                                                                        <i className="bi bi-check2-circle me-2"></i>Tandai Selesai
                                                                    </button>
                                                                </li>
                                                            )}
                                                            {item.status !== 'cancelled' && (
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item text-secondary"
                                                                        onClick={() => handleQuickStatus(item, 'cancelled')}
                                                                    >
                                                                        <i className="bi bi-x-circle me-2"></i>Batalkan
                                                                    </button>
                                                                </li>
                                                            )}
                                                            <li><hr className="dropdown-divider border-secondary" /></li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item text-white"
                                                                    onClick={() => openEditModal(item)}
                                                                >
                                                                    <i className="bi bi-pencil-square me-2"></i>Edit Detail
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item text-danger"
                                                                    onClick={() => {
                                                                        setItemToDelete(item);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                >
                                                                    <i className="bi bi-trash3 me-2"></i>Hapus Jadwal
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Create / Edit */}
            {showModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content bg-dark text-white border-secondary shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-calendar-event me-2 text-primary"></i>
                                    {modalMode === 'create' ? 'Buat Jadwal Pemeliharaan Baru' : 'Edit Jadwal Pemeliharaan'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    {/* Judul */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Judul Pemeliharaan <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control bg-transparent text-white border-secondary"
                                            placeholder="Contoh: Migrasi Server & Pemeliharaan Berkala Database SPBE"
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Deskripsi */}
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Deskripsi / Catatan Publik</label>
                                        <textarea
                                            className="form-control bg-transparent text-white border-secondary"
                                            rows={3}
                                            placeholder="Jelaskan jenis pekerjaan dan himbauan untuk pengguna/warga selama pemeliharaan berlangsung..."
                                            value={formDescription}
                                            onChange={(e) => setFormDescription(e.target.value)}
                                        ></textarea>
                                    </div>

                                    {/* Status & Waktu */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold">Status Awal</label>
                                            <select
                                                className="form-select bg-dark text-white border-secondary"
                                                value={formStatus}
                                                onChange={(e) => setFormStatus(e.target.value as any)}
                                            >
                                                <option value="scheduled">Terjadwal (Scheduled)</option>
                                                <option value="in_progress">Sedang Berlangsung (In Progress)</option>
                                                <option value="completed">Selesai (Completed)</option>
                                                <option value="cancelled">Dibatalkan (Cancelled)</option>
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold">Waktu Mulai <span className="text-danger">*</span></label>
                                            <input
                                                type="datetime-local"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={formStartTime}
                                                onChange={(e) => setFormStartTime(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold">Estimasi Selesai <span className="text-danger">*</span></label>
                                            <input
                                                type="datetime-local"
                                                className="form-control bg-dark text-white border-secondary"
                                                value={formEndTime}
                                                onChange={(e) => setFormEndTime(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Situs Terdampak Multi-Selector */}
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <label className="form-label fw-semibold mb-0">
                                                Pilih Situs Terdampak <span className="text-danger">*</span>
                                                <span className="badge bg-primary ms-2">{formSiteIds.length} dipilih</span>
                                            </label>
                                            <div className="btn-group btn-group-sm">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => setFormSiteIds(availableSites.map(s => s.id))}
                                                >
                                                    Pilih Semua
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => setFormSiteIds([])}
                                                >
                                                    Kosongkan
                                                </button>
                                            </div>
                                        </div>

                                        <input
                                            type="text"
                                            className="form-control form-control-sm bg-transparent text-white border-secondary mb-2"
                                            placeholder="Saring daftar situs..."
                                            value={modalSiteSearch}
                                            onChange={(e) => setModalSiteSearch(e.target.value)}
                                        />

                                        <div
                                            className="border border-secondary rounded p-2 bg-dark bg-opacity-50"
                                            style={{ maxHeight: '180px', overflowY: 'auto' }}
                                        >
                                            <div className="row g-2">
                                                {filteredModalSites.map((site) => {
                                                    const isChecked = formSiteIds.includes(site.id);
                                                    return (
                                                        <div key={site.id} className="col-12 col-sm-6">
                                                            <div
                                                                className={`p-2 rounded border cursor-pointer d-flex align-items-center gap-2 ${isChecked ? 'bg-primary bg-opacity-15 border-primary' : 'bg-transparent border-secondary border-opacity-40'}`}
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => {
                                                                    if (isChecked) {
                                                                        setFormSiteIds(formSiteIds.filter(id => id !== site.id));
                                                                    } else {
                                                                        setFormSiteIds([...formSiteIds, site.id]);
                                                                    }
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input mt-0"
                                                                    checked={isChecked}
                                                                    onChange={() => {}}
                                                                />
                                                                <div className="text-truncate">
                                                                    <div className="text-white small fw-medium text-truncate">{site.name}</div>
                                                                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{site.category || 'Layanan'}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer border-secondary">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowModal(false)}
                                        disabled={isSubmitting}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-save me-1"></i>
                                                Simpan Jadwal
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                show={showDeleteModal}
                title="Hapus Jadwal Pemeliharaan?"
                message={`Apakah Anda yakin ingin menghapus jadwal pemeliharaan "${itemToDelete?.title}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus Jadwal"
                cancelText="Batal"
                variant="danger"
                isProcessing={isDeleting}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                }}
            />
        </AuthenticatedLayout>
    );
}
