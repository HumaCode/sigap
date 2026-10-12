import axios from 'axios';
import React, { useState } from 'react';
import { toast } from '@/Components/DynamicToast';

export interface SsoSettingData {
    enabled: boolean;
    app_name: string;
    base_url: string;
    client_id: string;
    client_secret: string;
    has_client_secret?: boolean;
    redirect_uri: string;
    logout_uri: string;
    scopes: string[];
    first_party: boolean;
}

interface SsoTabProps {
    data: SsoSettingData;
    onSave: (settings: Record<string, any>) => void;
    isSaving: boolean;
}

export default function SsoTab({ data, onSave, isSaving }: SsoTabProps) {
    const [enabled, setEnabled] = useState(Boolean(data.enabled ?? true));
    const [appName, setAppName] = useState(data.app_name || 'SIGAP Web');
    const [baseUrl, setBaseUrl] = useState(data.base_url || 'http://localhost:8001');
    const [clientId, setClientId] = useState(data.client_id || '');
    const [clientSecret, setClientSecret] = useState(data.client_secret || '');
    const [showClientSecret, setShowClientSecret] = useState(false);
    const [redirectUri, setRedirectUri] = useState(
        data.redirect_uri || (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:8000/auth/callback')
    );
    const [logoutUri, setLogoutUri] = useState(
        data.logout_uri || (typeof window !== 'undefined' ? `${window.location.origin}/auth/logout` : 'http://localhost:8000/auth/logout')
    );
    const [scopes, setScopes] = useState<string[]>(Array.isArray(data.scopes) && data.scopes.length > 0 ? data.scopes : ['profile', 'roles']);
    const [firstParty, setFirstParty] = useState(Boolean(data.first_party ?? true));

    // Test connection states
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; status?: number } | null>(null);

    const handleScopeToggle = (scopeName: string) => {
        if (scopes.includes(scopeName)) {
            // keep at least 1 scope if possible
            setScopes(scopes.filter(s => s !== scopeName));
        } else {
            setScopes([...scopes, scopeName]);
        }
    };

    const handleTestConnection = async () => {
        if (!baseUrl.trim()) {
            toast.error('Perhatian', 'URL Server SSO wajib diisi.');
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const res = await axios.post(route('settings.sso.test'), {
                base_url: baseUrl.trim(),
            });

            if (res.data.success) {
                setTestResult({
                    success: true,
                    message: res.data.message || 'Koneksi ke Server SSO berhasil.',
                    status: res.data.status,
                });
                toast.success('Koneksi Berhasil', res.data.message || 'Server SSO HumaCode merespons aktif.');
            } else {
                setTestResult({
                    success: false,
                    message: res.data.message || 'Gagal terhubung ke Server SSO.',
                    status: res.data.status,
                });
                toast.error('Koneksi Gagal', res.data.message || 'Periksa kembali URL Server SSO.');
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat menguji koneksi SSO.';
            setTestResult({
                success: false,
                message: errMsg,
            });
            toast.error('Gagal Menguji Koneksi', errMsg);
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            sso_enabled: enabled,
            sso_app_name: appName.trim(),
            sso_base_url: baseUrl.trim(),
            sso_client_id: clientId.trim(),
            sso_client_secret: clientSecret.trim(),
            sso_redirect_uri: redirectUri.trim(),
            sso_logout_uri: logoutUri.trim(),
            sso_scopes: scopes,
            sso_first_party: firstParty,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="settings-card">
                {/* Header */}
                <div className="settings-card-header">
                    <div>
                        <h4 className="settings-card-title">
                            <i className="bi bi-shield-lock-fill text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                            Integrasi SSO HumaCode
                        </h4>
                        <p className="settings-card-subtitle">
                            Kelola otentikasi terpusat OAuth2 / OpenID Connect dengan Identity Provider HumaCode
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${enabled ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-muted border'} px-3 py-2 rounded-pill`} style={{ fontSize: '0.8rem' }}>
                            <i className={`bi ${enabled ? 'bi-check-circle-fill' : 'bi-dash-circle'} me-1`}></i>
                            {enabled ? 'SSO Aktif' : 'SSO Nonaktif'}
                        </span>
                    </div>
                </div>

                {/* Status Toggle Card */}
                <div className="p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: enabled ? 'rgba(14, 165, 163, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                            color: enabled ? 'var(--teal-1, #0ea5a3)' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                        }}>
                            <i className="bi bi-person-badge"></i>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink, #0f2a3f)' }}>
                                Izinkan Login Melalui SSO HumaCode
                            </div>
                            <div className="settings-hint mt-0">
                                Saat diaktifkan, tombol login & registrasi dengan akun HumaCode akan tampil di halaman login SIGAP.
                            </div>
                        </div>
                    </div>

                    <div className="form-check form-switch m-0">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="ssoEnabledSwitch"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                            style={{ width: '2.75rem', height: '1.35rem', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {/* 1. Server SSO HumaCode Box */}
                <div className="p-3 mb-4 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(14, 165, 163, 0.12)',
                                color: 'var(--teal-1, #0ea5a3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                            }}>
                                <i className="bi bi-hdd-network"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink, #0f2a3f)' }}>
                                    Server SSO HumaCode (Identity Provider)
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                    Server otentikasi pusat yang memvalidasi kredensial pengguna dan menerbitkan token OAuth
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        {testResult ? (
                            <span className={`badge rounded-pill px-3 py-2 ${
                                testResult.success ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'
                            }`} style={{ fontSize: '0.78rem' }}>
                                <i className={`bi ${testResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                                {testResult.success ? `Terhubung (HTTP ${testResult.status || 200})` : 'Gagal Terhubung'}
                            </span>
                        ) : (
                            <span className="badge rounded-pill bg-white text-muted border px-3 py-2" style={{ fontSize: '0.78rem' }}>
                                <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem', verticalAlign: 'middle', color: '#94a3b8' }}></i>
                                Belum Diuji
                            </span>
                        )}
                    </div>

                    <div className="row g-2 align-items-center">
                        <div className="col-12 col-md-8 col-lg-9">
                            <label className="settings-label mb-1">
                                URL Server SSO (Base URL) <span className="text-danger">*</span>
                            </label>
                            <div className="settings-input-group">
                                <span style={{ position: 'absolute', left: '12px', color: 'var(--muted, #64748b)', zIndex: 2 }}>
                                    <i className="bi bi-globe2"></i>
                                </span>
                                <input
                                    type="url"
                                    className="settings-input"
                                    style={{ paddingLeft: '36px' }}
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder="http://localhost:8001"
                                    required
                                />
                            </div>
                        </div>

                        <div className="col-12 col-md-4 col-lg-3">
                            <label className="settings-label mb-1 d-none d-md-block" style={{ visibility: 'hidden' }}>
                                Aksi
                            </label>
                            <button
                                type="button"
                                className="btn-test-connection w-100 justify-content-center"
                                onClick={handleTestConnection}
                                disabled={isTesting || !baseUrl.trim()}
                                style={{ height: '42px' }}
                            >
                                {isTesting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                        Menguji...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-broadcast"></i>
                                        Tes Koneksi SSO
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mt-2 flex-wrap gap-2 text-muted" style={{ fontSize: '0.76rem' }}>
                        <div>
                            <i className="bi bi-info-circle me-1"></i>
                            Untuk lingkungan lokal saat ini gunakan <code>http://localhost:8001</code>
                        </div>
                        {baseUrl === 'http://localhost:8001' && (
                            <span className="text-success fw-medium">
                                <i className="bi bi-check2 me-1"></i>URL lokal aktif
                            </span>
                        )}
                    </div>

                    {/* Result message banner - compact and neatly integrated */}
                    {testResult && (
                        <div className={`connection-banner ${testResult.success ? 'success' : 'error'} mt-3 mb-0`} style={{ borderRadius: '10px', padding: '0.75rem 1rem' }}>
                            <i className={`bi ${testResult.success ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`} style={{ fontSize: '1.15rem' }}></i>
                            <div className="flex-grow-1" style={{ fontSize: '0.84rem' }}>
                                <span className="fw-semibold">{testResult.success ? 'Koneksi Berhasil: ' : 'Koneksi Gagal: '}</span>
                                <span>{testResult.message}</span>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                style={{ fontSize: '0.65rem' }}
                                onClick={() => setTestResult(null)}
                                aria-label="Tutup"
                            ></button>
                        </div>
                    )}
                </div>

                {/* 2. Konfigurasi Klien Aplikasi (Sesuai Portal SSO) */}
                <div className="mb-4">
                    <h5 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ink, #0f2a3f)', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="bi bi-sliders2-vertical text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                        2. Konfigurasi Klien Aplikasi (Sesuai Modal Edit Aplikasi SSO)
                    </h5>

                    <div className="row g-3">
                        {/* Nama Aplikasi */}
                        <div className="col-12">
                            <label className="settings-label">
                                Nama Aplikasi <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="settings-input"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                placeholder="SIGAP Web"
                                required
                            />
                        </div>

                        {/* Redirect URI */}
                        <div className="col-12">
                            <label className="settings-label">
                                Redirect URI <span className="text-danger">*</span>
                            </label>
                            <input
                                type="url"
                                className="settings-input"
                                value={redirectUri}
                                onChange={(e) => setRedirectUri(e.target.value)}
                                placeholder="http://localhost:8000/auth/callback"
                                required
                            />
                            <div className="settings-hint d-flex align-items-center gap-1">
                                <i className="bi bi-info-circle text-muted"></i>
                                <span>URL callback tempat SSO mengirimkan authorization code setelah user login.</span>
                            </div>
                        </div>

                        {/* Logout URI (Opsional) */}
                        <div className="col-12">
                            <label className="settings-label">
                                Logout URI (Opsional)
                            </label>
                            <input
                                type="url"
                                className="settings-input"
                                value={logoutUri}
                                onChange={(e) => setLogoutUri(e.target.value)}
                                placeholder="http://localhost:8000/auth/logout"
                            />
                            <div className="settings-hint d-flex align-items-center gap-1">
                                <i className="bi bi-info-circle text-muted"></i>
                                <span>URL tempat SSO mengirimkan sinyal Single Logout (SLO).</span>
                            </div>
                        </div>

                        {/* Scope Izin */}
                        <div className="col-12">
                            <label className="settings-label mb-2">Scope Izin</label>
                            <div className="d-flex align-items-center gap-4 pt-1">
                                <div className="form-check d-flex align-items-center gap-2 m-0">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="scopeProfile"
                                        checked={scopes.includes('profile')}
                                        onChange={() => handleScopeToggle('profile')}
                                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label" htmlFor="scopeProfile" style={{ fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer' }}>
                                        profile
                                    </label>
                                </div>

                                <div className="form-check d-flex align-items-center gap-2 m-0">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="scopeRoles"
                                        checked={scopes.includes('roles')}
                                        onChange={() => handleScopeToggle('roles')}
                                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label" htmlFor="scopeRoles" style={{ fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer' }}>
                                        roles
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* First-Party Switch */}
                        <div className="col-12 pt-2">
                            <div className="form-check form-switch d-flex align-items-center gap-2 ps-0">
                                <input
                                    className="form-check-input ms-0 me-2"
                                    type="checkbox"
                                    role="switch"
                                    id="firstPartySwitch"
                                    checked={firstParty}
                                    onChange={(e) => setFirstParty(e.target.checked)}
                                    style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                                />
                                <label className="form-check-label" htmlFor="firstPartySwitch" style={{ fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', color: 'var(--ink, #0f2a3f)' }}>
                                    Tandai sebagai first-party (lewati consent screen)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="my-4" style={{ borderColor: 'var(--line, #e2e8f0)' }} />

                {/* 3. Kredensial OAuth Client */}
                <div className="mb-4">
                    <h5 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ink, #0f2a3f)', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="bi bi-key-fill text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                        3. Kredensial OAuth Client (Didapat dari Server SSO)
                    </h5>

                    <div className="row g-3">
                        <div className="col-12 col-md-6">
                            <label className="settings-label">
                                Client ID
                            </label>
                            <input
                                type="text"
                                className="settings-input"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="Contoh: 9d14a24f-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            />
                            <div className="settings-hint">
                                ID Klien yang diterbitkan oleh server SSO untuk aplikasi SIGAP
                            </div>
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="settings-label">
                                Client Secret
                            </label>
                            <div className="settings-input-group">
                                <input
                                    type={showClientSecret ? 'text' : 'password'}
                                    className="settings-input pe-5"
                                    value={clientSecret}
                                    onChange={(e) => setClientSecret(e.target.value)}
                                    placeholder={data.has_client_secret && !clientSecret ? '••••••••••••••••••••••••' : 'Masukkan Client Secret'}
                                />
                                <button
                                    type="button"
                                    className="settings-input-btn"
                                    onClick={() => setShowClientSecret(!showClientSecret)}
                                    tabIndex={-1}
                                    title={showClientSecret ? 'Sembunyikan Secret' : 'Tampilkan Secret'}
                                >
                                    <i className={`bi ${showClientSecret ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                            </div>
                            <div className="settings-hint">
                                {data.has_client_secret && !clientSecret ? (
                                    <span className="text-success">
                                        <i className="bi bi-check-circle-fill me-1"></i>
                                        Client secret telah tersimpan dengan aman di database. Kosongkan jika tidak ingin mengubah.
                                    </span>
                                ) : (
                                    'Rahasiakan client secret ini dari publik'
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Save Button */}
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
                                Simpan Konfigurasi SSO
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
