import { router } from '@inertiajs/react';
import React, { useState } from 'react';
import BaseModal from '@/Components/BaseModal';
import ConfirmModal from '@/Components/ConfirmModal';
import { toast } from '@/Components/DynamicToast';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import type { ActivityLogItem, LogArchiveItem } from '../Index';

interface ActivityLogTabProps {
    data: {
        retention_days: number;
        log_level: string;
        auto_prune: boolean;
    };
    onSave: (settings: Record<string, any>) => void;
    isSaving: boolean;
    activityLogs?: {
        data: ActivityLogItem[];
        links: any[];
        meta: any;
    };
    logArchives?: LogArchiveItem[];
    activityFilters?: {
        log_search?: string;
        log_event?: string;
        log_module?: string;
    };
    activityStats?: {
        total: number;
        today: number;
        created: number;
        updated: number;
        deleted: number;
    };
    availableModules?: string[];
}

export default function ActivityLogTab({
    data,
    onSave,
    isSaving,
    activityLogs,
    logArchives = [],
    activityFilters,
    activityStats = { total: 0, today: 0, created: 0, updated: 0, deleted: 0 },
    availableModules = [],
}: ActivityLogTabProps) {
    // Setting form state
    const [retentionDays, setRetentionDays] = useState(data.retention_days || 30);
    const [logLevel, setLogLevel] = useState(data.log_level || 'info');
    const [autoPrune, setAutoPrune] = useState(Boolean(data.auto_prune));

    // Archive state
    const [isArchiving, setIsArchiving] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiveMonth, setArchiveMonth] = useState(() => new Date().toISOString().slice(0, 7));

    // Filter states
    const [searchTerm, setSearchTerm] = useState(activityFilters?.log_search || '');
    const [selectedEvent, setSelectedEvent] = useState(activityFilters?.log_event || 'all');
    const [selectedModule, setSelectedModule] = useState(activityFilters?.log_module || 'all');

    // Modals
    const [detailLog, setDetailLog] = useState<ActivityLogItem | null>(null);
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const handleSubmitSettings = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            retention_days: Number(retentionDays),
            log_level: logLevel,
            auto_prune: autoPrune,
        });
    };

    // Filter handler
    const applyFilter = (newSearch?: string, newEvent?: string, newModule?: string, page: number = 1) => {
        const searchVal = newSearch !== undefined ? newSearch : searchTerm;
        const eventVal = newEvent !== undefined ? newEvent : selectedEvent;
        const moduleVal = newModule !== undefined ? newModule : selectedModule;

        const params: Record<string, any> = {
            tab: 'activity_log',
        };

        if (searchVal.trim()) params.log_search = searchVal.trim();
        if (eventVal && eventVal !== 'all') params.log_event = eventVal;
        if (moduleVal && moduleVal !== 'all') params.log_module = moduleVal;
        if (page > 1) params.page = page;

        router.get(route('settings.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            applyFilter();
        }
    };

    const handleResetFilter = () => {
        setSearchTerm('');
        setSelectedEvent('all');
        setSelectedModule('all');
        router.get(route('settings.index'), { tab: 'activity_log' }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleClearLogs = () => {
        setIsClearing(true);
        router.delete(route('settings.activity-logs.clear'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsClearing(false);
                setShowConfirmClear(false);
            },
            onError: () => {
                setIsClearing(false);
                toast.error('Gagal', 'Terjadi kesalahan saat membersihkan log.');
            },
        });
    };

    const handleTriggerArchive = () => {
        setIsArchiving(true);
        router.post(
            route('settings.log-archives.generate'),
            {
                month: archiveMonth,
                purge: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsArchiving(false);
                    setShowArchiveConfirm(false);
                    toast.success('Arsip Selesai', 'Arsip bulanan berhasil dibuat dan log lama di database telah dibersihkan.');
                },
                onError: (errs) => {
                    setIsArchiving(false);
                    const firstErr = Object.values(errs)[0];
                    toast.error('Gagal Membuat Arsip', typeof firstErr === 'string' ? firstErr : 'Terjadi kesalahan sistem.');
                },
                onFinish: () => {
                    setIsArchiving(false);
                },
            }
        );
    };

    // Helper badges & colors
    const renderEventBadge = (event?: string) => {
        switch (event) {
            case 'created':
                return (
                    <span className="badge-event badge-event-created">
                        <i className="bi bi-plus-circle-fill"></i> Tambah
                    </span>
                );
            case 'updated':
                return (
                    <span className="badge-event badge-event-updated">
                        <i className="bi bi-pencil-fill"></i> Ubah
                    </span>
                );
            case 'deleted':
                return (
                    <span className="badge-event badge-event-deleted">
                        <i className="bi bi-trash3-fill"></i> Hapus
                    </span>
                );
            default:
                return (
                    <span className="badge-event" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        <i className="bi bi-activity"></i> {event || 'Aksi'}
                    </span>
                );
        }
    };

    const getModuleIcon = (mod: string) => {
        switch (mod) {
            case 'site': return 'bi-hdd-network';
            case 'incident': return 'bi-shield-exclamation';
            case 'incident_conversation': return 'bi-chat-dots';
            case 'user': return 'bi-person';
            case 'keyword': return 'bi-journal-code';
            case 'menu': return 'bi-list-stars';
            case 'setting': return 'bi-gear';
            case 'site_security': return 'bi-shield-check';
            case 'detection_log': return 'bi-bug';
            case 'role': return 'bi-person-badge';
            case 'permission': return 'bi-key';
            default: return 'bi-database';
        }
    };

    // Helper untuk memformat nilai diff atribut agar ramah dibaca (human-friendly)
    const formatDiffValue = (val: any, key: string) => {
        if (val === undefined || val === null || val === '') {
            return <span className="text-muted font-italic">- (Kosong)</span>;
        }

        if (typeof val === 'boolean') {
            return val ? (
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                    <i className="bi bi-check-circle me-1"></i> Aktif (True)
                </span>
            ) : (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                    <i className="bi bi-x-circle me-1"></i> Nonaktif (False)
                </span>
            );
        }

        if (typeof val === 'object') {
            return (
                <pre className="m-0 p-1.5 rounded font-monospace" style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.04)', maxWidth: '100%', overflowX: 'auto' }}>
                    {JSON.stringify(val, null, 2)}
                </pre>
            );
        }

        const strVal = String(val).trim();

        // Deteksi format tanggal ISO atau field yang berakhiran _at / _date / time
        const isDateKey = key.endsWith('_at') || key.endsWith('_date') || key.endsWith('_time');
        const isIsoString = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/i.test(strVal);

        if (isIsoString || (isDateKey && !isNaN(Date.parse(strVal)))) {
            const dateObj = new Date(strVal);
            if (!isNaN(dateObj.getTime())) {
                const formattedDate = new Intl.DateTimeFormat('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }).format(dateObj).replace(/\./g, ':');

                return (
                    <div className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded" style={{ background: 'rgba(15, 42, 63, 0.05)' }}>
                        <i className="bi bi-calendar3 text-teal me-1" style={{ fontSize: '0.8rem' }}></i>
                        <span className="fw-semibold" style={{ fontSize: '0.84rem' }}>{formattedDate}</span>
                        <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>WIB</span>
                    </div>
                );
            }
        }

        return <span className="font-monospace" style={{ fontSize: '0.84rem' }}>{strVal}</span>;
    };

    return (
        <div>
            {/* Bagian 1: Pengaturan Retensi & Auto-Prune */}
            <form onSubmit={handleSubmitSettings}>
                <div className="settings-card">
                    <div className="settings-card-header">
                        <div>
                            <h4 className="settings-card-title">
                                <i className="bi bi-sliders text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                Kebijakan Retensi & Pembersihan Log
                            </h4>
                            <p className="settings-card-subtitle">
                                Kelola batas masa penyimpanan jejak audit keamanan dan jadwal pembersihan otomatis
                            </p>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        {/* Retention Days */}
                        <div className="col-12 col-md-6">
                            <label className="settings-label">Masa Retensi Log Deteksi</label>
                            <select
                                className="settings-input"
                                value={retentionDays}
                                onChange={(e) => setRetentionDays(Number(e.target.value))}
                            >
                                <option value={15}>15 Hari (Penyimpanan Hemat)</option>
                                <option value={30}>30 Hari (Standar Rekomendasi)</option>
                                <option value={60}>60 Hari (2 Bulan)</option>
                                <option value={90}>90 Hari (3 Bulan - Kepatuhan Audit)</option>
                                <option value={180}>180 Hari (6 Bulan)</option>
                                <option value={365}>365 Hari (1 Tahun Penuh)</option>
                            </select>
                            <div className="settings-hint">
                                Log sistem dan crawler yang lebih tua dari batas ini akan diarsipkan/dibersihkan otomatis
                            </div>
                        </div>

                        {/* Log Level */}
                        <div className="col-12 col-md-6">
                            <label className="settings-label">Ambang Batas Pencatatan (Log Level)</label>
                            <select
                                className="settings-input"
                                value={logLevel}
                                onChange={(e) => setLogLevel(e.target.value)}
                            >
                                <option value="debug">DEBUG (Catat semua detail sistem & crawler)</option>
                                <option value="info">INFO (Catat aktivitas penting & rutin)</option>
                                <option value="warning">WARNING (Hanya peringatan & anomali)</option>
                                <option value="error">ERROR (Hanya kegagalan fatal & insiden kritis)</option>
                            </select>
                            <div className="settings-hint">
                                Tingkat rincian informasi audit yang disimpan ke dalam storage log
                            </div>
                        </div>

                        {/* Auto Prune Switch */}
                        <div className="col-12">
                            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        id="autoPruneSwitch"
                                        checked={autoPrune}
                                        onChange={(e) => setAutoPrune(e.target.checked)}
                                        style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label ms-2 fw-semibold" htmlFor="autoPruneSwitch" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                        Pembersihan Otomatis Terjadwal (Daily Auto-Prune)
                                    </label>
                                </div>
                                <div className="text-muted ms-4 ps-2 mt-1" style={{ fontSize: '0.8rem' }}>
                                    Jalankan task scheduler harian untuk membuang riwayat log kedaluwarsa secara otomatis demi menjaga performa database tetap prima.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end pt-3 border-top">
                        <button
                            type="submit"
                            className="btn-save-settings"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check2-circle"></i>
                                    Simpan Pengaturan Kebijakan Log
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Bagian 1.5: Otomasi Arsip & Backup Log Bulanan (PDF & ZIP Raw) */}
            <div className="settings-card mt-4 mb-4">
                <div className="settings-card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                        <h4 className="settings-card-title d-flex align-items-center gap-2">
                            <i className="bi bi-file-earmark-pdf text-danger" style={{ fontSize: '1.2rem' }}></i>
                            Otomasi Arsip & Backup Log Bulanan (PDF & ZIP Raw)
                        </h4>
                        <p className="settings-card-subtitle">
                            Sistem otomatis membuat laporan eksekutif PDF & kompresi ZIP raw data setiap tanggal 1 pukul 01:00 WIB, kemudian membersihkan tabel database agar performa server tetap optimal.
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="month"
                            className="settings-input py-1 px-2"
                            style={{ width: 'auto', fontSize: '0.85rem' }}
                            value={archiveMonth}
                            onChange={(e) => setArchiveMonth(e.target.value)}
                        />
                        <button
                            type="button"
                            className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold"
                            style={{
                                borderRadius: '8px',
                                border: '1px solid var(--teal-1, #0ea5a3)',
                                color: 'var(--teal-1, #0ea5a3)',
                                background: 'rgba(14, 165, 163, 0.05)',
                                fontSize: '0.82rem',
                            }}
                            onClick={() => setShowArchiveConfirm(true)}
                            disabled={isArchiving}
                        >
                            <i className="bi bi-archive-fill"></i>
                            Buat Arsip & Bersihkan Database
                        </button>
                    </div>
                </div>

                {/* Tabel Riwayat File Arsip Bulanan */}
                <div className="mt-3">
                    <h6 className="fw-semibold text-muted text-uppercase mb-3" style={{ fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                        Daftar Berkas Arsip & Laporan Eksekutif Tersimpan
                    </h6>

                    {logArchives && logArchives.length > 0 ? (
                        <div className="table-responsive rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th className="py-2 px-3 text-secondary" style={{ fontWeight: 600 }}>Periode Bulan</th>
                                        <th className="py-2 px-3 text-secondary" style={{ fontWeight: 600 }}>Log Terarsip</th>
                                        <th className="py-2 px-3 text-secondary" style={{ fontWeight: 600 }}>Tanggal Pembuatan</th>
                                        <th className="py-2 px-3 text-secondary text-end" style={{ fontWeight: 600 }}>Unduh Berkas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logArchives.map((arch) => (
                                        <tr key={arch.id}>
                                            <td className="py-2 px-3">
                                                <div className="fw-bold text-dark">{arch.period}</div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{arch.title}</div>
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge rounded-pill" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                                                        {arch.activity_log_count.toLocaleString()} Aktivitas
                                                    </span>
                                                    <span className="badge rounded-pill" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                                        {arch.detection_log_count.toLocaleString()} Deteksi
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-muted">
                                                <i className="bi bi-calendar3 me-1"></i>
                                                {arch.created_at}
                                            </td>
                                            <td className="py-2 px-3 text-end">
                                                <div className="d-inline-flex gap-2">
                                                    <a
                                                        href={arch.pdf_url}
                                                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                                                        style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                                                        title="Unduh Laporan Eksekutif PDF"
                                                    >
                                                        <i className="bi bi-file-earmark-pdf-fill"></i>
                                                        <span>Laporan PDF ({arch.pdf_size})</span>
                                                    </a>
                                                    <a
                                                        href={arch.csv_url}
                                                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                                        style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                                                        title="Unduh Raw Data Lengkap (ZIP/CSV)"
                                                    >
                                                        <i className="bi bi-file-earmark-zip-fill"></i>
                                                        <span>Data ZIP ({arch.csv_size})</span>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-4 text-center rounded-3 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                            <i className="bi bi-folder2-open text-muted d-block mb-2" style={{ fontSize: '1.8rem' }}></i>
                            <div className="fw-semibold text-muted" style={{ fontSize: '0.85rem' }}>Belum ada berkas arsip bulanan</div>
                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                Sistem otomatis menerbitkan arsip setiap akhir bulan atau Anda dapat menekan tombol <strong>"Buat Arsip & Bersihkan Database"</strong> di atas.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bagian 2: Ringkasan Metrik Log Aktivitas */}
            <div className="activity-stat-grid">
                <div className="activity-stat-card">
                    <div className="activity-stat-icon" style={{ background: 'rgba(14, 165, 163, 0.1)', color: 'var(--teal-1, #0ea5a3)' }}>
                        <i className="bi bi-journal-text"></i>
                    </div>
                    <div>
                        <div className="activity-stat-val">{activityStats.total}</div>
                        <div className="activity-stat-lbl">Total Log Audit</div>
                    </div>
                </div>

                <div className="activity-stat-card">
                    <div className="activity-stat-icon" style={{ background: 'rgba(34, 193, 164, 0.12)', color: '#0d9488' }}>
                        <i className="bi bi-clock-history"></i>
                    </div>
                    <div>
                        <div className="activity-stat-val">{activityStats.today}</div>
                        <div className="activity-stat-lbl">Aktivitas Hari Ini</div>
                    </div>
                </div>

                <div className="activity-stat-card">
                    <div className="activity-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                        <i className="bi bi-plus-circle"></i>
                    </div>
                    <div>
                        <div className="activity-stat-val">{activityStats.created}</div>
                        <div className="activity-stat-lbl">Data Ditambahkan</div>
                    </div>
                </div>

                <div className="activity-stat-card">
                    <div className="activity-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                        <i className="bi bi-pencil-square"></i>
                    </div>
                    <div>
                        <div className="activity-stat-val">{activityStats.updated}</div>
                        <div className="activity-stat-lbl">Data Diperbarui</div>
                    </div>
                </div>
            </div>

            {/* Bagian 3: Tabel Daftar Jejak Audit (Audit Trail Table) */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div>
                        <h4 className="settings-card-title">
                            <i className="bi bi-fingerprint text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                            Riwayat Log Aktivitas & Jejak Audit
                        </h4>
                        <p className="settings-card-subtitle">
                            Rekaman kronologis setiap perubahan entitas data, akun pengguna, situs, dan konfigurasi keamanan
                        </p>
                    </div>

                    {activityLogs && activityLogs.data.length > 0 && (
                        <button
                            type="button"
                            className="btn-clear-logs"
                            onClick={() => setShowConfirmClear(true)}
                        >
                            <i className="bi bi-trash3"></i>
                            Bersihkan Riwayat Log
                        </button>
                    )}
                </div>

                {/* Toolbar Pencarian & Filter */}
                <div className="activity-toolbar">
                    <div className="d-flex flex-wrap gap-2 align-items-center flex-grow-1">
                        {/* Search Input */}
                        <div className="activity-search-box">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                className="activity-search-input"
                                placeholder="Cari kegiatan, modul, deskripsi... (Enter)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                        </div>

                        {/* Filter Event */}
                        <select
                            className="settings-input py-2"
                            style={{ width: 'auto', minWidth: '140px', fontSize: '0.86rem' }}
                            value={selectedEvent}
                            onChange={(e) => {
                                setSelectedEvent(e.target.value);
                                applyFilter(undefined, e.target.value, undefined, 1);
                            }}
                        >
                            <option value="all">Semua Aksi</option>
                            <option value="created">Penambahan (Created)</option>
                            <option value="updated">Perubahan (Updated)</option>
                            <option value="deleted">Penghapusan (Deleted)</option>
                        </select>

                        {/* Filter Modul */}
                        <select
                            className="settings-input py-2"
                            style={{ width: 'auto', minWidth: '150px', fontSize: '0.86rem' }}
                            value={selectedModule}
                            onChange={(e) => {
                                setSelectedModule(e.target.value);
                                applyFilter(undefined, undefined, e.target.value, 1);
                            }}
                        >
                            <option value="all">Semua Modul</option>
                            {availableModules.map((mod) => (
                                <option key={mod} value={mod}>
                                    Modul: {mod}
                                </option>
                            ))}
                        </select>

                        {/* Tombol Terapkan & Reset */}
                        <button
                            type="button"
                            onClick={() => applyFilter(searchTerm, selectedEvent, selectedModule, 1)}
                            className="btn-save-settings py-2 px-3"
                            style={{ fontSize: '0.84rem' }}
                        >
                            <i className="bi bi-funnel"></i> Filter
                        </button>

                        {(searchTerm || selectedEvent !== 'all' || selectedModule !== 'all') && (
                            <button
                                type="button"
                                onClick={handleResetFilter}
                                className="btn btn-sm btn-light border py-2 px-3 text-muted"
                                style={{ borderRadius: '12px', fontSize: '0.84rem' }}
                            >
                                <i className="bi bi-arrow-counterclockwise"></i> Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabel Data Log */}
                {activityLogs && activityLogs.data.length > 0 ? (
                    <>
                        <div className="activity-table-wrapper mb-3">
                            <table className="activity-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '170px' }}>Waktu & Tanggal</th>
                                        <th style={{ width: '130px' }}>Modul</th>
                                        <th style={{ width: '110px' }}>Aksi</th>
                                        <th>Deskripsi Perubahan</th>
                                        <th style={{ width: '180px' }}>Pelaku (User)</th>
                                        <th style={{ width: '100px', textAlign: 'center' }}>Detail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLogs.data.map((log) => (
                                        <tr key={log.id}>
                                            {/* Waktu */}
                                            <td>
                                                <div className="fw-semibold" style={{ fontSize: '0.82rem', color: 'var(--ink)' }}>
                                                    {log.created_at}
                                                </div>
                                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                    <i className="bi bi-clock me-1"></i>
                                                    {log.created_at_human}
                                                </div>
                                            </td>

                                            {/* Modul */}
                                            <td>
                                                <span className="badge-module">
                                                    <i className={`bi ${getModuleIcon(log.log_name)} me-1 text-teal`}></i>
                                                    {log.log_name}
                                                </span>
                                            </td>

                                            {/* Aksi / Event */}
                                            <td>
                                                {renderEventBadge(log.event)}
                                            </td>

                                            {/* Deskripsi */}
                                            <td>
                                                <span className="fw-medium text-dark">
                                                    {log.description}
                                                </span>
                                                {log.subject_type && (
                                                    <span className="badge bg-light text-secondary border ms-2" style={{ fontSize: '0.68rem' }}>
                                                        {log.subject_type}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Pelaku / User */}
                                            <td>
                                                {log.causer ? (
                                                    <div className="badge-causer">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center text-white"
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                background: 'linear-gradient(135deg, var(--teal-1, #0ea5a3), var(--teal-2, #22c1a4))',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {log.causer.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="text-truncate" style={{ maxWidth: '140px' }} title={log.causer.email}>
                                                            <div className="fw-semibold text-truncate" style={{ fontSize: '0.82rem' }}>{log.causer.name}</div>
                                                            <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>@{log.causer.username}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                        <i className="bi bi-cpu me-1"></i> Sistem / Cron
                                                    </span>
                                                )}
                                            </td>

                                            {/* Tombol Detail */}
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    className="btn-detail-log"
                                                    onClick={() => setDetailLog(log)}
                                                    title="Lihat detail perubahan atribut"
                                                >
                                                    <i className="bi bi-eye"></i> Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pt-2">
                            <Pagination
                                meta={activityLogs.meta}
                                links={activityLogs.links}
                                itemLabel="log aktivitas"
                                onPageChange={(page) => applyFilter(undefined, undefined, undefined, page)}
                            />
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon="bi-journal-x"
                        title="Belum Ada Jejak Log Aktivitas"
                        description={searchTerm || selectedEvent !== 'all' || selectedModule !== 'all'
                            ? "Tidak ditemukan data log yang sesuai dengan kriteria filter pencarian Anda."
                            : "Setiap penambahan, modifikasi, atau penghapusan data di dalam sistem akan otomatis tercatat di sini."}
                        actionLabel={searchTerm || selectedEvent !== 'all' || selectedModule !== 'all' ? "Reset Filter" : undefined}
                        onAction={searchTerm || selectedEvent !== 'all' || selectedModule !== 'all' ? handleResetFilter : undefined}
                    />
                )}
            </div>

            {/* Modal Detail Perubahan Atribut */}
            {detailLog && (
                <BaseModal
                    show={Boolean(detailLog)}
                    onClose={() => setDetailLog(null)}
                    title="Detail Perubahan Log Audit"
                    subtitle={`Jejak rekaman aktivitas ID: ${detailLog.id}`}
                    icon="bi-journal-code"
                    size="lg"
                    footer={
                        <button
                            type="button"
                            className="btn btn-secondary px-4 py-2"
                            style={{ borderRadius: '10px', fontSize: '0.88rem' }}
                            onClick={() => setDetailLog(null)}
                        >
                            Tutup
                        </button>
                    }
                >
                    <div className="d-flex flex-column gap-3">
                        {/* Summary Header Card */}
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="row g-2" style={{ fontSize: '0.85rem' }}>
                                <div className="col-12 col-md-6">
                                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>WAKTU EKSEKUSI</span>
                                    <span className="fw-semibold text-dark">{detailLog.created_at} ({detailLog.created_at_human})</span>
                                </div>
                                <div className="col-12 col-md-6">
                                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>PELAKU (CAUSER)</span>
                                    <span className="fw-semibold text-dark">
                                        {detailLog.causer ? `${detailLog.causer.name} (${detailLog.causer.email})` : 'Sistem Otomatis'}
                                    </span>
                                </div>
                                <div className="col-12 col-md-6 mt-2">
                                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>TIPE AKSI & MODUL</span>
                                    <div className="d-flex gap-2 align-items-center mt-1">
                                        {renderEventBadge(detailLog.event)}
                                        <span className="badge-module">{detailLog.log_name}</span>
                                    </div>
                                </div>
                                <div className="col-12 col-md-6 mt-2">
                                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>ENTITAS TARGET (SUBJECT)</span>
                                    <span className="font-monospace text-dark" style={{ fontSize: '0.8rem' }}>
                                        {detailLog.subject_type || 'General'} #{detailLog.subject_id || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <label className="settings-label mb-1">Deskripsi Perubahan</label>
                            <div className="p-2.5 rounded-3 bg-white border fw-medium text-dark" style={{ fontSize: '0.88rem' }}>
                                {detailLog.description}
                            </div>
                        </div>

                        {/* Snapshot Diff Table (Old vs New) */}
                        {detailLog.attribute_changes && (detailLog.attribute_changes.attributes || detailLog.attribute_changes.old) ? (
                            <div>
                                <label className="settings-label mb-2">
                                    <i className="bi bi-arrow-left-right me-1 text-teal"></i>
                                    Perbandingan Nilai Atribut (Old vs New)
                                </label>
                                <div className="table-responsive rounded-3 border">
                                    <table className="table table-sm table-bordered m-0" style={{ fontSize: '0.82rem' }}>
                                        <thead style={{ background: '#f1f5f9' }}>
                                            <tr>
                                                <th style={{ width: '28%' }}>Nama Atribut</th>
                                                <th style={{ width: '36%', background: 'rgba(239, 68, 68, 0.05)', color: '#b91c1c' }}>
                                                    <i className="bi bi-dash-circle me-1"></i> Nilai Sebelum (Old)
                                                </th>
                                                <th style={{ width: '36%', background: 'rgba(16, 185, 129, 0.05)', color: '#047857' }}>
                                                    <i className="bi bi-plus-circle me-1"></i> Nilai Sesudah (New)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys({
                                                ...(detailLog.attribute_changes.old || {}),
                                                ...(detailLog.attribute_changes.attributes || {}),
                                            }).map((key) => {
                                                const oldVal = detailLog.attribute_changes?.old?.[key];
                                                const newVal = detailLog.attribute_changes?.attributes?.[key];
                                                return (
                                                    <tr key={key}>
                                                        <td className="fw-semibold font-monospace" style={{ background: '#f8fafc' }}>
                                                            {key}
                                                        </td>
                                                        <td style={{ background: 'rgba(239, 68, 68, 0.02)', color: '#b91c1c', verticalAlign: 'middle' }}>
                                                            {formatDiffValue(oldVal, key)}
                                                        </td>
                                                        <td style={{ background: 'rgba(16, 185, 129, 0.02)', color: '#047857', verticalAlign: 'middle' }}>
                                                            {formatDiffValue(newVal, key)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : detailLog.properties && Object.keys(detailLog.properties).length > 0 ? (
                            <div>
                                <label className="settings-label mb-1">Payload Properti Tambahan</label>
                                <pre className="p-3 rounded-3 bg-dark text-light m-0 font-monospace" style={{ fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                                    {JSON.stringify(detailLog.properties, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="p-3 text-center rounded-3 bg-light text-muted border" style={{ fontSize: '0.84rem' }}>
                                <i className="bi bi-info-circle me-1"></i>
                                Tidak ada rincian perubahan atribut spesifik yang direkam pada aksi ini.
                            </div>
                        )}
                    </div>
                </BaseModal>
            )}

            {/* Modal Konfirmasi Bersihkan Semua Log */}
            <ConfirmModal
                show={showConfirmClear}
                onCancel={() => setShowConfirmClear(false)}
                onConfirm={handleClearLogs}
                title="Bersihkan Seluruh Riwayat Log?"
                message="Tindakan ini akan menghapus permanen seluruh riwayat rekaman audit yang tersimpan di database. Aksi ini tidak dapat dibatalkan."
                confirmText={isClearing ? "Membersihkan..." : "Ya, Hapus Semua Log"}
                cancelText="Batal"
                variant="danger"
                isProcessing={isClearing}
            />

            {/* Modal Konfirmasi Arsip & Bersihkan Log */}
            <ConfirmModal
                show={showArchiveConfirm}
                onCancel={() => setShowArchiveConfirm(false)}
                onConfirm={handleTriggerArchive}
                title={`Arsipkan & Bersihkan Log Periode ${archiveMonth}?`}
                message={`Sistem akan mengekspor seluruh rekaman log periode ${archiveMonth} ke dalam file Laporan PDF Eksekutif dan ZIP Data Mentah (.CSV), kemudian menghapus data tersebut dari database MySQL agar server tetap optimal. Berkas arsip dapat diunduh kapan saja.`}
                confirmText={isArchiving ? "Memproses Arsip..." : "Ya, Buat Arsip & Bersihkan"}
                cancelText="Batal"
                variant="warning"
                isProcessing={isArchiving}
            />
        </div>
    );
}
