import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler, useState, KeyboardEvent } from 'react';
import PopupLoader from '@/Components/PopupLoader';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
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

    const handleKeyChange = (e: KeyboardEvent<HTMLInputElement>) => {
        setIsCapsLockOn(e.getModifierState('CapsLock'));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onBefore: () => {
                setLoaderStatus('loading');
                setLoaderMessage('Memverifikasi kredensial...');
                setLoaderOpen(true);
            },
            onSuccess: (page) => {
                setLoaderStatus('success');
                const userName = (page.props as any).auth?.user?.name || 'Pengguna';
                setLoaderMessage(`Selamat datang, ${userName}! Mengalihkan ke dashboard...`);
            },
            onError: () => {
                setLoaderOpen(false);
            },
            onFinish: () => reset('password'),
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

            {status && (
                <div className="alert alert-success py-2 px-3 mb-3 d-flex align-items-center gap-2 rounded-3" role="alert">
                    <i className="bi bi-info-circle-fill"></i>
                    <span>{status}</span>
                </div>
            )}

            {pageProps?.flash?.error && (
                <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2 rounded-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>{pageProps.flash.error}</span>
                </div>
            )}

            <form onSubmit={submit} noValidate>
                {/* Email / Username Input */}
                <div className="mb-3">
                    <label htmlFor="login" className="form-label">
                        <span>Email atau Username</span>
                        <span className="text-muted" style={{ fontSize: '0.76rem', fontWeight: 400 }}>ID Terdaftar</span>
                    </label>
                    <div className="input-modern">
                        <i className={`bi bi-person-badge icon-left ${errors.login ? 'text-danger' : ''}`}></i>
                        <input
                            type="text"
                            className={`form-control ${errors.login ? 'is-invalid' : ''}`}
                            id="login"
                            placeholder="user@humacode.com atau username"
                            autoComplete="username"
                            required
                            value={data.login}
                            onChange={(e) => setData('login', e.target.value)}
                        />
                    </div>
                    {errors.login && (
                        <div className="text-danger mt-2 ms-1" style={{ fontSize: '0.84rem', fontWeight: 500 }}>
                            <i className="bi bi-exclamation-circle-fill me-1"></i> {errors.login}
                        </div>
                    )}
                </div>

                {/* Password Input */}
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                        <span>Kata Sandi</span>
                    </label>
                    <div className="input-modern position-relative">
                        <i className={`bi bi-shield-lock icon-left ${errors.password ? 'text-danger' : ''}`}></i>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                            id="password"
                            placeholder="Masukkan kata sandi akun"
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
                        <div className="text-danger mt-2 ms-1" style={{ fontSize: '0.84rem', fontWeight: 500 }}>
                            <i className="bi bi-exclamation-circle-fill me-1"></i> {errors.password}
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

                <div className="divider-text">atau akses via</div>

                {/* SSO Button */}
                <button
                    type="button"
                    className="btn btn-sso w-100"
                    onClick={() => alert('Integrasi SSO HumaCode siap dikonfigurasikan dengan OAuth2 / Single Sign-On.')}
                >
                    <i className="bi bi-fingerprint text-teal" style={{ color: 'var(--teal-1)', fontSize: '1.2rem' }}></i>
                    <span style={{ fontWeight: 600 }}>Masuk dengan SSO HumaCode</span>
                </button>
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
            />
        </GuestLayout>
    );
}
