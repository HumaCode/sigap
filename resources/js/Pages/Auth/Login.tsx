import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler, useState, KeyboardEvent, useRef } from 'react';
import PopupLoader from '@/Components/PopupLoader';

export default function Login({
    status,
    canResetPassword,
    ssoEnabled = true,
}: {
    status?: string;
    canResetPassword: boolean;
    ssoEnabled?: boolean;
}) {
    const { props: pageProps } = usePage<PageProps>();
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const [loaderOpen, setLoaderOpen] = useState(false);
    const [loaderStatus, setLoaderStatus] = useState<'loading' | 'success'>('loading');
    const [loaderMessage, setLoaderMessage] = useState('Memverifikasi kredensial...');
    const [shakeTrigger, setShakeTrigger] = useState(false);
    const [dismissedFlash, setDismissedFlash] = useState(false);
    const [dismissedStatus, setDismissedStatus] = useState(false);

    const loginInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    const handleSsoLogin = () => {
        setLoaderStatus('loading');
        setLoaderMessage('Mengalihkan ke Server SSO HumaCode...');
        setLoaderOpen(true);
        window.location.href = route('sso.redirect');
    };

    const handleKeyChange = (e: KeyboardEvent<HTMLInputElement>) => {
        setIsCapsLockOn(e.getModifierState('CapsLock'));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        let timerId: any = null;

        post(route('login'), {
            onBefore: () => {
                setLoaderStatus('loading');
                setLoaderMessage('Memverifikasi kredensial akun...');
                setLoaderOpen(true);

                timerId = setTimeout(() => {
                    setLoaderMessage('Memvalidasi token & enkripsi sesi...');
                }, 800);
            },
            onSuccess: (page) => {
                if (timerId) clearTimeout(timerId);
                setLoaderStatus('success');
                const userName = (page.props as any).auth?.user?.name || 'Pengguna';
                setLoaderMessage(`Selamat datang, ${userName}! Mengalihkan ke dashboard...`);
            },
            onError: () => {
                if (timerId) clearTimeout(timerId);
                setLoaderOpen(false);
                setDismissedFlash(false);
                setShakeTrigger(true);
                setTimeout(() => setShakeTrigger(false), 500);
            },
            onFinish: () => {
                if (timerId) clearTimeout(timerId);
                reset('password');
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk - SIGAP Web" />

            <div className="d-flex align-items-center justify-content-between mb-1">
                <h2>Selamat Datang</h2>
                <span className="badge bg-light text-teal border px-2 py-1 rounded-pill" style={{ color: 'var(--teal-1)', fontSize: '0.74rem', fontWeight: 600 }}>
                    <i className="bi bi-shield-check me-1"></i> Portal Aman
                </span>
            </div>
            <p className="subtitle">Masuk ke akun Anda untuk mengakses dashboard monitoring.</p>

            {/* Interactive Status Alert */}
            {status && !dismissedStatus && (
                <div className="login-alert-interactive login-alert-success" role="alert">
                    <div className="login-alert-icon-wrap">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="login-alert-body">
                        <div className="login-alert-title">
                            <span>Informasi Sesi</span>
                        </div>
                        <p className="login-alert-desc">{status}</p>
                    </div>
                    <button
                        type="button"
                        className="login-alert-close"
                        onClick={() => setDismissedStatus(true)}
                        title="Tutup pesan"
                        aria-label="Tutup"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {/* Interactive Flash Error Alert */}
            {pageProps?.flash?.error && !dismissedFlash && (
                <div className="login-alert-interactive" role="alert">
                    <div className="login-alert-icon-wrap">
                        <i className="bi bi-shield-exclamation"></i>
                    </div>
                    <div className="login-alert-body">
                        <div className="login-alert-title">
                            <span>Peringatan Akses</span>
                        </div>
                        <p className="login-alert-desc">{pageProps.flash.error}</p>
                    </div>
                    <button
                        type="button"
                        className="login-alert-close"
                        onClick={() => setDismissedFlash(true)}
                        title="Tutup pesan"
                        aria-label="Tutup"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            <form onSubmit={submit} noValidate>
                {/* Email / Username Input */}
                <div className="mb-3">
                    <label htmlFor="login" className="form-label">
                        <span>Email atau Username</span>
                        <span className="text-muted" style={{ fontSize: '0.76rem', fontWeight: 400 }}>ID Terdaftar</span>
                    </label>
                    <div className={`input-modern ${shakeTrigger && errors.login ? 'input-shake' : ''}`}>
                        <i className={`bi bi-person-badge icon-left ${errors.login ? 'text-danger' : ''}`}></i>
                        <input
                            ref={loginInputRef}
                            type="text"
                            className={`form-control ${errors.login ? 'is-invalid' : ''}`}
                            id="login"
                            placeholder="Masukkan username / email"
                            autoComplete="username"
                            required
                            value={data.login}
                            onChange={(e) => setData('login', e.target.value)}
                        />
                    </div>
                    {errors.login && (
                        <div className="field-error-badge">
                            <div className="field-error-text">
                                <i className="bi bi-exclamation-octagon-fill"></i>
                                <span>{errors.login}</span>
                            </div>
                            <button
                                type="button"
                                className="field-error-action"
                                onClick={() => {
                                    setData('login', '');
                                    loginInputRef.current?.focus();
                                }}
                                title="Kosongkan dan ketik ulang"
                            >
                                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* Password Input */}
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                        <span>Kata Sandi</span>
                    </label>
                    <div className={`input-modern position-relative ${shakeTrigger && errors.password ? 'input-shake' : ''}`}>
                        <i className={`bi bi-shield-lock icon-left ${errors.password ? 'text-danger' : ''}`}></i>
                        <input
                            ref={passwordInputRef}
                            type={showPassword ? 'text' : 'password'}
                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                            id="password"
                            placeholder="Masukkan password"
                            autoComplete="current-password"
                            required
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            onKeyDown={handleKeyChange}
                            onKeyUp={handleKeyChange}
                        />
                        <button
                            type="button"
                            className="toggle-pass"
                            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                            title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <i className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
                        </button>
                    </div>

                    {/* Interactive Caps Lock Alert */}
                    {isCapsLockOn && (
                        <div className="caps-lock-badge">
                            <i className="bi bi-capslock-fill"></i>
                            <span>Peringatan: Tombol Caps Lock sedang aktif</span>
                        </div>
                    )}

                    {errors.password && (
                        <div className="field-error-badge">
                            <div className="field-error-text">
                                <i className="bi bi-exclamation-octagon-fill"></i>
                                <span>{errors.password}</span>
                            </div>
                            <button
                                type="button"
                                className="field-error-action"
                                onClick={() => {
                                    setData('password', '');
                                    passwordInputRef.current?.focus();
                                }}
                                title="Kosongkan kata sandi"
                            >
                                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="d-flex justify-content-between align-items-center mb-3 mt-3 flex-wrap gap-2">
                    <div className="form-check d-flex align-items-center gap-2">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="remember">
                            Ingat saya di perangkat ini
                        </label>
                    </div>
                    {canResetPassword && (
                        <a href={route('password.request')} className="link-forgot">
                            Lupa kata sandi?
                        </a>
                    )}
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn btn-login w-100 mt-2" disabled={processing}>
                    {processing ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Memverifikasi Kredensial...
                        </>
                    ) : (
                        <>
                            <span>Masuk ke Dashboard</span>
                            <i className="bi bi-arrow-right"></i>
                        </>
                    )}
                </button>

                {ssoEnabled && (
                    <>
                        <div className="divider-text">atau akses via</div>

                        {/* SSO Button */}
                        <button
                            type="button"
                            className="btn btn-sso w-100"
                            onClick={handleSsoLogin}
                        >
                            <i className="bi bi-fingerprint text-teal" style={{ color: 'var(--teal-1)', fontSize: '1.2rem' }}></i>
                            <span style={{ fontWeight: 600 }}>Masuk dengan SSO HumaCode</span>
                        </button>
                    </>
                )}
            </form>

            {/* Footer Trust Note */}
            <p className="footer-note">
                <i className="bi bi-shield-check"></i>
                <span>Terenkripsi 256-Bit SSL • Akses Terpantau &amp; Dicatat Audit Log &copy; 2026</span>
            </p>

            <PopupLoader
                isOpen={loaderOpen}
                status={loaderStatus}
                message={loaderMessage}
                title={loaderStatus === 'success' ? 'Autentikasi Berhasil' : 'Memverifikasi Akses...'}
                badgeText={loaderStatus === 'success' ? 'AKSES DITERIMA' : 'GATEWAY KEAMANAN'}
            />
        </GuestLayout>
    );
}
