import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import React, { FormEventHandler, useState, useRef, useEffect } from 'react';
import { toast } from '@/Components/DynamicToast';
import Pagination from '@/Components/Pagination';
import BaseModal from '@/Components/BaseModal';
import EmptyState from '@/Components/EmptyState';
import '@/../css/settings.css';

export interface UserActivityLogItem {
    id: string;
    log_name: string;
    description: string;
    event?: string;
    subject_type?: string | null;
    subject_id?: string | null;
    causer?: {
        name: string;
        username: string;
        email: string;
    } | null;
    attribute_changes?: {
        attributes?: Record<string, any>;
        old?: Record<string, any>;
    } | null;
    properties?: any;
    created_at: string;
    created_at_human: string;
}

export interface UserDeviceSession {
    id: string;
    is_current: boolean;
    ip_address: string;
    os: string;
    os_icon?: string;
    browser: string;
    browser_icon?: string;
    last_active: string;
    last_active_time: string;
}

interface ProfileEditProps extends PageProps {
    mustVerifyEmail: boolean;
    status?: string;
    userRoles?: string[];
    activityLogs?: {
        data: UserActivityLogItem[];
        links: any[];
        meta: any;
    };
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
    userSessions?: UserDeviceSession[];
}

export default function Edit({
    mustVerifyEmail,
    status,
    userRoles = [],
    activityLogs,
    activityFilters,
    activityStats = { total: 0, today: 0, created: 0, updated: 0, deleted: 0 },
    availableModules = [],
    userSessions = [],
}: ProfileEditProps) {
    const user = usePage<PageProps>().props.auth.user as any;
    const pageProps = usePage<any>().props;

    // Detect initial tab from URL query param
    const getInitialTab = (): 'info' | 'security' | 'activity' | 'danger' => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (['info', 'security', 'activity', 'danger'].includes(tabParam || '')) {
                return tabParam as any;
            }
        }
        return 'info';
    };

    const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity' | 'danger'>(getInitialTab);

    // Password visibility toggles
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Delete account modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Activity Log Filter States
    const [searchTerm, setSearchTerm] = useState(activityFilters?.log_search || '');
    const [selectedEvent, setSelectedEvent] = useState(activityFilters?.log_event || 'all');
    const [selectedModule, setSelectedModule] = useState(activityFilters?.log_module || 'all');
    const [detailLog, setDetailLog] = useState<UserActivityLogItem | null>(null);

    // 1. Form Update Profile
    const {
        data: profileData,
        setData: setProfileData,
        patch: updateProfile,
        errors: profileErrors,
        processing: profileProcessing,
    } = useForm({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
    });

    const handleProfileSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        updateProfile(route('profile.update'), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                if (!page?.props?.flash?.success) {
                    toast.success('Berhasil', 'Profil Anda berhasil diperbarui.');
                }
            },
            onError: () => {
                toast.error('Gagal', 'Terjadi kesalahan saat memperbarui profil. Periksa data Anda.');
            },
        });
    };

    // 2. Form Update Password
    const {
        data: passwordData,
        setData: setPasswordData,
        put: updatePassword,
        errors: passwordErrors,
        processing: passwordProcessing,
        reset: resetPassword,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handlePasswordSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        updatePassword(route('password.update'), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                resetPassword();
                if (!page?.props?.flash?.success) {
                    toast.success('Berhasil', 'Kata sandi Anda telah berhasil diperbarui.');
                }
            },
            onError: (errs) => {
                toast.error('Gagal', errs.current_password || errs.password || 'Gagal memperbarui kata sandi.');
            },
        });
    };

    // 3. Form Delete Account
    const {
        data: deleteData,
        setData: setDeleteData,
        delete: destroyAccount,
        processing: deleteProcessing,
        reset: resetDelete,
        errors: deleteErrors,
    } = useForm({
        password: '',
    });

    const handleDeleteAccount: FormEventHandler = (e) => {
        e.preventDefault();
        destroyAccount(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
            },
            onError: () => {
                toast.error('Gagal', 'Kata sandi tidak sesuai. Akun tidak dihapus.');
            },
        });
    };

    // Trigger filter request for Activity Log
    const handleApplyFilters = (search = searchTerm, event = selectedEvent, module = selectedModule, page = 1) => {
        router.get(
            route('profile.edit'),
            {
                tab: 'activity',
                page: page,
                log_search: search,
                log_event: event,
                log_module: module,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedEvent('all');
        setSelectedModule('all');
        router.get(
            route('profile.edit'),
            { tab: 'activity' },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Flash Toast Handler
    const lastFlashRef = useRef<string | null>(null);
    useEffect(() => {
        const success = pageProps.flash?.success;
        const error = pageProps.flash?.error;
        const key = `${success || ''}#${error || ''}`;

        if (key === '#' || lastFlashRef.current === key) return;
        lastFlashRef.current = key;

        if (success) {
            toast.success('Berhasil', success);
        } else if (error) {
            toast.error('Peringatan', error);
        }
    }, [pageProps.flash]);

    // Helpers
    const userRoleBadge = userRoles.length > 0 ? userRoles[0] : 'User';
    const initials = (user.name || 'User')
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Baru Saja';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const formatDiffValue = (val: any): string => {
        if (val === null || val === undefined) return '(kosong)';
        if (typeof val === 'boolean') return val ? 'Ya (Aktif)' : 'Tidak (Nonaktif)';
        if (typeof val === 'object') return JSON.stringify(val, null, 2);
        const str = String(val);
        if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/.test(str)) {
            try {
                const d = new Date(str);
                return d.toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }) + ' WIB';
            } catch {
                return str;
            }
        }
        return str;
    };

    const getEventBadgeClass = (event?: string) => {
        switch (event) {
            case 'created':
                return 'badge bg-success-subtle text-success border border-success-subtle';
            case 'updated':
                return 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle';
            case 'deleted':
                return 'badge bg-danger-subtle text-danger border border-danger-subtle';
            default:
                return 'badge bg-info-subtle text-info-emphasis border border-info-subtle';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Profil Saya - SIGAP Web" />

            {/* Page Header */}
            <div className="settings-page-header">
                <div className="d-flex align-items-center gap-3">
                    <div className="settings-icon-badge" style={{ background: 'linear-gradient(135deg, #0ea5a3, #22c1a4)' }}>
                        <i className="bi bi-person-circle fs-4"></i>
                    </div>
                    <div>
                        <h1 className="h4 fw-bold mb-1" style={{ color: 'var(--ink, #0f2a3f)' }}>
                            Profil Pengguna
                        </h1>
                        <p className="text-muted small mb-0">
                            Kelola informasi identitas, kata sandi, dan riwayat aktivitas akun Anda di SIGAP Web.
                        </p>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-light text-teal border px-3 py-2 rounded-pill" style={{ color: 'var(--teal-1, #0ea5a3)', fontSize: '0.8rem', fontWeight: 600 }}>
                        <i className="bi bi-shield-check me-1"></i> Akun Terverifikasi
                    </span>
                </div>
            </div>

            <div className="row g-4">
                {/* Left Column: User Summary Card */}
                <div className="col-lg-4 col-12">
                    <div className="settings-card text-center p-4">
                        {/* Avatar Initials with Glow Ring */}
                        <div className="position-relative d-inline-block mx-auto mb-3">
                            <div
                                style={{
                                    width: '92px',
                                    height: '92px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0ea5a3 0%, #22c1a4 100%)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.1rem',
                                    fontWeight: 700,
                                    boxShadow: '0 10px 25px -5px rgba(14, 165, 163, 0.4)',
                                    border: '4px solid #ffffff',
                                }}
                            >
                                {initials}
                            </div>
                            <span
                                className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle"
                                style={{ width: '18px', height: '18px' }}
                                title="Status: Online & Aktif"
                            ></span>
                        </div>

                        <h4 className="fw-bold mb-1" style={{ color: 'var(--ink, #0f2a3f)', fontSize: '1.25rem' }}>
                            {user.name}
                        </h4>
                        <p className="text-muted small mb-2">
                            @{user.username || 'user'}
                        </p>

                        <div className="d-flex justify-content-center gap-2 mb-4">
                            <span className="badge rounded-pill" style={{ background: 'rgba(14, 165, 163, 0.12)', color: 'var(--teal-1, #0ea5a3)', fontWeight: 600, padding: '0.4rem 0.85rem' }}>
                                <i className="bi bi-shield-lock-fill me-1"></i> {userRoleBadge.toUpperCase()}
                            </span>
                            <span className="badge rounded-pill bg-light text-secondary border" style={{ padding: '0.4rem 0.85rem' }}>
                                <i className="bi bi-check-circle-fill text-success me-1"></i> Aktif
                            </span>
                        </div>

                        {/* User Details List */}
                        <div className="text-start border-top pt-3" style={{ fontSize: '0.86rem' }}>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted"><i className="bi bi-envelope me-2"></i>Email</span>
                                <span className="fw-medium text-truncate" style={{ maxWidth: '180px' }}>{user.email}</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted"><i className="bi bi-person-badge me-2"></i>Username</span>
                                <span className="fw-medium">{user.username || '-'}</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted"><i className="bi bi-calendar3 me-2"></i>Terdaftar</span>
                                <span className="fw-medium">{formatDate(user.created_at)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span className="text-muted"><i className="bi bi-clock-history me-2"></i>Total Aktivitas</span>
                                <span className="fw-bold text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}>
                                    {activityStats.total} log
                                </span>
                            </div>
                            <div className="d-flex justify-content-between py-2">
                                <span className="text-muted"><i className="bi bi-key me-2"></i>Autentikasi</span>
                                <span className="fw-medium text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}>Password / SSO</span>
                            </div>
                        </div>
                    </div>

                    {/* Device & Session Info Card */}
                    <div className="settings-card p-4 mt-4 text-start">
                        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                            <div>
                                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.94rem' }}>
                                    <i className="bi bi-laptop-fill text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                    Perangkat &amp; Sesi Login
                                </h6>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>Perangkat yang terhubung dengan akun Anda</span>
                            </div>
                            <span className="badge rounded-pill bg-light text-teal border" style={{ color: 'var(--teal-1, #0ea5a3)', fontSize: '0.72rem' }}>
                                {userSessions.length} Sesi
                            </span>
                        </div>

                        <div className="session-list">
                            {userSessions.map((sess) => (
                                <div key={sess.id} className={`device-session-item ${sess.is_current ? 'current' : ''}`}>
                                    <div className="device-icon-box">
                                        <i className={`bi ${sess.browser_icon || 'bi-globe2'}`}></i>
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                        <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                            <strong className="text-dark text-truncate" style={{ fontSize: '0.86rem' }}>
                                                {sess.browser}
                                            </strong>
                                            {sess.is_current && (
                                                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
                                                    <span className="status-dot-pulse"></span>
                                                    Sesi Ini
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-muted d-flex align-items-center gap-1 text-truncate" style={{ fontSize: '0.75rem' }}>
                                            <i className={`bi ${sess.os_icon || 'bi-display'} me-1`}></i>
                                            <span>{sess.os}</span>
                                            <span>•</span>
                                            <span className="font-monospace text-truncate">{sess.ip_address}</span>
                                        </div>
                                        <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                                            <i className="bi bi-clock me-1"></i>
                                            {sess.last_active}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '0.75rem' }}>
                            <span>
                                <i className="bi bi-shield-check text-success me-1"></i>
                                Enkripsi Sesi Aktif
                            </span>
                            <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                                TLS / Session Safe
                            </span>
                        </div>
                    </div>

                    {/* Account Security & Health Card */}
                    <div className="settings-card p-4 mt-4 text-start">
                        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                            <div>
                                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.94rem' }}>
                                    <i className="bi bi-shield-lock-fill text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                    Status Keamanan Akun
                                </h6>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>Tinjauan proteksi dan integritas akses</span>
                            </div>
                            <span className="badge rounded-pill bg-success text-white" style={{ fontSize: '0.72rem', padding: '0.28rem 0.6rem' }}>
                                Terlindungi
                            </span>
                        </div>

                        {/* Security Health Progress */}
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-medium text-dark">Skor Proteksi Akun</span>
                                <strong className="text-success">100% (Sangat Baik)</strong>
                            </div>
                            <div className="progress" style={{ height: '7px', borderRadius: '10px', background: '#e2e8f0' }}>
                                <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(135deg, #0ea5a3 0%, #10b981 100%)',
                                        borderRadius: '10px',
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Security Checklists */}
                        <div className="security-checklists">
                            <div className="security-checklist-item">
                                <i className="bi bi-check-circle-fill text-success"></i>
                                <span>Akun Aktif &amp; Terverifikasi</span>
                            </div>
                            <div className="security-checklist-item">
                                <i className="bi bi-check-circle-fill text-success"></i>
                                <span>Autentikasi SSO Humacode Siap</span>
                            </div>
                            <div className="security-checklist-item">
                                <i className="bi bi-check-circle-fill text-success"></i>
                                <span>Proteksi Middleware Akses Aktif</span>
                            </div>
                            <div className="security-checklist-item">
                                <i className="bi bi-check-circle-fill text-success"></i>
                                <span>Jejak Audit Aktivitas Tercatat</span>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-top">
                            <button
                                type="button"
                                className="btn btn-sm btn-light border w-100 rounded-3 py-2 fw-semibold text-secondary d-flex align-items-center justify-content-center gap-2"
                                style={{ fontSize: '0.82rem', transition: 'all 0.2s ease' }}
                                onClick={() => setActiveTab('security')}
                            >
                                <i className="bi bi-key-fill text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                Kelola Kata Sandi &amp; Keamanan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings Tabs & Forms */}
                <div className="col-lg-8 col-12">
                    {/* Tab Navigation */}
                    <div className="settings-tabs-wrapper mb-4">
                        <button
                            type="button"
                            className={`settings-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            <i className="bi bi-person-vcard"></i>
                            <span>Informasi Akun</span>
                        </button>

                        <button
                            type="button"
                            className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <i className="bi bi-shield-lock"></i>
                            <span>Kata Sandi &amp; Keamanan</span>
                        </button>

                        <button
                            type="button"
                            className={`settings-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('activity')}
                        >
                            <i className="bi bi-clock-history"></i>
                            <span>Log Aktivitas Saya</span>
                            {activityStats.today > 0 && (
                                <span className="badge rounded-pill bg-teal text-white ms-1" style={{ background: 'var(--teal-1, #0ea5a3)', fontSize: '0.68rem' }}>
                                    +{activityStats.today}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            className={`settings-tab-btn ${activeTab === 'danger' ? 'active' : ''}`}
                            onClick={() => setActiveTab('danger')}
                            style={activeTab === 'danger' ? { background: '#ef4444', color: '#fff' } : {}}
                        >
                            <i className="bi bi-exclamation-triangle"></i>
                            <span>Zona Berbahaya</span>
                        </button>
                    </div>

                    {/* TAB 1: INFORMASI AKUN */}
                    {activeTab === 'info' && (
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div>
                                    <h4 className="settings-card-title">
                                        <i className="bi bi-person-vcard text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                        Perbarui Informasi Profil
                                    </h4>
                                    <p className="settings-card-subtitle">
                                        Ubah nama tampilan, username login, dan alamat email akun Anda.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSubmit}>
                                <div className="row g-3">
                                    {/* Name */}
                                    <div className="col-12 col-md-6">
                                        <label className="settings-label" htmlFor="name">
                                            Nama Lengkap <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            className={`settings-input ${profileErrors.name ? 'is-invalid' : ''}`}
                                            value={profileData.name}
                                            onChange={(e) => setProfileData('name', e.target.value)}
                                            required
                                            placeholder="Contoh: John Doe"
                                        />
                                        {profileErrors.name && (
                                            <div className="text-danger small mt-1">{profileErrors.name}</div>
                                        )}
                                    </div>

                                    {/* Username */}
                                    <div className="col-12 col-md-6">
                                        <label className="settings-label" htmlFor="username">
                                            Username <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="username"
                                            className={`settings-input ${profileErrors.username ? 'is-invalid' : ''}`}
                                            value={profileData.username}
                                            onChange={(e) => setProfileData('username', e.target.value)}
                                            required
                                            placeholder="Contoh: johndoe"
                                        />
                                        {profileErrors.username && (
                                            <div className="text-danger small mt-1">{profileErrors.username}</div>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="col-12">
                                        <label className="settings-label" htmlFor="email">
                                            Alamat Email <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            className={`settings-input ${profileErrors.email ? 'is-invalid' : ''}`}
                                            value={profileData.email}
                                            onChange={(e) => setProfileData('email', e.target.value)}
                                            required
                                            placeholder="user@humacode.com"
                                        />
                                        {profileErrors.email && (
                                            <div className="text-danger small mt-1">{profileErrors.email}</div>
                                        )}
                                        <div className="settings-hint">
                                            Email ini digunakan untuk login dan menerima notifikasi peringatan insiden sistem.
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                                    <button
                                        type="submit"
                                        className="btn-save-settings"
                                        disabled={profileProcessing}
                                    >
                                        {profileProcessing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check2-circle me-1"></i>
                                                Simpan Perubahan Profil
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: KATA SANDI & KEAMANAN */}
                    {activeTab === 'security' && (
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div>
                                    <h4 className="settings-card-title">
                                        <i className="bi bi-shield-lock text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                        Perbarui Kata Sandi Akun
                                    </h4>
                                    <p className="settings-card-subtitle">
                                        Gunakan kombinasi kata sandi yang panjang dan kuat untuk mencegah akses tidak sah.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordSubmit}>
                                <div className="row g-3">
                                    {/* Current Password */}
                                    <div className="col-12">
                                        <label className="settings-label" htmlFor="current_password">
                                            Kata Sandi Saat Ini <span className="text-danger">*</span>
                                        </label>
                                        <div className="position-relative">
                                            <input
                                                type={showCurrentPass ? 'text' : 'password'}
                                                id="current_password"
                                                className={`settings-input ${passwordErrors.current_password ? 'is-invalid' : ''}`}
                                                value={passwordData.current_password}
                                                onChange={(e) => setPasswordData('current_password', e.target.value)}
                                                required
                                                placeholder="Masukkan kata sandi saat ini"
                                            />
                                            <button
                                                type="button"
                                                className="btn position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent text-muted"
                                                onClick={() => setShowCurrentPass(!showCurrentPass)}
                                                tabIndex={-1}
                                            >
                                                <i className={showCurrentPass ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                            </button>
                                        </div>
                                        {passwordErrors.current_password && (
                                            <div className="text-danger small mt-1">{passwordErrors.current_password}</div>
                                        )}
                                    </div>

                                    {/* New Password */}
                                    <div className="col-12 col-md-6">
                                        <label className="settings-label" htmlFor="password">
                                            Kata Sandi Baru <span className="text-danger">*</span>
                                        </label>
                                        <div className="position-relative">
                                            <input
                                                type={showNewPass ? 'text' : 'password'}
                                                id="password"
                                                className={`settings-input ${passwordErrors.password ? 'is-invalid' : ''}`}
                                                value={passwordData.password}
                                                onChange={(e) => setPasswordData('password', e.target.value)}
                                                required
                                                placeholder="Minimal 8 karakter"
                                            />
                                            <button
                                                type="button"
                                                className="btn position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent text-muted"
                                                onClick={() => setShowNewPass(!showNewPass)}
                                                tabIndex={-1}
                                            >
                                                <i className={showNewPass ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                            </button>
                                        </div>
                                        {passwordErrors.password && (
                                            <div className="text-danger small mt-1">{passwordErrors.password}</div>
                                        )}
                                    </div>

                                    {/* Password Confirmation */}
                                    <div className="col-12 col-md-6">
                                        <label className="settings-label" htmlFor="password_confirmation">
                                            Konfirmasi Kata Sandi Baru <span className="text-danger">*</span>
                                        </label>
                                        <div className="position-relative">
                                            <input
                                                type={showConfirmPass ? 'text' : 'password'}
                                                id="password_confirmation"
                                                className={`settings-input ${passwordErrors.password_confirmation ? 'is-invalid' : ''}`}
                                                value={passwordData.password_confirmation}
                                                onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                                required
                                                placeholder="Ulangi kata sandi baru"
                                            />
                                            <button
                                                type="button"
                                                className="btn position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent text-muted"
                                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                                tabIndex={-1}
                                            >
                                                <i className={showConfirmPass ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                                            </button>
                                        </div>
                                        {passwordErrors.password_confirmation && (
                                            <div className="text-danger small mt-1">{passwordErrors.password_confirmation}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                                    <button
                                        type="submit"
                                        className="btn-save-settings"
                                        disabled={passwordProcessing}
                                    >
                                        {passwordProcessing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Memperbarui...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-key-fill me-1"></i>
                                                Perbarui Kata Sandi
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: LOG AKTIVITAS SAYA (Spesifik User yang Login) */}
                    {activeTab === 'activity' && (
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div>
                                    <h4 className="settings-card-title">
                                        <i className="bi bi-clock-history text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                        Log Aktivitas Akun Saya
                                    </h4>
                                    <p className="settings-card-subtitle">
                                        Riwayat audit trail lengkap dari aksi, perubahan data, dan konfigurasi yang dilakukan oleh akun Anda.
                                    </p>
                                </div>

                                <span className="badge rounded-pill bg-light text-teal border px-3 py-2" style={{ color: 'var(--teal-1, #0ea5a3)' }}>
                                    <i className="bi bi-person-fill-check me-1"></i> Khusus Pengguna Ini
                                </span>
                            </div>

                            {/* Mini Stat Cards */}
                            <div className="row g-3 mb-4">
                                <div className="col-6 col-md-3">
                                    <div className="p-3 rounded-3 border" style={{ background: '#f8fafc' }}>
                                        <div className="text-muted small fw-medium">Total Aktivitas</div>
                                        <div className="fs-4 fw-bold mt-1" style={{ color: 'var(--ink, #0f2a3f)' }}>
                                            {activityStats.total}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="p-3 rounded-3 border" style={{ background: '#f0fdf4' }}>
                                        <div className="text-success small fw-medium">Hari Ini</div>
                                        <div className="fs-4 fw-bold mt-1 text-success">
                                            {activityStats.today}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="p-3 rounded-3 border" style={{ background: '#eff6ff' }}>
                                        <div className="text-primary small fw-medium">Penambahan (Created)</div>
                                        <div className="fs-4 fw-bold mt-1 text-primary">
                                            {activityStats.created}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="p-3 rounded-3 border" style={{ background: '#fefce8' }}>
                                        <div className="text-warning-emphasis small fw-medium">Perubahan (Updated)</div>
                                        <div className="fs-4 fw-bold mt-1 text-warning-emphasis">
                                            {activityStats.updated}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters Bar */}
                            <div className="row g-2 mb-3">
                                <div className="col-12 col-md-5">
                                    <div className="position-relative">
                                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                        <input
                                            type="text"
                                            className="settings-input ps-5"
                                            placeholder="Cari deskripsi aktivitas..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters(e.currentTarget.value)}
                                        />
                                    </div>
                                </div>

                                <div className="col-6 col-md-3">
                                    <select
                                        className="settings-input"
                                        value={selectedEvent}
                                        onChange={(e) => {
                                            setSelectedEvent(e.target.value);
                                            handleApplyFilters(searchTerm, e.target.value);
                                        }}
                                    >
                                        <option value="all">Semua Tipe Aksi</option>
                                        <option value="created">Created (Dibuat)</option>
                                        <option value="updated">Updated (Diubah)</option>
                                        <option value="deleted">Deleted (Dihapus)</option>
                                        <option value="cleared">Cleared (Dibersihkan)</option>
                                    </select>
                                </div>

                                <div className="col-6 col-md-3">
                                    <select
                                        className="settings-input"
                                        value={selectedModule}
                                        onChange={(e) => {
                                            setSelectedModule(e.target.value);
                                            handleApplyFilters(searchTerm, selectedEvent, e.target.value);
                                        }}
                                    >
                                        <option value="all">Semua Modul</option>
                                        {availableModules.map((mod) => (
                                            <option key={mod} value={mod}>
                                                {mod.charAt(0).toUpperCase() + mod.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-12 col-md-1 d-flex">
                                    <button
                                        type="button"
                                        className="settings-btn settings-btn-secondary w-100 p-0 d-flex align-items-center justify-content-center"
                                        onClick={handleResetFilters}
                                        title="Reset Filter"
                                    >
                                        <i className="bi bi-arrow-counterclockwise fs-5"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Table of Activity Logs */}
                            {activityLogs && activityLogs.data.length > 0 ? (
                                <>
                                    <div className="table-responsive border rounded-3 overflow-hidden">
                                        <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
                                            <thead style={{ background: '#f8fafc', color: 'var(--ink, #0f2a3f)' }}>
                                                <tr>
                                                    <th className="py-3 px-3" style={{ width: '190px' }}>Waktu</th>
                                                    <th className="py-3 px-3" style={{ width: '130px' }}>Modul</th>
                                                    <th className="py-3 px-3" style={{ width: '110px' }}>Aksi</th>
                                                    <th className="py-3 px-3">Deskripsi Aktivitas</th>
                                                    <th className="py-3 px-3 text-end" style={{ width: '90px' }}>Detail</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activityLogs.data.map((log) => (
                                                    <tr key={log.id}>
                                                        <td className="py-3 px-3">
                                                            <div className="fw-medium text-dark">{log.created_at}</div>
                                                            <div className="text-muted small">{log.created_at_human}</div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span className="badge bg-light text-dark border px-2 py-1">
                                                                <i className="bi bi-folder2 me-1 text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                                                {log.log_name}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span className={getEventBadgeClass(log.event)}>
                                                                {log.event || 'action'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="text-dark fw-medium" style={{ lineHeight: '1.4' }}>
                                                                {log.description}
                                                            </div>
                                                            {log.subject_type && (
                                                                <div className="text-muted small">
                                                                    Objek: <code>{log.subject_type}</code>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 text-end">
                                                            <button
                                                                type="button"
                                                                className="btn-detail-icon"
                                                                onClick={() => setDetailLog(log)}
                                                                title="Lihat Rincian Perubahan"
                                                            >
                                                                <i className="bi bi-eye"></i>
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
                                            links={activityLogs?.links}
                                            meta={activityLogs?.meta}
                                            itemLabel="aktivitas"
                                            onPageChange={(page) => handleApplyFilters(searchTerm, selectedEvent, selectedModule, page)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <EmptyState
                                    icon="bi-clock-history"
                                    title="Belum Ada Log Aktivitas"
                                    description="Seluruh riwayat aksi atau perubahan data yang Anda lakukan akan secara otomatis tercatat di sini."
                                />
                            )}
                        </div>
                    )}

                    {/* TAB 4: ZONA BERBAHAYA */}
                    {activeTab === 'danger' && (
                        <div className="settings-card border-danger" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <div className="settings-card-header border-bottom border-danger-subtle">
                                <div>
                                    <h4 className="settings-card-title text-danger">
                                        <i className="bi bi-exclamation-octagon-fill me-2"></i>
                                        Zona Berbahaya: Hapus Akun
                                    </h4>
                                    <p className="settings-card-subtitle">
                                        Tindakan ini permanen. Seluruh data, sesi, dan riwayat yang terhubung dengan akun ini akan dihapus.
                                    </p>
                                </div>
                            </div>

                            <div className="alert alert-danger d-flex align-items-center gap-3 rounded-3 my-3">
                                <i className="bi bi-exclamation-triangle-fill fs-3 text-danger"></i>
                                <div>
                                    <strong>Peringatan!</strong> Setelah akun Anda dihapus, semua data dan hak akses Anda akan dicabut secara permanen dari SIGAP Web.
                                </div>
                            </div>

                            <div className="mt-4 pt-2">
                                <button
                                    type="button"
                                    className="btn btn-danger px-4 py-2 rounded-3 fw-medium"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <i className="bi bi-trash3-fill me-1"></i>
                                    Hapus Akun Saya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detail Perubahan Log */}
            {detailLog && (
                <BaseModal
                    show={Boolean(detailLog)}
                    onClose={() => setDetailLog(null)}
                    title={`Rincian Aktivitas: ${detailLog.log_name.toUpperCase()}`}
                    size="lg"
                >
                    <div>
                        <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="row g-2" style={{ fontSize: '0.86rem' }}>
                                <div className="col-12 col-md-6">
                                    <span className="text-muted d-block small">Waktu Pencatatan:</span>
                                    <strong className="text-dark">{detailLog.created_at}</strong> ({detailLog.created_at_human})
                                </div>
                                <div className="col-12 col-md-6">
                                    <span className="text-muted d-block small">Jenis Event / Aksi:</span>
                                    <span className={getEventBadgeClass(detailLog.event)}>{detailLog.event || 'Aksi'}</span>
                                </div>
                                <div className="col-12">
                                    <span className="text-muted d-block small">Deskripsi Peristiwa:</span>
                                    <span className="text-dark fw-medium">{detailLog.description}</span>
                                </div>
                            </div>
                        </div>

                        {/* Attribute Changes Diff Table */}
                        {detailLog.attribute_changes && (detailLog.attribute_changes.attributes || detailLog.attribute_changes.old) ? (
                            <div>
                                <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '0.9rem' }}>
                                    <i className="bi bi-arrow-left-right text-teal me-1" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                    Perubahan Nilai Atribut (Diff):
                                </h6>
                                <div className="table-responsive border rounded-3">
                                    <table className="table table-bordered mb-0" style={{ fontSize: '0.82rem' }}>
                                        <thead style={{ background: '#f1f5f9' }}>
                                            <tr>
                                                <th style={{ width: '28%' }}>Field Atribut</th>
                                                <th style={{ width: '36%' }} className="text-danger">Nilai Lama (Before)</th>
                                                <th style={{ width: '36%' }} className="text-success">Nilai Baru (After)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys(detailLog.attribute_changes.attributes || detailLog.attribute_changes.old || {}).map((attrKey) => {
                                                const oldVal = detailLog.attribute_changes?.old?.[attrKey];
                                                const newVal = detailLog.attribute_changes?.attributes?.[attrKey];
                                                const isChanged = oldVal !== newVal && oldVal !== undefined;

                                                return (
                                                    <tr key={attrKey} style={isChanged ? { background: '#fefce8' } : {}}>
                                                        <td className="fw-medium font-monospace">{attrKey}</td>
                                                        <td className="text-break" style={{ color: '#dc2626' }}>
                                                            {formatDiffValue(oldVal)}
                                                        </td>
                                                        <td className="text-break" style={{ color: '#16a34a' }}>
                                                            {formatDiffValue(newVal)}
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
                                <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '0.9rem' }}>
                                    Data Properti Tambahan:
                                </h6>
                                <pre className="p-3 rounded-3 border bg-light small mb-0 text-dark" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    {JSON.stringify(detailLog.properties, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="text-muted small text-center py-3">
                                Tidak ada data atribut spesifik yang diubah pada aktivitas ini.
                            </div>
                        )}
                    </div>
                </BaseModal>
            )}

            {/* Modal Konfirmasi Hapus Akun */}
            {showDeleteModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex={-1}
                    style={{ background: 'rgba(15, 42, 63, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4 border-0 shadow-lg">
                            <div className="modal-header border-bottom pb-3">
                                <h5 className="modal-title text-danger fw-bold d-flex align-items-center gap-2">
                                    <i className="bi bi-exclamation-triangle-fill"></i>
                                    Konfirmasi Hapus Akun
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        resetDelete();
                                    }}
                                ></button>
                            </div>

                            <form onSubmit={handleDeleteAccount}>
                                <div className="modal-body py-3">
                                    <p className="text-muted small">
                                        Apakah Anda yakin ingin menghapus akun Anda? Masukkan kata sandi Anda di bawah ini untuk mengonfirmasi tindakan ini secara permanen.
                                    </p>

                                    <div className="mb-3">
                                        <label className="settings-label" htmlFor="delete_password">
                                            Kata Sandi Anda <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            id="delete_password"
                                            className={`settings-input ${deleteErrors.password ? 'is-invalid' : ''}`}
                                            value={deleteData.password}
                                            onChange={(e) => setDeleteData('password', e.target.value)}
                                            required
                                            placeholder="Masukkan kata sandi untuk konfirmasi"
                                            autoFocus
                                        />
                                        {deleteErrors.password && (
                                            <div className="text-danger small mt-1">{deleteErrors.password}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer border-top pt-3">
                                    <button
                                        type="button"
                                        className="btn btn-light rounded-3 px-3"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            resetDelete();
                                        }}
                                        disabled={deleteProcessing}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-danger rounded-3 px-3"
                                        disabled={deleteProcessing}
                                    >
                                        {deleteProcessing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Menghapus...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-trash3-fill me-1"></i>
                                                Ya, Hapus Akun
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
