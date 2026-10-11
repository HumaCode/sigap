import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';

interface RoleOption {
    id: string;
    name: string;
    slug?: string;
    description?: string;
}

interface UserModalProps {
    show: boolean;
    onClose: () => void;
    user: any | null; // null if creating, object if editing
    roles: RoleOption[];
}

export default function UserModal({ show, onClose, user, roles }: UserModalProps) {
    const isEdit = Boolean(user);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
        is_active: true,
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (show) {
            clearErrors();
            if (user) {
                setData({
                    name: user.name || '',
                    username: user.username || '',
                    email: user.email || '',
                    password: '',
                    role: user.role_name || (user.roles?.[0]?.name ?? 'user'),
                    is_active: Boolean(user.is_active),
                });
            } else {
                reset();
                setData({
                    name: '',
                    username: '',
                    email: '',
                    password: '',
                    role: 'user',
                    is_active: true,
                });
            }
        }
    }, [show, user]);

    if (!show) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            patch(route('users.update', user.id), {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    if (page?.props?.flash?.error) {
                        return;
                    }
                    if (!page?.props?.flash?.success) {
                        toast.success('Berhasil', `Data pengguna "${data.name}" berhasil diperbarui.`);
                    }
                    onClose();
                },
                onError: (errs) => {
                    const firstErr = Object.values(errs)[0];
                    toast.error('Gagal', typeof firstErr === 'string' ? firstErr : 'Periksa kembali formulir.');
                }
            });
        } else {
            post(route('users.store'), {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    if (page?.props?.flash?.error) {
                        return;
                    }
                    if (!page?.props?.flash?.success) {
                        toast.success('Berhasil', `Pengguna baru "${data.name}" berhasil didaftarkan.`);
                    }
                    onClose();
                },
                onError: (errs) => {
                    const firstErr = Object.values(errs)[0];
                    toast.error('Gagal', typeof firstErr === 'string' ? firstErr : 'Periksa kembali formulir.');
                }
            });
        }
    };

    return (
        <div 
            className="modal fade show d-block" 
            style={{ backgroundColor: 'rgba(15, 42, 63, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
            tabIndex={-1}
        >
            <div className="modal-dialog modal-xxl modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '1100px' }}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    
                    {/* Modal Header (Matching AI Remediation Header Style) */}
                    <div className="modal-header border-0 px-4 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)', color: '#fff' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div style={{
                                width: '46px', height: '46px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.4rem'
                            }}>
                                <i className={`bi ${isEdit ? 'bi-person-gear' : 'bi-person-plus-fill'}`}></i>
                            </div>
                            <div>
                                <h5 className="modal-title fw-bold m-0" style={{ fontSize: '1.25rem', fontFamily: 'Poppins, sans-serif' }}>
                                    {isEdit ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
                                </h5>
                                <p className="m-0 opacity-75" style={{ fontSize: '0.82rem' }}>
                                    {isEdit ? 'Perbarui informasi profil dan penugasan hak akses pengguna' : 'Daftarkan personil baru dan tentukan hak akses peran sistem SIGAP'}
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={onClose} 
                            disabled={processing}
                        ></button>
                    </div>

                    {/* Modal Body / Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                        <div className="modal-body p-4" style={{ background: '#f8fafc', maxHeight: '72vh', overflowY: 'auto' }}>
                            <div className="row g-4">
                                
                                {/* Left Column: Informasi Akun & Kredensial */}
                                <div className="col-12 col-lg-6">
                                    <div className="glass-card p-4 h-100" style={{ background: '#fff', borderRadius: '18px', border: '1px solid var(--line)' }}>
                                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                            <i className="bi bi-person-badge text-teal" style={{ color: 'var(--teal-1)', fontSize: '1.1rem' }}></i>
                                            <span className="fw-bold" style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>Informasi Identitas & Kredensial</span>
                                        </div>

                                        <div className="row g-3">
                                            {/* Nama Lengkap */}
                                            <div className="col-12">
                                                <label className="form-label fw-semibold mb-1" style={{ fontSize: '0.82rem', color: 'var(--ink)' }}>
                                                    Nama Lengkap <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-input-custom ${errors.name ? 'is-invalid border-danger' : ''}`}
                                                    placeholder="Contoh: Budi Santoso, S.Kom"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    required
                                                />
                                                {errors.name && <div className="text-danger mt-1" style={{ fontSize: '0.78rem' }}>{errors.name}</div>}
                                            </div>

                                            {/* Username */}
                                            <div className="col-12 col-sm-6">
                                                <label className="form-label fw-semibold mb-1" style={{ fontSize: '0.82rem', color: 'var(--ink)' }}>
                                                    Username <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-input-custom ${errors.username ? 'is-invalid border-danger' : ''}`}
                                                    placeholder="Contoh: budi_opd"
                                                    value={data.username}
                                                    onChange={(e) => setData('username', e.target.value)}
                                                    required
                                                />
                                                {errors.username && <div className="text-danger mt-1" style={{ fontSize: '0.78rem' }}>{errors.username}</div>}
                                            </div>

                                            {/* Email */}
                                            <div className="col-12 col-sm-6">
                                                <label className="form-label fw-semibold mb-1" style={{ fontSize: '0.82rem', color: 'var(--ink)' }}>
                                                    Alamat Email <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    className={`form-input-custom ${errors.email ? 'is-invalid border-danger' : ''}`}
                                                    placeholder="budi@pekalongankota.go.id"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    required
                                                />
                                                {errors.email && <div className="text-danger mt-1" style={{ fontSize: '0.78rem' }}>{errors.email}</div>}
                                            </div>

                                            {/* Password */}
                                            <div className="col-12">
                                                <label className="form-label fw-semibold d-flex justify-content-between mb-1" style={{ fontSize: '0.82rem', color: 'var(--ink)' }}>
                                                    <span>
                                                        Password {isEdit ? <span className="text-muted fw-normal">(Kosongkan jika tidak diubah)</span> : <span className="text-danger">*</span>}
                                                    </span>
                                                </label>
                                                <div className="position-relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        className={`form-input-custom ${errors.password ? 'is-invalid border-danger' : ''}`}
                                                        placeholder={isEdit ? '••••••••' : 'Minimal 4 karakter'}
                                                        value={data.password}
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        required={!isEdit}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm position-absolute border-0 text-secondary"
                                                        style={{ right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent' }}
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                                    </button>
                                                </div>
                                                {errors.password && <div className="text-danger mt-1" style={{ fontSize: '0.78rem' }}>{errors.password}</div>}
                                            </div>

                                            {/* Status Switch */}
                                            <div className="col-12 mt-3 pt-3 border-top">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div>
                                                        <div className="fw-semibold" style={{ fontSize: '0.86rem', color: 'var(--ink)' }}>Status Akun Aktif</div>
                                                        <div className="text-muted" style={{ fontSize: '0.74rem' }}>Pengguna dapat login dan mengakses dashboard SIGAP</div>
                                                    </div>
                                                    <label className="status-toggle-switch mb-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.is_active}
                                                            onChange={(e) => setData('is_active', e.target.checked)}
                                                        />
                                                        <span className="status-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Role Selection */}
                                <div className="col-12 col-lg-6">
                                    <div className="glass-card p-4 h-100" style={{ background: '#fff', borderRadius: '18px', border: '1px solid var(--line)' }}>
                                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                            <i className="bi bi-shield-lock text-teal" style={{ color: 'var(--teal-1)', fontSize: '1.1rem' }}></i>
                                            <span className="fw-bold" style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>Penugasan Peran & Hak Akses (RBAC) <span className="text-danger">*</span></span>
                                        </div>

                                        <p className="text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                                            Pilih satu tingkat peran yang menentukan hak akses menu dan otorisasi tindakan di sistem:
                                        </p>

                                        <div className="d-grid gap-2.5">
                                            {[
                                                { 
                                                    id: 'dev', 
                                                    label: 'Developer / Superadmin', 
                                                    desc: 'Akses penuh tanpa batas: konfigurasi sistem, server, API, dan audit keamanan.', 
                                                    icon: 'bi-code-slash', 
                                                    color: '#7c3aed',
                                                    badge: 'Full Access'
                                                },
                                                { 
                                                    id: 'admin', 
                                                    label: 'Administrator OPD', 
                                                    desc: 'Mengelola situs instansi, pemantauan uptime, remedi insiden, dan laporan.', 
                                                    icon: 'bi-person-gear', 
                                                    color: '#d97706',
                                                    badge: 'Management'
                                                },
                                                { 
                                                    id: 'user', 
                                                    label: 'Pengguna Biasa / Viewer', 
                                                    desc: 'Hanya melihat dashboard pemantauan, grafik performa, dan laporan publik.', 
                                                    icon: 'bi-person', 
                                                    color: 'var(--teal-1)',
                                                    badge: 'Read Only'
                                                },
                                            ].map((r) => {
                                                const isSelected = data.role === r.id;
                                                return (
                                                    <div
                                                        key={r.id}
                                                        onClick={() => setData('role', r.id)}
                                                        className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                                                        style={{
                                                            border: isSelected ? `2px solid ${r.color}` : '1.5px solid var(--line)',
                                                            background: isSelected ? `${r.color}0c` : 'rgba(255,255,255,0.7)',
                                                            boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div style={{
                                                                width: '38px', height: '38px', borderRadius: '12px',
                                                                background: isSelected ? `${r.color}20` : '#f1f5f9',
                                                                color: isSelected ? r.color : '#64748b', 
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '1.15rem', flexShrink: 0
                                                            }}>
                                                                <i className={`bi ${r.icon}`}></i>
                                                            </div>
                                                            <div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>{r.label}</span>
                                                                    <span className="badge" style={{ background: isSelected ? r.color : '#cbd5e1', color: '#fff', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
                                                                        {r.badge}
                                                                    </span>
                                                                </div>
                                                                <div className="text-muted mt-0.5" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>{r.desc}</div>
                                                            </div>
                                                        </div>
                                                        <input 
                                                            type="radio" 
                                                            name="user_role" 
                                                            checked={isSelected} 
                                                            onChange={() => setData('role', r.id)}
                                                            style={{ accentColor: r.color, width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {errors.role && <div className="text-danger mt-2" style={{ fontSize: '0.78rem' }}>{errors.role}</div>}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="modal-footer border-top px-4 py-3 bg-white d-flex justify-content-between align-items-center">
                            <button
                                type="button"
                                className="btn btn-light"
                                style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500, padding: '0.55rem 1.2rem' }}
                                onClick={onClose}
                                disabled={processing}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="btn text-white d-flex align-items-center gap-1.5 shadow-sm"
                                style={{
                                    background: 'linear-gradient(135deg, var(--teal-1), var(--blue-1))',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    padding: '0.55rem 1.6rem'
                                }}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <i className={`bi ${isEdit ? 'bi-check2-circle' : 'bi-person-plus-fill'}`}></i>
                                        <span>{isEdit ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
