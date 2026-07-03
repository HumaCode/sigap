import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import PopupLoader from '@/Components/PopupLoader';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loaderOpen, setLoaderOpen] = useState(false);
    const [loaderStatus, setLoaderStatus] = useState<'loading' | 'success'>('loading');
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onBefore: () => {
                setLoaderStatus('loading');
                setLoaderMessage('Mohon tunggu sebentar...');
                setLoaderOpen(true);
            },
            onSuccess: (page) => {
                setLoaderStatus('success');
                // Get the user name from the flashed data or page props auth user
                const userName = (page.props as any).auth?.user?.name || 'Pengguna';
                setLoaderMessage(`Selamat datang, ${userName}`);
                
                // Keep the loader open to show the success message, it will unmount on redirect
            },
            onError: () => {
                setLoaderOpen(false);
            },
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk" />

            <h2>Selamat Datang</h2>
            <p className="subtitle">Masuk ke akun Anda untuk mengakses dashboard monitoring.</p>

            {status && (
                <div className="alert alert-success py-2 px-3 mb-3 d-flex align-items-center gap-2" role="alert">
                    <i className="bi bi-info-circle"></i>
                    <span>{status}</span>
                </div>
            )}

            <form onSubmit={submit} noValidate>
                <div className="mb-3">
                    <label htmlFor="login" className="form-label">Email atau Username</label>
                    <div className="input-modern">
                        <i className={`bi bi-envelope icon-left ${errors.login ? 'text-danger' : ''}`}></i>
                        <input 
                            type="text" 
                            className={`form-control ${errors.login ? 'is-invalid' : ''}`} 
                            id="login" 
                            placeholder="nama@instansi.go.id" 
                            autoComplete="username" 
                            required 
                            value={data.login}
                            onChange={(e) => setData('login', e.target.value)}
                        />
                    </div>
                    {errors.login && (
                        <div className="text-danger mt-2 ms-1" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            <i className="bi bi-exclamation-circle me-1"></i> {errors.login}
                        </div>
                    )}
                </div>

                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Kata Sandi</label>
                    <div className="input-modern position-relative">
                        <i className={`bi bi-lock icon-left ${errors.password ? 'text-danger' : ''}`}></i>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            className={`form-control ${errors.password ? 'is-invalid' : ''}`} 
                            id="password" 
                            placeholder="Masukkan kata sandi" 
                            autoComplete="current-password" 
                            required 
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <button 
                            type="button" 
                            className="toggle-pass" 
                            aria-label="Tampilkan kata sandi"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                        </button>
                    </div>
                    {errors.password && (
                        <div className="text-danger mt-2 ms-1" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            <i className="bi bi-exclamation-circle me-1"></i> {errors.password}
                        </div>
                    )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3 mt-3 flex-wrap gap-2">
                    <div className="form-check">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="remember" 
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="remember">Ingat saya</label>
                    </div>
                    {canResetPassword && (
                        <a href={route('password.request')} className="link-forgot">Lupa kata sandi?</a>
                    )}
                </div>

                <button type="submit" className="btn btn-login w-100 mt-2" disabled={processing}>
                    {processing ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Memproses...</>
                    ) : (
                        <>Masuk <i className="bi bi-arrow-right ms-1"></i></>
                    )}
                </button>

                <div className="divider-text">atau</div>

                <button type="button" className="btn btn-outline-secondary w-100 rounded-3 py-2 d-flex align-items-center justify-content-center gap-2" style={{fontSize: '0.88rem', borderColor: 'rgba(15,42,63,0.15)', color: 'var(--ink)'}}>
                    <i className="bi bi-microsoft"></i> Masuk dengan SSO Instansi
                </button>
            </form>

            <p className="footer-note">
                <i className="bi bi-shield-check"></i> Akses dilindungi &amp; dipantau — SIGAP Web &copy; 2026
            </p>

            <PopupLoader 
                isOpen={loaderOpen}
                status={loaderStatus}
                message={loaderMessage}
            />
        </GuestLayout>
    );
}
