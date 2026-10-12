import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';

interface WelcomeProps extends PageProps {
    stats?: {
        total_sites: number;
        avg_uptime: number;
        active_incidents: number;
    };
    publicServices?: Array<{
        id: string;
        name: string;
        url: string;
        status: string;
        uptime?: number;
    }>;
}

export default function Welcome({ auth, stats, publicServices }: WelcomeProps) {
    const user = auth?.user;
    const totalSites = stats?.total_sites || 48;
    const avgUptime = stats?.avg_uptime || 99.85;

    // Interactive scenario state for the AI Remediation simulation terminal
    const [simScenario, setSimScenario] = useState<'defacement' | 'downtime'>('defacement');

    const toggleScenario = () => {
        setSimScenario((prev) => (prev === 'defacement' ? 'downtime' : 'defacement'));
    };

    const defaultServices = [
        { name: 'Portal Utama Pemda', url: 'pemda.go.id', uptime: '99.98%', status: 'Aktif Normal' },
        { name: 'E-Katalog Daerah (LPSE)', url: 'lpse.pemda.go.id', uptime: '99.89%', status: 'Aktif Normal' },
        { name: 'Layanan Kependudukan (Disdukcapil)', url: 'dukcapil.pemda.go.id', uptime: '100.0%', status: 'Aktif Normal' },
        { name: 'Portal Keterbukaan PPID', url: 'ppid.pemda.go.id', uptime: '99.78%', status: 'Aktif Normal' },
    ];

    const displayServices = publicServices && publicServices.length > 0
        ? publicServices.map((s) => ({
              name: s.name,
              url: s.url ? s.url.replace(/^https?:\/\//, '') : 'situs.go.id',
              uptime: `${s.uptime ?? 99.9}%`,
              status: s.status === 'down' ? 'Perlu Atensi' : 'Aktif Normal',
          }))
        : defaultServices;

    return (
        <>
            <Head>
                <title>SIGAP - Sistem Informasi Pengawasan & Tanggap Keamanan Siber Situs Instansi Pemerintah</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <style>{`
                    body {
                        background-color: #0b1326;
                        color: #dae2fd;
                        background-image: linear-gradient(to right, rgba(14, 165, 163, 0.04) 1px, transparent 1px),
                                          linear-gradient(to bottom, rgba(14, 165, 163, 0.04) 1px, transparent 1px);
                        background-size: 32px 32px;
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
                `}</style>
            </Head>

            <div className="min-h-screen text-on-surface bg-background relative selection:bg-primary-container selection:text-on-primary-container">
                {/* HEADER / NAVIGATION BAR */}
                <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#060e20]/80 backdrop-blur-xl border-b border-[#222a3d]/60 shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
                    <div className="h-20 w-full max-w-[1800px] mx-auto px-6 sm:px-8 flex items-center justify-between">
                        {/* Logo & Brand Identity */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-surface-tint flex items-center justify-center text-on-primary shadow-[0_0_16px_rgba(20,184,166,0.4)]">
                                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    shield_lock
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-xl tracking-wider text-primary leading-none font-['Plus_Jakarta_Sans']">
                                    SIGAP
                                </span>
                                <span className="text-[10px] text-on-surface-variant font-['JetBrains_Mono'] uppercase tracking-widest mt-1">
                                    Monitoring Situs Instansi
                                </span>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium">
                            <a href="#" className="text-primary font-semibold transition-colors">
                                Beranda
                            </a>
                            <a href="#pilar-pengawasan" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                Pilar Pengawasan
                            </a>
                            <a href="#transparansi-status" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                Status Layanan Publik
                            </a>
                            <a href="#mitigasi-insiden-ai" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                Mitigasi Insiden AI
                            </a>
                            <a href="#kontak-csirt" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                Kontak CSIRT
                            </a>
                        </nav>

                        {/* Action CTA */}
                        <div className="flex items-center gap-3">
                            {user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-container to-surface-tint text-on-primary text-xs font-semibold tracking-wide shadow-[0_0_16px_rgba(20,184,166,0.35)] hover:shadow-[0_0_24px_rgba(20,184,166,0.55)] transition-all font-['Plus_Jakarta_Sans']"
                                >
                                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                                    <span>Buka Dashboard</span>
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-container to-surface-tint text-on-primary text-xs font-semibold tracking-wide shadow-[0_0_16px_rgba(20,184,166,0.35)] hover:shadow-[0_0_24px_rgba(20,184,166,0.55)] transition-all font-['Plus_Jakarta_Sans']"
                                >
                                    <span className="material-symbols-outlined text-[18px]">login</span>
                                    <span>Masuk ke Portal</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                <main className="w-full pt-20 bg-transparent min-h-screen">
                    <div className="flex flex-col w-full">
                        {/* Top Ambient Glow Aura */}
                        <div className="relative w-full overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-primary/15 via-secondary/10 to-transparent blur-[140px] pointer-events-none -z-10"></div>
                            <div className="absolute -top-32 right-10 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
                            <div className="absolute top-48 -left-20 w-80 h-80 bg-tertiary-container/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

                            {/* SECTION 1: HERO VIEWPORT */}
                            <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 pt-8 pb-20 lg:pt-14 lg:pb-28">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                                    {/* Left Hero Content (7 Cols) */}
                                    <div className="lg:col-span-7 flex flex-col items-start space-y-6">
                                        {/* Live Telemetry Pill Badge */}
                                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-xl border border-surface-container-highest shadow-sm">
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                            </span>
                                            <span className="text-[11px] font-['JetBrains_Mono'] text-primary uppercase tracking-widest font-semibold">
                                                SISTEM PEMANTAUAN REALTIME AKTIF
                                            </span>
                                            <span className="text-on-surface-variant text-[11px] font-['JetBrains_Mono'] hidden sm:inline">
                                                • 24/7 Pengawasan Siber Pemda
                                            </span>
                                        </div>

                                        {/* Hero Headline */}
                                        <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.15] text-on-surface font-['Plus_Jakarta_Sans']">
                                            Pengawasan Ketersediaan &{' '}
                                            <span className="bg-gradient-to-r from-primary via-primary-fixed to-secondary bg-clip-text text-transparent">
                                                Ketahanan Siber
                                            </span>{' '}
                                            Situs Instansi Pemerintah
                                        </h1>

                                        {/* Hero Subheadline */}
                                        <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                                            Solusi otomatisasi pemantauan uptime 24/7, pencegahan defacement, pendeteksi dini konten ilegal (judi online & obat terlarang), serta respon insiden berbasis AI terintegrasi untuk kedaulatan portal publik.
                                        </p>

                                        {/* Dual CTA Buttons */}
                                        <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
                                            <Link
                                                href={user ? route('dashboard') : route('login')}
                                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-container via-surface-tint to-primary text-on-primary font-bold text-sm shadow-[0_0_24px_rgba(20,184,166,0.4)] hover:shadow-[0_0_36px_rgba(20,184,166,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all font-['Plus_Jakarta_Sans']"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {user ? 'dashboard' : 'login'}
                                                </span>
                                                <span>{user ? 'Buka Dashboard Sistem' : 'Akses Portal SIGAP'}</span>
                                            </Link>
                                            <a
                                                href="#transparansi-status"
                                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-surface-container-high/70 hover:bg-surface-container-highest text-secondary text-sm font-semibold border border-surface-container-highest backdrop-blur-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all font-['Plus_Jakarta_Sans']"
                                            >
                                                <span className="material-symbols-outlined text-[20px] text-primary">radar</span>
                                                <span>Pantau Status Terkini</span>
                                            </a>
                                        </div>

                                        {/* Quick Micro-Badges */}
                                        <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-on-surface-variant font-['JetBrains_Mono']">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                                                <span>Standar BSSN SPBE Grade A</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
                                                <span>TLS 1.3 Strict Inspection</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-surface-tint text-[18px]">bolt</span>
                                                <span>Deteksi Kilat &lt;3 Detik</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Hero Interactive Showcase / HUD Matrix (5 Cols) */}
                                    <div className="lg:col-span-5 relative w-full flex flex-col items-center">
                                        <div className="w-full relative rounded-2xl bg-surface-container-low/85 backdrop-blur-2xl border border-surface-container-highest/80 p-6 shadow-2xl overflow-hidden">
                                            {/* Top HUD Classification Bar */}
                                            <div className="flex items-center justify-between pb-4 mb-5 border-b border-surface-container-highest">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                                                    <span className="text-[11px] font-['JetBrains_Mono'] text-on-surface tracking-wider font-semibold">
                                                        SIGAP SOC CONSOLE // NODE-ID: JK-01
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-['JetBrains_Mono'] text-secondary bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
                                                    DEFCON 5 • NOMINAL
                                                </span>
                                            </div>

                                            {/* Central Radar Pulse Engine & Live Telemetry Topology */}
                                            <div className="relative w-full h-72 flex items-center justify-center rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest/60 overflow-hidden">
                                                {/* Polar Radar Background Rings */}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-64 h-64 rounded-full border border-primary/20"></div>
                                                    <div className="w-48 h-48 rounded-full border border-primary/25"></div>
                                                    <div className="w-32 h-32 rounded-full border border-primary/30"></div>
                                                    <div className="w-16 h-16 rounded-full border border-primary/40 bg-primary/5"></div>
                                                    {/* Crosshairs */}
                                                    <div className="absolute w-full h-[1px] bg-primary/20"></div>
                                                    <div className="absolute h-full w-[1px] bg-primary/20"></div>
                                                </div>

                                                {/* Sweeping Radar Beam */}
                                                <div className="absolute w-64 h-64 rounded-full pointer-events-none animate-radar-sweep radar-conic"></div>

                                                {/* Center Shield Emissive Centerpiece */}
                                                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-container via-surface-container-high to-surface-container flex items-center justify-center shadow-[0_0_28px_rgba(20,184,166,0.6)] border border-primary/40">
                                                    <span className="material-symbols-outlined text-on-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                        security
                                                    </span>
                                                </div>

                                                {/* Intercept Target Blips on Radar */}
                                                <div className="absolute top-12 left-12 flex items-center gap-1.5 z-10">
                                                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                                                    <span className="text-[10px] font-['JetBrains_Mono'] text-secondary bg-surface-container-high/90 px-1.5 py-0.5 rounded border border-surface-container-highest">
                                                        diskominfo.go.id (22ms)
                                                    </span>
                                                </div>
                                                <div className="absolute bottom-12 right-10 flex items-center gap-1.5 z-10">
                                                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                                                    <span className="text-[10px] font-['JetBrains_Mono'] text-primary bg-surface-container-high/90 px-1.5 py-0.5 rounded border border-surface-container-highest">
                                                        bappeda.go.id (31ms)
                                                    </span>
                                                </div>
                                                <div className="absolute top-14 right-12 flex items-center gap-1.5 z-10">
                                                    <span className="w-2 h-2 rounded-full bg-surface-tint"></span>
                                                    <span className="text-[10px] font-['JetBrains_Mono'] text-on-surface-variant bg-surface-container-high/90 px-1.5 py-0.5 rounded border border-surface-container-highest">
                                                        dinkes.go.id (19ms)
                                                    </span>
                                                </div>

                                                {/* Bottom telemetry ticker inside radar */}
                                                <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-on-surface-variant text-[10px] font-['JetBrains_Mono']">
                                                    <span>BEAM: 360° SWEEP</span>
                                                    <span className="text-primary font-semibold">0 ANOMALY DETECTED</span>
                                                </div>
                                            </div>

                                            {/* Floating Metric Overlay Cards */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                                                <div className="p-3 rounded-xl bg-surface-container/90 border border-surface-container-highest backdrop-blur-md shadow-md flex flex-col justify-between">
                                                    <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-on-surface-variant">
                                                        <span>Ketersediaan</span>
                                                        <span className="material-symbols-outlined text-primary text-[16px]">speed</span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <div className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-on-surface">{avgUptime}%</div>
                                                        <div className="text-[10px] font-['JetBrains_Mono'] text-primary flex items-center gap-1 mt-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                            28ms normal
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-3 rounded-xl bg-surface-container/90 border border-surface-container-highest backdrop-blur-md shadow-md flex flex-col justify-between">
                                                    <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-on-surface-variant">
                                                        <span>Sertifikat SSL</span>
                                                        <span className="material-symbols-outlined text-secondary text-[16px]">lock_clock</span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <div className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-on-surface">100% Valid</div>
                                                        <div className="text-[10px] font-['JetBrains_Mono'] text-secondary flex items-center gap-1 mt-0.5">
                                                            Grade A+ BSSN
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-3 rounded-xl bg-surface-container/90 border border-surface-container-highest backdrop-blur-md shadow-md flex flex-col justify-between">
                                                    <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-on-surface-variant">
                                                        <span>AI Engine</span>
                                                        <span className="material-symbols-outlined text-surface-tint text-[16px]">memory</span>
                                                    </div>
                                                    <div className="mt-2">
                                                        <div className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-on-surface">Aktif Siaga</div>
                                                        <div className="text-[10px] font-['JetBrains_Mono'] text-surface-tint flex items-center gap-1 mt-0.5">
                                                            0 Insiden Kritis
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Terminal Stream Raw Log Bar */}
                                            <div className="mt-4 p-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest/60 text-[11px] font-['JetBrains_Mono'] text-on-surface-variant flex items-center justify-between overflow-hidden">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="text-primary font-bold">[SYS_STREAM]</span>
                                                    <span className="truncate">Automated deep crawl scan for opd-portal.go.id completed (Clean).</span>
                                                </div>
                                                <span className="text-secondary shrink-0 font-semibold">TICK: 0.12s</span>
                                            </div>
                                        </div>

                                        <div className="absolute -bottom-6 w-3/4 h-12 bg-primary/20 blur-2xl -z-10 rounded-full"></div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* SECTION 2: LIVE TRUST & PERFORMANCE METRICS BAR */}
                        <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 py-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Metric 1 */}
                                <div className="p-6 rounded-2xl bg-surface-container/70 border border-surface-container-highest/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:bg-surface-container-high transition-all">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-[28px]">domain_verification</span>
                                        </div>
                                        <span className="text-[10px] font-['JetBrains_Mono'] text-primary uppercase font-semibold tracking-wider">LIVE TELEMETRY</span>
                                    </div>
                                    <div className="mt-6">
                                        <div className="text-4xl font-extrabold text-on-surface tracking-tight leading-none font-['Plus_Jakarta_Sans']">
                                            {totalSites}<span className="text-primary">+</span>
                                        </div>
                                        <div className="text-base font-semibold text-on-surface font-['Plus_Jakarta_Sans'] mt-2">
                                            Situs Resmi Terpantau
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                                            Seluruh portal OPD, dinas vertikal, badan, & kecamatan aktif diawasi secara terpusat.
                                        </p>
                                    </div>
                                </div>

                                {/* Metric 2 */}
                                <div className="p-6 rounded-2xl bg-surface-container/70 border border-surface-container-highest/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:bg-surface-container-high transition-all">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                            <span className="material-symbols-outlined text-[28px]">network_check</span>
                                        </div>
                                        <span className="text-[10px] font-['JetBrains_Mono'] text-secondary uppercase font-semibold tracking-wider">RELIABILITAS</span>
                                    </div>
                                    <div className="mt-6">
                                        <div className="text-4xl font-extrabold text-on-surface tracking-tight leading-none font-['Plus_Jakarta_Sans']">
                                            {avgUptime}<span className="text-secondary">%</span>
                                        </div>
                                        <div className="text-base font-semibold text-on-surface font-['Plus_Jakarta_Sans'] mt-2">
                                            SLA Ketersediaan Layanan
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                                            Rata-rata uptime reliabilitas ketersediaan sistem informasi publik tingkat pemerintah daerah.
                                        </p>
                                    </div>
                                </div>

                                {/* Metric 3 */}
                                <div className="p-6 rounded-2xl bg-surface-container/70 border border-surface-container-highest/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:bg-surface-container-high transition-all">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-surface-tint to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-surface-tint/10 flex items-center justify-center text-surface-tint">
                                            <span className="material-symbols-outlined text-[28px]">alarm_on</span>
                                        </div>
                                        <span className="text-[10px] font-['JetBrains_Mono'] text-surface-tint uppercase font-semibold tracking-wider">LATENSI ALARM</span>
                                    </div>
                                    <div className="mt-6">
                                        <div className="text-4xl font-extrabold text-on-surface tracking-tight leading-none font-['Plus_Jakarta_Sans']">
                                            &lt; 3<span className="text-surface-tint">s</span>
                                        </div>
                                        <div className="text-base font-semibold text-on-surface font-['Plus_Jakarta_Sans'] mt-2">
                                            Deteksi Anomali Cepat
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                                            Interval respon alarm darurat terverifikasi seketika terjadi lonjakan galat atau modifikasi file.
                                        </p>
                                    </div>
                                </div>

                                {/* Metric 4 */}
                                <div className="p-6 rounded-2xl bg-surface-container/70 border border-surface-container-highest/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:bg-surface-container-high transition-all">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-tertiary to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                                            <span className="material-symbols-outlined text-[28px]">psychology</span>
                                        </div>
                                        <span className="text-[10px] font-['JetBrains_Mono'] text-tertiary uppercase font-semibold tracking-wider">AUTONOMOUS</span>
                                    </div>
                                    <div className="mt-6">
                                        <div className="text-4xl font-extrabold text-on-surface tracking-tight leading-none font-['Plus_Jakarta_Sans']">
                                            24/7<span className="text-tertiary font-normal text-xl"> AI</span>
                                        </div>
                                        <div className="text-base font-semibold text-on-surface font-['Plus_Jakarta_Sans'] mt-2">
                                            Inspeksi Kecerdasan Siber
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                                            Pemindaian semantik tanpa henti mencegah penyusupan konten ilegal & injeksi berbahaya.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 3: 4 PILAR KEUNGGULAN SIGAP */}
                        <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 py-20" id="pilar-pengawasan">
                            <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container text-primary text-xs font-['JetBrains_Mono'] uppercase tracking-widest font-semibold mb-4 border border-surface-container-highest">
                                    ARSITEKTUR PERTAHANAN BERLAPIS
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                                    4 Pilar Pengawasan Siber Komprehensif
                                </h2>
                                <p className="text-base text-on-surface-variant mt-4 leading-relaxed">
                                    Dirancang khusus untuk menjaga integritas, reputasi, dan ketersediaan layanan publik pemerintah daerah dari ancaman peretasan modern.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Pillar 1 */}
                                <div className="p-8 rounded-2xl bg-surface-container/80 border border-surface-container-highest backdrop-blur-xl shadow-xl relative overflow-hidden group hover:bg-surface-container-high transition-all flex flex-col justify-between">
                                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-surface-container-highest flex items-center justify-center text-primary shadow-inner border border-primary/20">
                                                <span className="material-symbols-outlined text-[32px]">wifi_tethering</span>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-['JetBrains_Mono'] font-semibold uppercase border border-primary/20">
                                                Auto Ping 30s
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                                            Pemantauan Ketersediaan (Uptime & SSL)
                                        </h3>
                                        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                                            Pengecekan HTTP/HTTPS multi-node berkala, pengawasan latensi respons server, serta peringatan dini kedaluwarsa sertifikat SSL/TLS sebelum downtime merugikan masyarakat.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">verified</span>
                                            <div className="text-left">
                                                <div className="text-xs font-semibold text-on-surface font-['JetBrains_Mono']">SSL Handshake Check</div>
                                                <div className="text-[11px] text-on-surface-variant font-['JetBrains_Mono']">Auto Renewal Reminder H-30</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-primary font-bold font-['JetBrains_Mono']">ACTIVE PROTOCOL</span>
                                    </div>
                                </div>

                                {/* Pillar 2 */}
                                <div className="p-8 rounded-2xl bg-surface-container/80 border border-surface-container-highest backdrop-blur-xl shadow-xl relative overflow-hidden group hover:bg-surface-container-high transition-all flex flex-col justify-between">
                                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-error/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-error/20 to-surface-container-highest flex items-center justify-center text-error shadow-inner border border-error/20">
                                                <span className="material-symbols-outlined text-[32px]">shield_lock</span>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-error/15 text-error text-xs font-['JetBrains_Mono'] font-semibold uppercase border border-error/20">
                                                Deep Crawler
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                                            Scanner Konten Ilegal & Defacement
                                        </h3>
                                        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                                            Algoritma pendeteksi sisipan webshell backdoor, script defacement visual, serta injeksi kata kunci terlarang (promosi judi online slot/gacor, situs obat aborsi, konten pornografi).
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-error">policy</span>
                                            <div className="text-left">
                                                <div className="text-xs font-semibold text-on-surface font-['JetBrains_Mono']">Kamus Kata Kunci BSSN & Kominfo</div>
                                                <div className="text-[11px] text-on-surface-variant font-['JetBrains_Mono']">15,000+ Regex Pattern Sinkron</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-error font-bold font-['JetBrains_Mono']">ZERO TOLERANCE</span>
                                    </div>
                                </div>

                                {/* Pillar 3 */}
                                <div className="p-8 rounded-2xl bg-surface-container/80 border border-surface-container-highest backdrop-blur-xl shadow-xl relative overflow-hidden group hover:bg-surface-container-high transition-all flex flex-col justify-between">
                                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-surface-container-highest flex items-center justify-center text-secondary shadow-inner border border-secondary/20">
                                                <span className="material-symbols-outlined text-[32px]">smart_toy</span>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-['JetBrains_Mono'] font-semibold uppercase border border-secondary/20">
                                                AI Engine
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                                            Asisten Remediasi Insiden Berbasis AI
                                        </h3>
                                        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                                            Analisis akar masalah otomatis (root-cause analysis), penilaian tingkat keparahan insiden berbasis CVSS, serta rekomendasi langkah teknis instan untuk tim CSIRT dinas.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-secondary">terminal</span>
                                            <div className="text-left">
                                                <div className="text-xs font-semibold text-on-surface font-['JetBrains_Mono']">Saran Script Mitigasi WAF / Nginx</div>
                                                <div className="text-[11px] text-on-surface-variant font-['JetBrains_Mono']">Panduan Eksekusi Seketika</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-secondary font-bold font-['JetBrains_Mono']">READY TO DEPLOY</span>
                                    </div>
                                </div>

                                {/* Pillar 4 */}
                                <div className="p-8 rounded-2xl bg-surface-container/80 border border-surface-container-highest backdrop-blur-xl shadow-xl relative overflow-hidden group hover:bg-surface-container-high transition-all flex flex-col justify-between">
                                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-tertiary/20 to-surface-container-highest flex items-center justify-center text-tertiary shadow-inner border border-tertiary/20">
                                                <span className="material-symbols-outlined text-[32px]">campaign</span>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-tertiary/15 text-tertiary text-xs font-['JetBrains_Mono'] font-semibold uppercase border border-tertiary/20">
                                                Multi-Channel
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                                            Pusat Notifikasi & Alarm Terpadu
                                        </h3>
                                        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                                            Pengiriman alarm darurat otomatis melalui multi-kanal: dashboard sentral Diskominfo, Webhook Telegram Siaga 24 jam, SMS Gateway, dan surel resmi pimpinan OPD terkait.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-tertiary">send</span>
                                            <div className="text-left">
                                                <div className="text-xs font-semibold text-on-surface font-['JetBrains_Mono']">Telegram Bot Dispatcher</div>
                                                <div className="text-[11px] text-on-surface-variant font-['JetBrains_Mono']">Integrasi CSIRT Response Team</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-tertiary font-bold font-['JetBrains_Mono']">REAL-TIME PUSH</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 4: PUBLIC TRANSPARENCY STATUS SHOWCASE */}
                        <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 py-16" id="transparansi-status">
                            <div className="rounded-3xl bg-surface-container/70 border border-surface-container-highest/80 backdrop-blur-2xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-surface-container-highest">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container-high text-primary text-xs font-['JetBrains_Mono'] uppercase font-semibold mb-3 border border-surface-container-highest">
                                            TRANSPARANSI KETERSEDIAAN PUBLIK
                                        </div>
                                        <h2 className="text-2xl sm:text-4xl font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                                            Status Operasional Layanan Digital Daerah
                                        </h2>
                                        <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
                                            Masyarakat dan aparatur pemerintah dapat memantau kesehatan situs publik secara terbuka tanpa mengekspos celah kerentanan teknis.
                                        </p>
                                    </div>

                                    <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-primary/10 border border-primary/30 backdrop-blur-xl shadow-[0_0_24px_rgba(20,184,166,0.2)]">
                                        <span className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse"></span>
                                        <span className="text-base font-bold text-primary font-['Plus_Jakarta_Sans']">
                                            Seluruh Sistem Beroperasi Normal
                                        </span>
                                    </div>
                                </div>

                                {/* 7-Day Sparkline Timeline Visualization */}
                                <div className="py-8">
                                    <div className="flex items-center justify-between mb-3 text-xs font-['JetBrains_Mono']">
                                        <span className="text-on-surface-variant font-semibold uppercase">Uptime Tren 7 Hari Terakhir</span>
                                        <span className="text-primary font-semibold">99.91% Rata-rata Mingguan</span>
                                    </div>

                                    <div className="grid grid-cols-12 sm:grid-cols-24 md:grid-cols-48 gap-1.5 h-10 w-full items-end p-2 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest">
                                        {Array.from({ length: 48 }).map((_, idx) => {
                                            const isMaintenance = idx === 14;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`rounded-sm transition-colors ${
                                                        isMaintenance
                                                            ? 'h-6 bg-secondary/80 hover:bg-secondary'
                                                            : 'h-8 bg-primary/80 hover:bg-primary'
                                                    }`}
                                                    title={`Slot #${idx + 1}: ${isMaintenance ? '99.2% Pemeliharaan Rutin' : '100% Normal'}`}
                                                ></div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between text-on-surface-variant text-[11px] font-['JetBrains_Mono'] mt-2">
                                        <span>7 Hari Lalu</span>
                                        <span className="text-primary font-semibold">100% Bebas Defacement</span>
                                        <span>Hari Ini</span>
                                    </div>
                                </div>

                                {/* Table / List of Public Government Services */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                    {displayServices.map((service, index) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-xl bg-surface-container-high/60 border border-surface-container-highest backdrop-blur-md flex flex-col justify-between"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="text-sm font-bold text-on-surface font-['Plus_Jakarta_Sans'] truncate max-w-[200px]">
                                                        {service.name}
                                                    </div>
                                                    <div className="text-xs text-on-surface-variant font-['JetBrains_Mono'] mt-0.5 truncate max-w-[200px]">
                                                        {service.url}
                                                    </div>
                                                </div>
                                                <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0"></span>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-surface-container-highest flex items-center justify-between text-xs font-['JetBrains_Mono']">
                                                <span className="text-on-surface-variant">Uptime {service.uptime}</span>
                                                <span className="text-primary font-semibold">{service.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-surface-container-highest">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">policy</span>
                                        <span className="text-xs text-on-surface-variant">
                                            Dipantau sesuai Pedoman Tata Kelola Keamanan Siber BSSN No. 8/2020 & Indeks SPBE Nasional.
                                        </span>
                                    </div>
                                    <a
                                        href="#pilar-pengawasan"
                                        className="text-xs font-['JetBrains_Mono'] text-primary hover:underline flex items-center gap-1 shrink-0"
                                    >
                                        <span>Lihat Dokumen Akreditasi</span>
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </a>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 5: INTERACTIVE AI INCIDENT SIMULATION & MITIGATION FLOW */}
                        <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 py-16" id="mitigasi-insiden-ai">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                                {/* Left Explanation (5 Cols) */}
                                <div className="lg:col-span-5 flex flex-col space-y-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary/10 border border-secondary/30 text-secondary text-xs font-['JetBrains_Mono'] uppercase font-semibold w-fit">
                                        ORCHESTRATED REMEDIATION
                                    </div>
                                    <h2 className="text-2xl sm:text-4xl font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                                        Bagaimana AI SIGAP Menghentikan Peretasan dalam Hitungan Detik
                                    </h2>
                                    <p className="text-sm text-on-surface-variant leading-relaxed">
                                        Ketika terjadi serangan defacement atau injeksi tautan promosi ilegal pada sub-domain OPD, mesin deteksi otonom SIGAP mengeksekusi mitigasi otomatis tanpa perlu menunggu intervensi manual berjam-jam.
                                    </p>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-surface-container-highest flex items-center justify-center text-primary font-bold shrink-0 mt-0.5 text-xs font-['JetBrains_Mono']">
                                                1
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                                                    Inspeksi Payload & DOM Tree
                                                </div>
                                                <p className="text-xs text-on-surface-variant mt-0.5">
                                                    Membandingkan snapshot situs dengan hash basis data integritas berkala.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-surface-container-highest flex items-center justify-center text-secondary font-bold shrink-0 mt-0.5 text-xs font-['JetBrains_Mono']">
                                                2
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                                                    Isolasi & Rollback Cepat
                                                </div>
                                                <p className="text-xs text-on-surface-variant mt-0.5">
                                                    Mematikan skrip berbahaya secara virtual lewat WAF dan meregenerasi file asli.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-surface-container-highest flex items-center justify-center text-tertiary font-bold shrink-0 mt-0.5 text-xs font-['JetBrains_Mono']">
                                                3
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                                                    Eskalasi Tiket CSIRT Instan
                                                </div>
                                                <p className="text-xs text-on-surface-variant mt-0.5">
                                                    Membuat laporan forensik lengkap beserta titik celah keamanan yang dieksploitasi.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Interactive Simulation Terminal Box (7 Cols) */}
                                <div className="lg:col-span-7">
                                    <div className="rounded-2xl bg-surface-container-low/90 border border-surface-container-highest/80 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden">
                                        {/* Terminal Header */}
                                        <div className="flex items-center justify-between pb-4 border-b border-surface-container-highest">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-error/60"></span>
                                                <span className="w-3 h-3 rounded-full bg-warning/60"></span>
                                                <span className="w-3 h-3 rounded-full bg-primary/60"></span>
                                                <span className="text-[11px] font-['JetBrains_Mono'] text-on-surface-variant ml-2">
                                                    SIMULASI ANCAMAN SIBER // LIVE ENGINE REPLAY
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-['JetBrains_Mono'] text-primary uppercase font-semibold">
                                                STATUS: MITIGATED
                                            </span>
                                        </div>

                                        {/* Simulation Flow Step Sequence */}
                                        <div className="space-y-4 py-6 font-['JetBrains_Mono'] text-xs">
                                            {simScenario === 'defacement' ? (
                                                <>
                                                    {/* Step 1: Anomali Terdeteksi */}
                                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-error">
                                                        <span className="material-symbols-outlined text-error text-[24px] mt-0.5">warning</span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-on-surface">ANOMALI TERDETEKSI: Injeksi URL Liar</span>
                                                                <span className="text-[11px] text-error font-semibold">T = +0.00s</span>
                                                            </div>
                                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                                Target: <span className="text-on-surface font-semibold">bappeda.pemda.go.id/publikasi</span> • Terdeteksi keyword terlarang:{' '}
                                                                <span className="text-error bg-error/10 px-1 rounded font-mono">slot-gacor-88</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Step 2: AI Engine Analysis & Containment */}
                                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-secondary">
                                                        <span className="material-symbols-outlined text-secondary text-[24px] mt-0.5">psychology</span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-on-surface">ANALISIS OTONOM: AI Root-Cause Engine</span>
                                                                <span className="text-[11px] text-secondary font-semibold">T = +1.18s</span>
                                                            </div>
                                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                                Celah teridentifikasi: <span className="text-on-surface font-mono">Unsanitized POST /wp-comments-post.php</span>. Modul WAF menyaring IP penyerang (ASN 45823) dan memulihkan teks asli dari cache aman.
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Step 3: Resolution & CSIRT Notification */}
                                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-primary">
                                                        <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">check_circle</span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-on-surface">RESOLUSI TUNTAS: Tiket #INC-2026-088 Diterbitkan</span>
                                                                <span className="text-[11px] text-primary font-semibold">T = +2.45s</span>
                                                            </div>
                                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                                Notifikasi otomatis terkirim ke Telegram Tim Siber Diskominfo. Laman pulih 100% tanpa waktu henti operasional publik.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Alternative Scenario: Downtime & SSL Expiry */}
                                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-warning">
                                                        <span className="material-symbols-outlined text-warning text-[24px] mt-0.5">timer_off</span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-on-surface">LATENSI KRITIS: HTTP 504 Gateway Timeout</span>
                                                                <span className="text-[11px] text-warning font-semibold">T = +0.00s</span>
                                                            </div>
                                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                                Target: <span className="text-on-surface font-semibold">dukcapil.pemda.go.id</span> • Server tidak merespons dalam 60 detik.
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-secondary">
                                                        <span className="material-symbols-outlined text-secondary text-[24px] mt-0.5">dns</span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-on-surface">DIAGNOSTIK OTOMATIS: Healthcheck Node</span>
                                                                <span className="text-[11px] text-secondary font-semibold">T = +0.95s</span>
                                                            </div>
                                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                                Port 443 terbuka, Service PHP-FPM mengalami antrean request tinggi. AI Remediasi merekomendasikan restart pool worker.
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-primary">
                                                        <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">done_all</span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-on-surface">PEMULIHAN KONEKSI: Layanan Kembali Normal</span>
                                                                <span className="text-[11px] text-primary font-semibold">T = +1.80s</span>
                                                            </div>
                                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                                Latency stabil kembali pada 24ms. Status tercatat pada laporan SLA Uptime harian.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Bottom Summary Status Badge */}
                                        <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest flex items-center justify-between text-xs font-['JetBrains_Mono']">
                                            <div className="flex items-center gap-2 text-primary">
                                                <span className="material-symbols-outlined text-[18px]">verified</span>
                                                <span>Total Durasi Mitigasi: {simScenario === 'defacement' ? '2.45' : '1.80'} Detik (Bebas Downtime)</span>
                                            </div>
                                            <button
                                                onClick={toggleScenario}
                                                className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface hover:text-primary transition-colors border border-surface-container-highest"
                                            >
                                                Uji Skenario {simScenario === 'defacement' ? 'Downtime' : 'Defacement'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 6: CALL TO ACTION BANNER (CYBER MESH GRADIENT) */}
                        <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 py-20" id="kontak-csirt">
                            <div className="relative rounded-3xl p-10 lg:p-16 overflow-hidden shadow-2xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest border border-surface-container-highest">
                                {/* Cyber Mesh Glowing Elements in Background */}
                                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[90px] pointer-events-none"></div>
                                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/20 rounded-full blur-[90px] pointer-events-none"></div>

                                <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6 shadow-inner">
                                        <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            security
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight font-['Plus_Jakarta_Sans']">
                                        Wujudkan Ekosistem Digital Pemerintah Daerah yang Tangguh, Aman, dan Bebas Ancaman Siber
                                    </h2>
                                    <p className="text-base text-on-surface-variant max-w-2xl mt-5 leading-relaxed">
                                        Hubungi tim pengelola Diskominfo untuk integrasi pendaftaran domain situs OPD, sinkronisasi sertifikat SSL/TLS instansi, atau dapatkan bantuan teknis tanggap darurat siber.
                                    </p>

                                    {/* CTA Action Buttons */}
                                    <div className="flex flex-wrap items-center justify-center gap-4 mt-8 w-full sm:w-auto">
                                        <Link
                                            href={user ? route('dashboard') : route('login')}
                                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-container via-surface-tint to-primary text-on-primary font-bold text-sm shadow-[0_0_24px_rgba(20,184,166,0.4)] hover:shadow-[0_0_36px_rgba(20,184,166,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all font-['Plus_Jakarta_Sans']"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {user ? 'dashboard' : 'login'}
                                            </span>
                                            <span>{user ? 'Masuk ke Dashboard Sistem' : 'Akses Portal SIGAP'}</span>
                                        </Link>
                                        <a
                                            href="tel:159"
                                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-surface-container-highest/80 hover:bg-surface-container-highest text-secondary text-sm font-semibold border border-surface-container-highest backdrop-blur-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all font-['Plus_Jakarta_Sans']"
                                        >
                                            <span className="material-symbols-outlined text-[20px] text-primary">phone_in_talk</span>
                                            <span>Hubungi Hotline CSIRT (159)</span>
                                        </a>
                                    </div>

                                    {/* Micro Information Guarantee */}
                                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-on-surface-variant text-xs font-['JetBrains_Mono']">
                                        <span>• Layanan Khusus Instansi Pemerintah Resmi (.go.id)</span>
                                        <span>• Siaga 24 Jam 7 Hari Penuh</span>
                                        <span>• Respons Tim Reaksi Cepat BSSN / Gov-CSIRT</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>

                {/* OFFICIAL FOOTER */}
                <footer className="w-full bg-[#060e20]/95 backdrop-blur-xl border-t border-[#222a3d] mt-10 pt-12 pb-8">
                    <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                        {/* Col 1 */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-surface-tint flex items-center justify-center text-on-primary">
                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        shield_lock
                                    </span>
                                </div>
                                <span className="font-bold text-lg text-primary tracking-wider font-['Plus_Jakarta_Sans']">
                                    SIGAP
                                </span>
                            </div>
                            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                                Sistem Informasi Pengawasan & Tanggap Keamanan Siber Terpadu. Menjaga kedaulatan digital dan integritas infrastruktur web instansi pemerintah republik Indonesia secara real-time.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high border border-surface-container-highest text-on-surface-variant text-[11px] font-['JetBrains_Mono']">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    DEFENSE READY
                                </span>
                            </div>
                        </div>

                        {/* Col 2 */}
                        <div>
                            <h4 className="text-sm font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                                Kontak Darurat CSIRT
                            </h4>
                            <div className="space-y-2.5 text-xs text-on-surface-variant">
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">support_agent</span>
                                    <div>
                                        <div className="text-on-surface font-semibold">Hotline 24/7 Tanggap Darurat</div>
                                        <div className="text-secondary font-['JetBrains_Mono']">159 / (021) 788-400-99</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">mail</span>
                                    <div>
                                        <div className="text-on-surface font-semibold">Email Insiden</div>
                                        <div className="font-['JetBrains_Mono']">incident-response@csirt.go.id</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">shield</span>
                                    <div>
                                        <div className="text-on-surface font-semibold">Unit Pengawas</div>
                                        <div className="text-on-surface-variant">Diskominfo Cyber Command Centre</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Col 3 */}
                        <div>
                            <h4 className="text-sm font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                                Tautan Resmi & Tata Kelola
                            </h4>
                            <ul className="space-y-2 text-xs">
                                <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[16px]">chevron_right</span>
                                    <a href="#mitigasi-insiden-ai" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                        SOP Penanganan Insiden Siber
                                    </a>
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[16px]">chevron_right</span>
                                    <a href="#pilar-pengawasan" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                        Kepatuhan Standar BSSN
                                    </a>
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[16px]">chevron_right</span>
                                    <a href="#transparansi-status" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                        Panduan Integrasi & Pengguna
                                    </a>
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[16px]">chevron_right</span>
                                    <a href="#kontak-csirt" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                        Pelaporan Cepat Web Defacement
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Col 4 */}
                        <div>
                            <h4 className="text-sm font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                                Sertifikasi & Kemitraan
                            </h4>
                            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                                Terakreditasi sesuai regulasi Perpres No. 95/2018 (SPBE) dan Peraturan BSSN No. 8/2020 tentang Sistem Manajemen Keamanan Informasi.
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1.5 rounded bg-surface-container border border-surface-container-highest text-on-surface-variant text-[11px] font-['JetBrains_Mono'] uppercase">
                                    Gov-CSIRT ID
                                </div>
                                <div className="px-3 py-1.5 rounded bg-surface-container border border-surface-container-highest text-on-surface-variant text-[11px] font-['JetBrains_Mono'] uppercase">
                                    SPBE Grade A
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 pt-6 border-t border-surface-container-highest/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
                        <p className="text-center md:text-left">
                            © 2026 SIGAP — Dinas Komunikasi dan Informatika. Hak Cipta Dilindungi Undang-Undang.
                        </p>
                        <div className="flex items-center gap-4 text-[11px] font-['JetBrains_Mono']">
                            <span className="hover:text-primary transition-colors cursor-pointer">Kebijakan Privasi</span>
                            <span className="text-outline-variant">•</span>
                            <span className="hover:text-primary transition-colors cursor-pointer">Ketentuan Layanan</span>
                            <span className="text-outline-variant">•</span>
                            <span className="hover:text-primary transition-colors cursor-pointer">Klasifikasi Rahasia</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
