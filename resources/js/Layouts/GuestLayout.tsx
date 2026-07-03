import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import '../../css/auth.css';

export default function Guest({ children }: PropsWithChildren) {
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

    return (
        <>
            <Head>
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

                {/* Floating icons */}
                <div className="float-icon fi-1"><i className="bi bi-shield-check"></i></div>
                <div className="float-icon fi-2"><i className="bi bi-broadcast"></i></div>
                <div className="float-icon fi-3"><i className="bi bi-globe2"></i></div>
                <div className="float-icon fi-4"><i className="bi bi-activity"></i></div>
                <div className="float-icon fi-5"><i className="bi bi-lock"></i></div>
                <div className="float-icon fi-6"><i className="bi bi-wifi"></i></div>
                <div className="float-icon fi-7"><i className="bi bi-bug"></i></div>
                <div className="float-icon fi-8"><i className="bi bi-clipboard-data"></i></div>

                <div className="login-wrap">
                    <div className="login-card">
                        <div className="row g-0">
                            {/* Brand / info panel */}
                            <div className="col-lg-5 brand-panel">
                                <div>
                                    <div className="brand-badge"><i className="bi bi-shield-lock-fill"></i></div>
                                    <h1>SIGAP Web</h1>
                                    <p>Sistem Informasi Gawat &amp; Antisipasi Pengamanan Website — pantau status, keamanan, dan integritas konten situs instansi secara real-time.</p>

                                    <ul className="feature-list">
                                        <li><i className="bi bi-clock-history"></i> Monitoring uptime tiap menit</li>
                                        <li><i className="bi bi-exclamation-triangle"></i> Deteksi sisipan konten mencurigakan</li>
                                        <li><i className="bi bi-bell"></i> Notifikasi real-time ke PIC</li>
                                    </ul>
                                </div>

                                <div className="status-pill">
                                    <span className="status-dot"></span>
                                    <span>128 situs terpantau aktif</span>
                                </div>
                            </div>

                            {/* Form panel */}
                            <div className="col-lg-7 form-panel">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
