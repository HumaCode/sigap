import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler, useState, KeyboardEvent, useRef } from 'react';
import PopupLoader from '@/Components/PopupLoader';
import axios from 'axios';

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
    const { data, setData, post, processing, errors, reset, setError, clearErrors } = useForm({
        login: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const [loaderOpen, setLoaderOpen] = useState(false);
    const [loaderStatus, setLoaderStatus] = useState<'loading' | 'success'>('loading');
    const [loaderMessage, setLoaderMessage] = useState('Memverifikasi kredensial...');
    const [loaderProgress, setLoaderProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shakeTrigger, setShakeTrigger] = useState(false);
    const [dismissedFlash, setDismissedFlash] = useState(false);
    const [dismissedStatus, setDismissedStatus] = useState(false);

    const loginInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    const handleSsoLogin = () => {
        setLoaderStatus('loading');
        setLoaderMessage('Mengalihkan ke Server SSO HumaCode...');
        setLoaderProgress(70);
        setLoaderOpen(true);
        window.location.href = route('sso.redirect');
    };

    const handleKeyChange = (e: KeyboardEvent<HTMLInputElement>) => {
        setIsCapsLockOn(e.getModifierState('CapsLock'));
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        if (isSubmitting || processing) return;

        // Validasi input awal jika kosong
        if (!data.login.trim()) {
            setError('login', 'Silakan masukkan email atau username Anda.');
            loginInputRef.current?.focus();
            setShakeTrigger(true);
            setTimeout(() => setShakeTrigger(false), 500);
            return;
        }

        if (!data.password) {
            setError('password', 'Silakan masukkan kata sandi Anda.');
            passwordInputRef.current?.focus();
            setShakeTrigger(true);
            setTimeout(() => setShakeTrigger(false), 500);
            return;
        }

        setIsSubmitting(true);
        clearErrors();
        setLoaderOpen(true);
        setLoaderStatus('loading');
        setLoaderProgress(6);
        setLoaderMessage('Menghubungkan ke gateway keamanan...');

        // Realtime Fluid Progress Simulator dari 0% ke atas
        let currentP = 6;
        let isDone = false;
        const startTime = Date.now();

        const progressInterval = setInterval(() => {
            if (isDone) return;
            const elapsed = Date.now() - startTime;

            let target = 6;
            if (elapsed < 300) {
                target = 6 + (elapsed / 300) * 22; // 6% -> 28%
                setLoaderMessage('Menghubungkan ke gateway keamanan...');
            } else if (elapsed < 750) {
                target = 28 + ((elapsed - 300) / 450) * 32; // 28% -> 60%
                setLoaderMessage('Memverifikasi kredensial akun...');
            } else if (elapsed < 1300) {
                target = 60 + ((elapsed - 750) / 550) * 28; // 60% -> 88%
                setLoaderMessage('Memvalidasi token & enkripsi sesi...');
            } else {
                target = 88 + Math.min(6, ((elapsed - 1300) / 800) * 6); // 88% -> ~94%
                setLoaderMessage('Mempersiapkan hak akses & firewall...');
            }

            currentP = Math.max(currentP, Math.min(94, Math.round(target)));
            setLoaderProgress(currentP);
        }, 35);

        try {
            await axios.post(route('login'), {
                login: data.login,
                password: data.password,
                remember: data.remember,
            });

            isDone = true;
            clearInterval(progressInterval);

            // Transisi fluid ke 100% dengan status Berhasil Login
            setLoaderProgress(100);
            setLoaderStatus('success');
            setLoaderMessage('Berhasil Login! Selamat datang kembali. Mengalihkan ke dashboard...');

            // Beri jeda 1.2 detik agar pengguna menikmati centang animasi interaktif & progres 100%
            setTimeout(() => {
                window.location.href = route('dashboard');
            }, 1250);
        } catch (err: any) {
            isDone = true;
            clearInterval(progressInterval);
            setIsSubmitting(false);
            setLoaderOpen(false);
            setDismissedFlash(false);
            setShakeTrigger(true);
            setTimeout(() => setShakeTrigger(false), 500);

            if (err.response?.data?.errors) {
                const serverErrors = err.response.data.errors;
                if (serverErrors.login) {
                    setError('login', serverErrors.login[0]);
                }
                if (serverErrors.password) {
                    setError('password', serverErrors.password[0]);
                }
            } else if (err.response?.data?.message) {
                setError('login', err.response.data.message);
            } else {
                setError('login', 'Email/username atau kata sandi yang Anda masukkan tidak cocok.');
            }
            reset('password');
        }
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
                <button type="submit" className="btn btn-login w-100 mt-2" disabled={isSubmitting || processing}>
                    {isSubmitting || processing ? (
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
                title={loaderStatus === 'success' ? 'Berhasil Login' : 'Memverifikasi Akses...'}
                badgeText={loaderStatus === 'success' ? 'BERHASIL LOGIN' : 'GATEWAY KEAMANAN'}
                progress={loaderProgress}
                showProgressPercentage={true}
            />
        </GuestLayout>
    );
}
