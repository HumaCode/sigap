import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import LandingHeader from './Welcome/Partials/LandingHeader';
import BerandaSection from './Welcome/Partials/BerandaSection';
import PilarPengawasanSection from './Welcome/Partials/PilarPengawasanSection';
import StatusPublikSection from './Welcome/Partials/StatusPublikSection';
import MitigasiAiSection from './Welcome/Partials/MitigasiAiSection';
import PusatBantuanSection from './Welcome/Partials/PusatBantuanSection';

interface WelcomeProps extends PageProps {
    stats?: {
        total_sites: number;
        avg_uptime: number;
        active_incidents: number;
    };
    socTelemetry?: {
        defcon_level: string;
        defcon_status: string;
        defcon_type: 'primary' | 'secondary' | 'warning' | 'error';
        radar_blip_1: string;
        radar_blip_2: string;
        anomalies_count: number;
        critical_count: number;
        ssl_percentage: number;
        latest_scanned_domain: string;
    };
    publicServices?: Array<{
        id: string;
        name: string;
        url: string;
        status: string;
        status_label?: string;
        uptime?: string;
    }>;
    systemStatus?: {
        type: 'normal' | 'warning' | 'critical';
        text: string;
        dot_color: string;
        badge_color: string;
    };
}

export default function Welcome({ auth, stats, socTelemetry, publicServices, systemStatus }: WelcomeProps) {
    const user = auth?.user;
    const totalSites = stats?.total_sites || 48;
    const avgUptime = stats?.avg_uptime || 99.85;

    const [activeSection, setActiveSection] = useState<'beranda' | 'pilar' | 'status' | 'mitigasi' | 'kontak'>('beranda');

    // Auto-update active section indicator on scroll
    useEffect(() => {
        const handleScroll = () => {
            const sectionMap: Array<{ key: 'beranda' | 'pilar' | 'status' | 'mitigasi' | 'kontak'; id: string }> = [
                { key: 'kontak', id: 'pusat-bantuan' },
                { key: 'mitigasi', id: 'mitigasi-insiden-ai' },
                { key: 'status', id: 'transparansi-status' },
                { key: 'pilar', id: 'pilar-pengawasan' },
                { key: 'beranda', id: 'beranda' },
            ];

            const scrollPosition = window.scrollY + 140;

            for (const sec of sectionMap) {
                const el = document.getElementById(sec.id);
                if (el && el.offsetTop <= scrollPosition) {
                    setActiveSection(sec.key);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Head>
                <title>SIGAP - Sistem Informasi Pengawasan &amp; Tanggap Keamanan Siber Website &amp; Layanan Digital</title>
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="shortcut icon" href="/favicon.ico" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <style>{`
                    html {
                        scroll-behavior: smooth;
                        scroll-padding-top: 76px;
                    }
                    body {
                        background-color: #0a0f1d;
                        color: #e6edf7;
                        background-image: linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
                        background-size: 40px 40px;
                        font-family: 'Inter', sans-serif;
                    }
                    @keyframes radarSpin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-radar-sweep {
                        animation: radarSpin 5s linear infinite;
                    }
                    .radar-conic {
                        background: conic-gradient(from 0deg, rgba(79, 219, 200, 0.35) 0deg, rgba(79, 219, 200, 0) 70deg);
                    }
                    
                    /* EXACT SIGAP LANDING TOPBAR STYLES */
                    header.sigap-nav {
                        position: sticky;
                        top: 0;
                        z-index: 50;
                        padding: 10px 16px 0;
                        width: 100%;
                    }
                    .sigap-nav-inner {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 16px;
                        padding: 8px 12px 8px 16px;
                        border-radius: 18px;
                        background: rgba(10, 15, 29, 0.78);
                        border: 1px solid rgba(255, 255, 255, 0.10);
                        -webkit-backdrop-filter: blur(18px);
                        backdrop-filter: blur(18px);
                        box-shadow: 0 0 0 1px rgba(20, 184, 166, 0.04), 0 18px 50px -20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06);
                        width: 100%;
                        max-width: 1800px;
                        margin: 0 auto;
                    }
                    .sigap-brand {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        text-decoration: none;
                    }
                    .sigap-brand-logo {
                        width: 36px;
                        height: 36px;
                        flex: none;
                        filter: drop-shadow(0 0 12px rgba(20, 184, 166, 0.5));
                    }
                    .sigap-brand-text {
                        display: flex;
                        flex-direction: column;
                        line-height: 1.15;
                    }
                    .sigap-brand-name {
                        font-family: 'Poppins', 'Inter', system-ui, sans-serif;
                        font-weight: 700;
                        font-size: 17.5px;
                        letter-spacing: 0.06em;
                        color: #ffffff;
                    }
                    .sigap-brand-sub {
                        font-size: 10.5px;
                        color: #93a1b8;
                    }
                    nav.sigap-links {
                        display: flex;
                        gap: 4px;
                    }
                    nav.sigap-links a {
                        padding: 7px 12px;
                        font-size: 13.5px;
                        font-weight: 500;
                        color: #93a1b8;
                        border-radius: 10px;
                        transition: color 0.2s, background 0.2s;
                        text-decoration: none;
                    }
                    nav.sigap-links a:hover, nav.sigap-links a.active {
                        color: #ffffff;
                        background: rgba(255, 255, 255, 0.08);
                    }
                    .sigap-nav-right {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .sigap-btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        font-family: 'Poppins', 'Inter', system-ui, sans-serif;
                        font-weight: 600;
                        font-size: 13.5px;
                        padding: 8px 16px;
                        border-radius: 11px;
                        border: 1px solid transparent;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
                        white-space: nowrap;
                        text-decoration: none;
                    }
                    .sigap-btn-primary {
                        color: #031312;
                        background: linear-gradient(135deg, #14b8a6, #0ea5a3 55%, #38bdf8);
                        box-shadow: 0 10px 30px -8px rgba(20, 184, 166, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35);
                    }
                    .sigap-btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 16px 38px -8px rgba(20, 184, 166, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.4);
                    }
                    .sigap-burger {
                        display: none;
                        width: 38px;
                        height: 38px;
                        border-radius: 10px;
                        border: 1px solid rgba(255, 255, 255, 0.10);
                        background: rgba(255, 255, 255, 0.04);
                        color: #e6edf7;
                        cursor: pointer;
                        align-items: center;
                        justify-content: center;
                    }
                    .sigap-mobile-menu {
                        max-width: 1800px;
                        margin: 8px auto 0;
                        padding: 12px;
                        border-radius: 16px;
                        background: rgba(10, 15, 29, 0.94);
                        border: 1px solid rgba(255, 255, 255, 0.10);
                        -webkit-backdrop-filter: blur(18px);
                        backdrop-filter: blur(18px);
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                    }
                    @media (max-width: 960px) {
                        nav.sigap-links, .sigap-nav-right .sigap-btn {
                            display: none !important;
                        }
                        .sigap-burger {
                            display: inline-flex !important;
                        }
                    }
                `}</style>
            </Head>

            <div className="min-h-screen text-on-surface bg-background relative selection:bg-primary-container selection:text-on-primary-container">
                {/* FLOATING GLASS CAPSULE NAVBAR */}
                <LandingHeader
                    user={user}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                />

                <main className="w-full bg-transparent">
                    {/* Ambient Glow Auras */}
                    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-primary/15 via-secondary/10 to-transparent blur-[140px]"></div>
                        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary-container/10 rounded-full blur-[120px]"></div>
                        <div className="absolute top-2/3 -left-20 w-80 h-80 bg-tertiary-container/10 rounded-full blur-[120px]"></div>
                    </div>

                    <div className="flex flex-col w-full">
                        {/* TAB 1: BERANDA (#beranda) */}
                        <BerandaSection
                            user={user}
                            totalSites={totalSites}
                            avgUptime={avgUptime}
                            socTelemetry={socTelemetry}
                        />

                        {/* TAB 2: PILAR PENGAWASAN (#pilar-pengawasan) */}
                        <PilarPengawasanSection />

                        {/* TAB 3: STATUS PUBLIK (#transparansi-status) */}
                        <StatusPublikSection
                            initialServices={publicServices}
                            initialSystemStatus={systemStatus}
                            avgUptime={avgUptime}
                        />

                        {/* TAB 4: MITIGASI AI (#mitigasi-insiden-ai) */}
                        <MitigasiAiSection />

                        {/* TAB 5: PUSAT BANTUAN (#pusat-bantuan) */}
                        <PusatBantuanSection
                            user={user}
                        />
                    </div>
                </main>
            </div>
        </>
    );
}
