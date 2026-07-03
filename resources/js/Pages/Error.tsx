import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import '../../css/auth.css';

interface ErrorProps {
    status: number;
}

export default function ErrorPage({ status }: ErrorProps) {
    useEffect(() => {
        // Subtle parallax on blobs following cursor (desktop only)
        const handleMouseMove = (e: MouseEvent) => {
            if (window.matchMedia('(min-width: 992px)').matches) {
                const x = (e.clientX / window.innerWidth - 0.5) * 20;
                const y = (e.clientY / window.innerHeight - 0.5) * 20;
                document.querySelectorAll<HTMLElement>('.blob').forEach((el, i) => {
                    const factor = (i + 1) * 0.6;
                    el.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
                });
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const title = {
        503: '503 - Layanan Tidak Tersedia',
        500: '500 - Kesalahan Server Internal',
        404: '404 - Halaman Tidak Ditemukan',
        403: '403 - Akses Ditolak',
    }[status] || 'Kesalahan';

    const description = {
        503: 'Maaf, kami sedang melakukan pemeliharaan rutin. Silakan coba beberapa saat lagi.',
        500: 'Maaf, terjadi kesalahan internal pada server kami. Teknisi kami sedang menanganinya.',
        404: 'Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin URL-nya salah atau halaman tersebut sudah dipindahkan.',
        403: 'Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator jika Anda merasa ini adalah sebuah kesalahan.',
    }[status];

    const icon = {
        503: 'bi-cone-striped',
        500: 'bi-bug-fill',
        404: 'bi-compass',
        403: 'bi-shield-lock-fill',
    }[status] || 'bi-exclamation-triangle-fill';

    const iconColor = {
        503: 'var(--sun)',
        500: 'var(--coral)',
        404: 'var(--teal-1)',
        403: 'var(--coral)',
    }[status] || 'var(--ink)';

    return (
        <>
            <Head>
                <title>{title}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet" />
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
            </Head>

            <div className="sigap-auth-body">
                <div className="blob blob-a"></div>
                <div className="blob blob-b"></div>
                <div className="blob blob-c"></div>
                <div className="grid-texture"></div>

                <div className="float-icon fi-1"><i className="bi bi-shield-check"></i></div>
                <div className="float-icon fi-2"><i className="bi bi-broadcast"></i></div>
                <div className="float-icon fi-3"><i className="bi bi-globe2"></i></div>
                <div className="float-icon fi-4"><i className="bi bi-activity"></i></div>
                <div className="float-icon fi-5"><i className="bi bi-lock"></i></div>
                <div className="float-icon fi-6"><i className="bi bi-wifi"></i></div>
                <div className="float-icon fi-7"><i className="bi bi-bug"></i></div>
                <div className="float-icon fi-8"><i className="bi bi-clipboard-data"></i></div>

                <div className="login-wrap" style={{ maxWidth: '580px', margin: '0 auto' }}>
                    <div className="login-card p-5 text-center" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative background circle */}
                        <div style={{
                            position: 'absolute',
                            width: '200px',
                            height: '200px',
                            background: `radial-gradient(circle, ${iconColor}, transparent 70%)`,
                            opacity: '0.1',
                            top: '-50px',
                            right: '-50px',
                            borderRadius: '50%',
                            pointerEvents: 'none'
                        }}></div>

                        <div className="mb-4" style={{ 
                            width: '90px', 
                            height: '90px', 
                            borderRadius: '24px', 
                            background: `rgba(${status === 404 ? '14,165,163' : '255,122,110'}, 0.1)`, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '3.5rem', 
                            color: iconColor,
                            boxShadow: `0 10px 25px -5px rgba(${status === 404 ? '14,165,163' : '255,122,110'}, 0.2)`
                        }}>
                            <i className={`bi ${icon}`}></i>
                        </div>
                        
                        <h1 style={{ 
                            fontWeight: 800, 
                            fontSize: '3.5rem', 
                            color: 'var(--ink)', 
                            letterSpacing: '-2px', 
                            marginBottom: '0.2rem',
                            lineHeight: 1
                        }}>
                            {status}
                        </h1>
                        <h2 style={{ 
                            fontWeight: 700, 
                            fontSize: '1.4rem', 
                            color: 'var(--ink)',
                            marginBottom: '1rem' 
                        }}>
                            {title.split(' - ')[1] || title}
                        </h2>
                        <p style={{ 
                            color: 'var(--ink-soft)', 
                            fontSize: '0.95rem', 
                            lineHeight: '1.6',
                            maxWidth: '400px'
                        }}>
                            {description}
                        </p>

                        <div className="mt-4 pt-2">
                            <Link href="/" className="btn btn-login px-4 py-2" style={{ borderRadius: '12px' }}>
                                <i className="bi bi-house-door me-2"></i> Kembali ke Beranda
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
