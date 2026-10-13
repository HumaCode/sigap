import React from 'react';
import { Link } from '@inertiajs/react';
import { User } from '@/types';

interface BerandaSectionProps {
    user?: User;
    totalSites: number;
    avgUptime: number;
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
}

export default function BerandaSection({
    user,
    totalSites,
    avgUptime,
    socTelemetry,
}: BerandaSectionProps) {
    const defconLevel = socTelemetry?.defcon_level || 'DEFCON 5';
    const defconStatus = socTelemetry?.defcon_status || 'NOMINAL';
    const defconType = socTelemetry?.defcon_type || 'secondary';
    const radarBlip1 = socTelemetry?.radar_blip_1 || 'portal-layanan.id';
    const radarBlip2 = socTelemetry?.radar_blip_2 || 'app-service.id';
    const anomaliesCount = socTelemetry?.anomalies_count ?? 0;
    const criticalCount = socTelemetry?.critical_count ?? 0;
    const sslPercentage = socTelemetry?.ssl_percentage ?? 100;
    const latestDomain = socTelemetry?.latest_scanned_domain || 'domain-layanan.id';

    const defconColorClass = defconType === 'error'
        ? 'text-error bg-error/15 border-error/30 animate-pulse'
        : defconType === 'warning'
        ? 'text-warning bg-warning/15 border-warning/30'
        : 'text-secondary bg-surface-container border-surface-container-highest';

    return (
        <section
            id="beranda"
            className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 pt-8 pb-12 lg:pt-14 lg:pb-16"
        >
            {/* Hero Dual Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                {/* Left Hero Content (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col items-start space-y-6">
                    {/* Live Telemetry Pill Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high/80 backdrop-blur-xl border border-surface-container-highest shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-[11px] font-['JetBrains_Mono'] text-primary uppercase tracking-widest font-semibold">
                            SISTEM PEMANTAUAN REALTIME AKTIF
                        </span>
                        <span className="text-on-surface-variant text-[11px] font-['JetBrains_Mono'] hidden sm:inline">
                            • 24/7 Pengawasan Siber Real-time
                        </span>
                    </div>

                    {/* Hero Headline */}
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-on-surface font-['Plus_Jakarta_Sans']">
                        Pengawasan Ketersediaan &amp;{' '}
                        <span className="bg-gradient-to-r from-primary via-primary-fixed to-secondary bg-clip-text text-transparent">
                            Ketahanan Siber
                        </span>{' '}
                        Situs Web &amp; Layanan Digital
                    </h1>

                    {/* Hero Subheadline */}
                    <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                        Solusi otomatisasi pemantauan uptime 24/7, pencegahan defacement, pendeteksi dini konten ilegal (judi online &amp; malware), serta respon insiden berbasis AI terintegrasi untuk menjaga integritas website, domain, dan layanan digital Anda.
                    </p>

                    {/* Dual CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full sm:w-auto">
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
                            href="#transparansi-status"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-surface-container-high/70 hover:bg-surface-container-highest text-secondary text-sm font-semibold border border-surface-container-highest backdrop-blur-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all font-['Plus_Jakarta_Sans']"
                        >
                            <span className="material-symbols-outlined text-[20px] text-primary">radar</span>
                            <span>Pantau Status Terkini</span>
                        </a>
                    </div>

                    {/* Quick Micro-Badges */}
                    <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-on-surface-variant font-['JetBrains_Mono']">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                            <span>Standar Keamanan Siber Grade A</span>
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
                    <div className="w-full relative rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl border border-surface-container-highest/80 p-5 shadow-2xl overflow-hidden">
                        {/* Top HUD Classification Bar */}
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-highest">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${defconType === 'error' ? 'bg-error' : defconType === 'warning' ? 'bg-warning' : 'bg-primary'} animate-pulse`}></div>
                                <span className="text-xs font-['JetBrains_Mono'] text-on-surface tracking-wider font-semibold">
                                    SIGAP SOC CONSOLE // NODE-ID: JK-01
                                </span>
                            </div>
                            <span className={`text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded border ${defconColorClass}`}>
                                {defconLevel} • {defconStatus}
                            </span>
                        </div>

                        {/* Central Radar Pulse Engine & Live Telemetry Topology */}
                        <div className="relative w-full h-56 sm:h-64 flex items-center justify-center rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest/60 overflow-hidden">
                            {/* Polar Radar Background Rings */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-primary/20"></div>
                                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border border-primary/25"></div>
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-primary/30"></div>
                                {/* Crosshairs */}
                                <div className="absolute w-full h-[1px] bg-primary/20"></div>
                                <div className="absolute h-full w-[1px] bg-primary/20"></div>
                            </div>

                            {/* Sweeping Radar Beam */}
                            <div className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full pointer-events-none animate-radar-sweep radar-conic"></div>

                            {/* Center Shield Emissive Centerpiece */}
                            <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-container via-surface-container-high to-surface-container flex items-center justify-center shadow-[0_0_24px_rgba(20,184,166,0.6)] border border-primary/40">
                                <span className="material-symbols-outlined text-on-primary text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    security
                                </span>
                            </div>

                            {/* Intercept Target Blips on Radar */}
                            <div className="absolute top-6 left-8 flex items-center gap-1.5 z-10">
                                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                                <span className="text-[10px] font-['JetBrains_Mono'] text-secondary bg-surface-container-high/90 px-1.5 py-0.5 rounded border border-surface-container-highest truncate max-w-[200px]" title={radarBlip1}>
                                    {radarBlip1} (22ms)
                                </span>
                            </div>
                            <div className="absolute bottom-8 right-8 flex items-center gap-1.5 z-10">
                                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                                <span className="text-[10px] font-['JetBrains_Mono'] text-primary bg-surface-container-high/90 px-1.5 py-0.5 rounded border border-surface-container-highest truncate max-w-[200px]" title={radarBlip2}>
                                    {radarBlip2} (31ms)
                                </span>
                            </div>

                            {/* Bottom telemetry ticker inside radar */}
                            <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-on-surface-variant text-[10px] font-['JetBrains_Mono']">
                                <span>BEAM: 360° SWEEP</span>
                                <span className={anomaliesCount > 0 ? 'text-warning font-semibold' : 'text-primary font-semibold'}>
                                    {anomaliesCount === 0 ? '0 ANOMALY DETECTED' : `${anomaliesCount} ANOMALIES DETECTED`}
                                </span>
                            </div>
                        </div>

                        {/* Floating Metric Overlay Cards */}
                        <div className="grid grid-cols-3 gap-2.5 mt-3">
                            <div className="p-3 rounded-lg bg-surface-container/90 border border-surface-container-highest backdrop-blur-md flex flex-col justify-between">
                                <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-on-surface-variant">
                                    <span>Uptime</span>
                                    <span className="material-symbols-outlined text-primary text-[16px]">speed</span>
                                </div>
                                <div className="mt-1.5">
                                    <div className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-on-surface">{avgUptime}%</div>
                                    <div className="text-[9.5px] font-['JetBrains_Mono'] text-primary flex items-center gap-1 mt-0.5 truncate">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                                        28ms normal
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-surface-container/90 border border-surface-container-highest backdrop-blur-md flex flex-col justify-between">
                                <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-on-surface-variant">
                                    <span>SSL/TLS</span>
                                    <span className="material-symbols-outlined text-secondary text-[16px]">lock_clock</span>
                                </div>
                                <div className="mt-1.5">
                                    <div className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-on-surface truncate">{sslPercentage}% Valid</div>
                                    <div className="text-[9.5px] font-['JetBrains_Mono'] text-secondary mt-0.5 truncate">
                                        {sslPercentage >= 95 ? 'Grade A+' : 'Standar'}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-surface-container/90 border border-surface-container-highest backdrop-blur-md flex flex-col justify-between">
                                <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-on-surface-variant">
                                    <span>AI Engine</span>
                                    <span className="material-symbols-outlined text-surface-tint text-[16px]">memory</span>
                                </div>
                                <div className="mt-1.5">
                                    <div className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-on-surface truncate">
                                        {criticalCount > 0 ? 'Insiden Aktif' : 'Aktif Siaga'}
                                    </div>
                                    <div className={`text-[9.5px] font-['JetBrains_Mono'] mt-0.5 truncate ${criticalCount > 0 ? 'text-error font-semibold' : 'text-surface-tint'}`}>
                                        {criticalCount} Kritis
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terminal Stream Raw Log Bar */}
                        <div className="mt-3 p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-highest/60 text-[11px] font-['JetBrains_Mono'] text-on-surface-variant flex items-center justify-between overflow-hidden">
                            <div className="flex items-center gap-2 truncate min-w-0">
                                <span className="text-primary font-bold shrink-0">[SYS_STREAM]</span>
                                <span className="truncate">Deep crawl scan for {latestDomain} completed (Clean).</span>
                            </div>
                            <span className="text-secondary shrink-0 font-semibold ml-2">TICK: 0.12s</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Trust & Metrics Cards Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 lg:mt-16">
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
                            Domain &amp; Website Terpantau
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                            Seluruh domain web, sub-domain, dan sistem digital aktif diawasi secara terpusat.
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
                            Rata-rata uptime reliabilitas ketersediaan sistem web &amp; layanan digital.
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
                            Pemindaian semantik tanpa henti mencegah penyusupan konten ilegal &amp; injeksi berbahaya.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
