import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import PopupLoader from '@/Components/PopupLoader';
import { useState } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const [loaderOpen, setLoaderOpen] = useState(false);
    const [loaderStatus, setLoaderStatus] = useState<'loading' | 'success'>('loading');
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

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
            }
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
                <div className="mb-4">
                    <label htmlFor="email" className="form-label">Email Instansi</label>
                    <div className="input-modern">
                        <i className={`bi bi-envelope icon-left ${errors.email ? 'text-danger' : ''}`}></i>
                        <input 
                            type="email" 
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                            id="email" 
                            placeholder="nama@instansi.go.id" 
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
