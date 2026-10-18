import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FormEventHandler, useState, useRef, useEffect } from 'react';
import PopupLoader from '@/Components/PopupLoader';

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: string | HTMLElement,
                options: {
                    sitekey: string;
                    theme?: 'light' | 'dark' | 'auto';
                    size?: 'normal' | 'compact' | 'flexible';
                    callback?: (token: string) => void;
                    'expired-callback'?: () => void;
                    'error-callback'?: () => void;
                    [key: string]: any;
                }
            ) => string;
            reset: (widgetId?: string) => void;
            remove: (widgetId?: string) => void;
            getResponse: (widgetId?: string) => string;
        };
        onloadTurnstileCallback?: () => void;
    }
}

export default function ForgotPassword({
    status,
    turnstileSiteKey,
}: {
    status?: string;
    turnstileSiteKey?: string;
}) {
    const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
        email: '',
        turnstile: '',
        cf_turnstile_response: '',
        'cf-turnstile-response': '',
    });

    const [loaderOpen, setLoaderOpen] = useState(false);
    const [loaderStatus, setLoaderStatus] = useState<'loading' | 'success'>('loading');
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const turnstileContainerRef = useRef<HTMLDivElement>(null);
    const turnstileWidgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!turnstileSiteKey) return;

        let isMounted = true;

        const renderTurnstile = () => {
            if (!isMounted || !turnstileContainerRef.current || !window.turnstile) return;

            if (turnstileWidgetIdRef.current) {
                try {
                    window.turnstile.remove(turnstileWidgetIdRef.current);
                } catch (e) {
                    // ignore
                }
                turnstileWidgetIdRef.current = null;
            }

            try {
                const widgetId = window.turnstile.render(turnstileContainerRef.current, {
                    sitekey: turnstileSiteKey,
                    theme: 'light',
                    callback: (token: string) => {
                        if (!isMounted) return;
                        setTurnstileToken(token);
                        setData((prev) => ({
                            ...prev,
                            turnstile: token,
                            cf_turnstile_response: token,
                            'cf-turnstile-response': token,
                        }));
                        clearErrors('turnstile');
                    },
                    'expired-callback': () => {
                        if (!isMounted) return;
                        setTurnstileToken('');
                        setData((prev) => ({
                            ...prev,
                            turnstile: '',
                            cf_turnstile_response: '',
                            'cf-turnstile-response': '',
                        }));
                    },
                    'error-callback': () => {
                        if (!isMounted) return;
                        setTurnstileToken('');
                        setData((prev) => ({
                            ...prev,
                            turnstile: '',
                            cf_turnstile_response: '',
                            'cf-turnstile-response': '',
                        }));
                        setError('turnstile', 'Gagal memuat Cloudflare Turnstile. Silakan muat ulang halaman.');
                    },
                });
                turnstileWidgetIdRef.current = widgetId;
            } catch (err) {
                console.error('Turnstile render error:', err);
            }
        };

        if (window.turnstile) {
            renderTurnstile();
        } else {
            window.onloadTurnstileCallback = () => {
                if (isMounted) {
                    renderTurnstile();
                }
            };

            const existingScript = document.getElementById('cf-turnstile-script');
            if (!existingScript) {
                const script = document.createElement('script');
                script.id = 'cf-turnstile-script';
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';
                script.async = true;
                script.defer = true;
                script.onerror = () => {
                    if (isMounted) {
                        setError('turnstile', 'Koneksi ke Cloudflare Turnstile terhalang. Periksa koneksi internet Anda.');
                    }
                };
                document.head.appendChild(script);
            }
        }

        return () => {
            isMounted = false;
            if (turnstileWidgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(turnstileWidgetIdRef.current);
                } catch (e) {
                    // ignore
                }
                turnstileWidgetIdRef.current = null;
            }
        };
    }, [turnstileSiteKey]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (turnstileSiteKey && !turnstileToken) {
            setError('turnstile', 'Silakan selesaikan verifikasi Cloudflare Turnstile terlebih dahulu.');
            return;
        }

        post(route('password.email'), {
            onBefore: () => {
                setLoaderStatus('loading');
                setLoaderMessage('Mengirim tautan reset...');
                setLoaderOpen(true);
            },
            onSuccess: () => {
                setLoaderStatus('success');
                setLoaderMessage('Tautan reset kata sandi telah dikirim ke email Anda!');
                setTimeout(() => setLoaderOpen(false), 2000);
            },
            onError: () => {
                setLoaderOpen(false);
                if (turnstileWidgetIdRef.current && window.turnstile) {
                    try {
                        window.turnstile.reset(turnstileWidgetIdRef.current);
                    } catch (e) {
                        // ignore
                    }
                    setTurnstileToken('');
                    setData((prev) => ({
                        ...prev,
                        turnstile: '',
                        cf_turnstile_response: '',
                        'cf-turnstile-response': '',
                    }));
                }
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Lupa Kata Sandi" />

            <h2>Lupa Kata Sandi</h2>
            <p className="subtitle" style={{ marginBottom: '1.2rem', lineHeight: '1.5' }}>
                Lupa kata sandi Anda? Tidak masalah. Beri tahu kami alamat email Anda dan kami akan mengirimkan tautan reset kata sandi agar Anda dapat membuat yang baru.
            </p>

            {status && (
                <div className="alert alert-success py-2 px-3 mb-3 d-flex align-items-center gap-2" role="alert">
                    <i className="bi bi-info-circle"></i>
                    <span>{status}</span>
                </div>
            )}

            <form onSubmit={submit} noValidate>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Akun</label>
                    <div className="input-modern">
                        <i className={`bi bi-envelope icon-left ${errors.email ? 'text-danger' : ''}`}></i>
                        <input 
                            type="email" 
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                            id="email" 
                            placeholder="user@humacode.com atau email terdaftar" 
                            autoComplete="email" 
                            required 
                            autoFocus
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>
                    {errors.email && (
                        <div className="text-danger mt-2 ms-1" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            <i className="bi bi-exclamation-circle me-1"></i> {errors.email}
                        </div>
                    )}
                </div>

                {/* Cloudflare Turnstile Security Widget */}
                {turnstileSiteKey && (
                    <div className="turnstile-container-wrapper mb-3">
                        <div className="d-flex justify-content-center">
                            <div 
                                ref={turnstileContainerRef} 
                                className="cf-turnstile-box" 
                                style={{ minHeight: '65px' }}
                            />
                        </div>
                        {errors.turnstile && (
                            <div className="field-error-badge mt-2">
                                <div className="field-error-text">
                                    <i className="bi bi-shield-x"></i>
                                    <span>{errors.turnstile}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <Link href={route('login')} className="link-forgot">
                        <i className="bi bi-arrow-left me-1"></i> Kembali ke Login
                    </Link>
                    
                    <button type="submit" className="btn btn-login" disabled={processing}>
                        {processing ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Mengirim...</>
                        ) : (
                            <>Kirim Tautan Reset <i className="bi bi-send ms-1"></i></>
                        )}
                    </button>
                </div>
            </form>

            <PopupLoader 
                isOpen={loaderOpen}
                status={loaderStatus}
                message={loaderMessage}
            />
        </GuestLayout>
    );
}

