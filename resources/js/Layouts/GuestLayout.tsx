import { useEffect, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import '../../css/auth.css';

interface TelemetryData {
    total_sites: number;
    active_sites: number;
    avg_uptime: string;
    ai_sentinel: string;
}

export default function Guest({ children }: PropsWithChildren) {
    const cardRef = useRef<HTMLDivElement>(null);
    const { props } = usePage();
    const telemetry = (props.telemetry as TelemetryData) || {
        total_sites: 0,
        active_sites: 0,
        avg_uptime: '99.9%',
        ai_sentinel: '24/7',
    };

    useEffect(() => {
        // Interactive 3D tilt & parallax on desktop
        const handleMouseMove = (e: MouseEvent) => {
            if (window.matchMedia('(min-width: 992px)').matches) {
                const x = (e.clientX / window.innerWidth - 0.5) * 24;
                const y = (e.clientY / window.innerHeight - 0.5) * 24;

                // Parallax on blobs
                document.querySelectorAll<HTMLElement>('.blob').forEach((el, i) => {
                    const factor = (i + 1) * 0.7;
                    el.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
                });

                // Subtle dynamic tilt on the main card
                if (cardRef.current) {
                    const rect = cardRef.current.getBoundingClientRect();
                    const cardX = e.clientX - rect.left - rect.width / 2;
                    const cardY = e.clientY - rect.top - rect.height / 2;
                    const tiltX = (cardY / (rect.height / 2)) * -2.5;
                    const tiltY = (cardX / (rect.width / 2)) * 2.5;
                    cardRef.current.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
                }
            }
        };

        const handleMouseLeave = () => {
            if (cardRef.current) {
                cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const sitesCount = telemetry.active_sites || telemetry.total_sites || 0;

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
                {/* Background Ambient Mesh Blobs */}
                <div className="blob blob-a"></div>
                <div className="blob blob-b"></div>
                <div className="blob blob-c"></div>
                <div className="grid-texture"></div>

                {/* Floating Interactive Security Icons */}
                <div className="float-icon fi-1"><i className="bi bi-shield-check"></i></div>
                <div className="float-icon fi-2"><i className="bi bi-cpu"></i></div>
                <div className="float-icon fi-3"><i className="bi bi-globe2"></i></div>
                <div className="float-icon fi-4"><i className="bi bi-activity"></i></div>
                <div className="float-icon fi-5"><i className="bi bi-lock-fill"></i></div>
                <div className="float-icon fi-6"><i className="bi bi-wifi"></i></div>

                <div className="login-wrap">
                    <div className="login-card" ref={cardRef}>
                        <div className="row g-0">
                            {/* Left Brand & Cyber SOC Operations Panel */}
                            <div className="col-lg-5 brand-panel">
                                <div>
                                    {/* Animated Radar Badge */}
                                    <div className="radar-badge-wrap">
                                        <div className="radar-ring"></div>
                                        <div className="radar-ping"></div>
                                        <div className="brand-badge">
                                            <i className="bi bi-shield-lock-fill"></i>
                                        </div>
                                    </div>

                                    <div className="brand-tagline">
                                        <i className="bi bi-patch-check-fill"></i>
                                        <span>Cyber Defense Platform</span>
                                    </div>

                                    <h1>SIGAP Web</h1>
                                    <p>
                                        Sistem Informasi Gawat &amp; Antisipasi Pengamanan Website — pantau status, keamanan, dan integritas situs serta aset digital secara real-time.
                                    </p>

                                    {/* Interactive Cyber Feature Cards */}
                                    <div className="feature-list">
                                        <div className="feature-card">
                                            <i className="bi bi-radar"></i>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Sensor Uptime 60 Detik</div>
                                                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Pengecekan HTTP &amp; masa aktif SSL konsisten</div>
                                            </div>
                                        </div>
                                        <div className="feature-card">
                                            <i className="bi bi-shield-slash"></i>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>AI Defacement Guard</div>
                                                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Deteksi dini injeksi konten &amp; backlink ilegal</div>
                                            </div>
                                        </div>
                                        <div className="feature-card">
                                            <i className="bi bi-bell"></i>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Notifikasi Multikanal</div>
                                                <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>Eskalasi instan via Telegram &amp; WhatsApp ke PIC</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {/* Telemetry Mini Stats Bar */}
                                    <div className="telemetry-grid">
                                        <div className="telemetry-item">
                                            <div className="telemetry-val">{sitesCount > 0 ? `${sitesCount}+` : '0'}</div>
                                            <div className="telemetry-lbl">Situs Aktif</div>
                                        </div>
                                        <div className="telemetry-item">
                                            <div className="telemetry-val">{telemetry.avg_uptime || '99.9%'}</div>
                                            <div className="telemetry-lbl">Avg Uptime</div>
                                        </div>
                                        <div className="telemetry-item">
                                            <div className="telemetry-val">{telemetry.ai_sentinel || '24/7'}</div>
                                            <div className="telemetry-lbl">AI Sentinel</div>
                                        </div>
                                    </div>

                                    {/* Status Capsule Indicator */}
                                    <div className="mt-3">
                                        <div className="status-pill">
                                            <span className="status-dot"></span>
                                            <span>{sitesCount > 0 ? `${sitesCount} Situs Terpantau Aktif` : 'Sistem Operasional & Terlindungi'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Form Panel */}
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
