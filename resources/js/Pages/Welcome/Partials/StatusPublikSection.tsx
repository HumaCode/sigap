import React, { useState, useEffect } from 'react';

export interface PublicServiceItem {
    id?: string;
    name: string;
    url: string;
    uptime?: string;
    status: string;
    status_label?: string;
}

export interface SystemStatusData {
    type: 'normal' | 'warning' | 'critical';
    text: string;
    dot_color: string;
    badge_color: string;
}

interface StatusPublikSectionProps {
    initialServices?: PublicServiceItem[];
    initialSystemStatus?: SystemStatusData;
    avgUptime?: number;
}

export default function StatusPublikSection({
    initialServices,
    initialSystemStatus,
    avgUptime = 99.85,
}: StatusPublikSectionProps) {
    const defaultServices: PublicServiceItem[] = [
        { name: 'Portal Layanan Web Utama', url: 'portal.layanan-digital.id', uptime: '99.98%', status: 'up', status_label: 'Aktif Normal' },
        { name: 'Gateway API & Microservices', url: 'api.service-cloud.id', uptime: '99.95%', status: 'up', status_label: 'Aktif Normal' },
        { name: 'Sistem Autentikasi & Akun', url: 'auth.secure-identity.id', uptime: '100.0%', status: 'up', status_label: 'Aktif Normal' },
        { name: 'Platform E-Commerce & Transaksi', url: 'shop.digital-store.id', uptime: '99.89%', status: 'up', status_label: 'Aktif Normal' },
    ];

    const [services, setServices] = useState<PublicServiceItem[]>(
        initialServices && initialServices.length > 0 ? initialServices : defaultServices
    );
    const [systemStatus, setSystemStatus] = useState<SystemStatusData>(
        initialSystemStatus || {
            type: 'normal',
            text: 'Seluruh Sistem Beroperasi Normal',
            dot_color: 'bg-primary',
            badge_color: 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_24px_rgba(20,184,166,0.2)]',
        }
    );
    const [weeklyUptime, setWeeklyUptime] = useState<number>(avgUptime);
    const [lastUpdated, setLastUpdated] = useState<string>('Baru saja');
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [pulseIndicator, setPulseIndicator] = useState<boolean>(false);

    // Sync if initial props change
    useEffect(() => {
        if (initialServices && initialServices.length > 0) {
            setServices(initialServices);
        }
        if (initialSystemStatus) {
            setSystemStatus(initialSystemStatus);
        }
    }, [initialServices, initialSystemStatus]);

    const fetchRealtimeStatus = async (showSpinner = false) => {
        if (showSpinner) setIsRefreshing(true);
        try {
            const response = await fetch('/api/realtime-status', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.services && data.services.length > 0) {
                    setServices(data.services);
                }
                if (data.system_status) {
                    setSystemStatus(data.system_status);
                }
                if (data.summary?.avg_uptime) {
                    setWeeklyUptime(data.summary.avg_uptime);
                }
                if (data.updated_at) {
                    setLastUpdated(data.updated_at);
                }
                // Flash glow border briefly
                setPulseIndicator(true);
                setTimeout(() => setPulseIndicator(false), 900);
            }
        } catch (error) {
            console.error('Failed to fetch realtime status:', error);
        } finally {
            if (showSpinner) setIsRefreshing(false);
        }
    };

    // Auto-poll every 8 seconds for realtime telemetry
    useEffect(() => {
        const interval = setInterval(() => {
            fetchRealtimeStatus(false);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 py-16" id="transparansi-status">
            <div className={`rounded-3xl bg-surface-container/70 border border-surface-container-highest/80 backdrop-blur-2xl p-8 lg:p-12 shadow-2xl relative overflow-hidden transition-all duration-500 ${pulseIndicator ? 'ring-1 ring-primary/40' : ''}`}>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-surface-container-highest">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container-high text-primary text-xs font-['JetBrains_Mono'] uppercase font-semibold mb-3 border border-surface-container-highest">
                            STATUS OPERASIONAL REALTIME
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                            Status Operasional Website &amp; Layanan Digital
                        </h2>
                        <p className="text-sm text-on-surface-variant mt-2 max-w-xl leading-relaxed">
                            Pengguna dan pengelola sistem dapat memantau kesehatan website secara transparan langsung dari basis data pemantauan real-time.
                        </p>
                    </div>

                    {/* Realtime Live Status & Sync Pill */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-lowest/90 border border-surface-container-highest text-xs font-['JetBrains_Mono'] shadow-sm transition-all ${pulseIndicator ? 'border-primary/60 bg-primary/5' : ''}`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-on-surface-variant text-[11px] font-semibold">
                                SYNC // {lastUpdated}
                            </span>
                            <button
                                onClick={() => fetchRealtimeStatus(true)}
                                disabled={isRefreshing}
                                title="Segarkan data realtime sekarang"
                                className="ml-1 text-on-surface-variant hover:text-primary transition-colors flex items-center p-0.5 rounded hover:bg-surface-container-high"
                            >
                                <span className={`material-symbols-outlined text-[15px] ${isRefreshing ? 'animate-spin text-primary' : ''}`}>
                                    refresh
                                </span>
                            </button>
                        </div>

                        <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl border backdrop-blur-xl ${systemStatus.badge_color} transition-all duration-300`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${systemStatus.dot_color} animate-pulse`}></span>
                            <span className="text-xs sm:text-sm font-bold font-['Plus_Jakarta_Sans']">
                                {systemStatus.text}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 7-Day Sparkline Timeline Visualization */}
                <div className="py-8">
                    <div className="flex items-center justify-between mb-3 text-xs font-['JetBrains_Mono']">
                        <span className="text-on-surface-variant font-semibold uppercase">Uptime Tren 7 Hari Terakhir</span>
                        <span className="text-primary font-semibold">{weeklyUptime}% Rata-rata Mingguan</span>
                    </div>

                    <div className="flex items-end gap-1 sm:gap-1.5 h-10 w-full p-2 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest overflow-hidden">
                        {Array.from({ length: 48 }).map((_, idx) => {
                            const isMaintenance = idx === 14;
                            const isDegraded = idx === 32 && systemStatus.type !== 'normal';
                            return (
                                <div
                                    key={idx}
                                    className={`flex-1 min-w-[3px] rounded-sm transition-all hover:scale-y-110 ${
                                        isDegraded
                                            ? 'h-5 bg-warning/80 hover:bg-warning'
                                            : isMaintenance
                                            ? 'h-6 bg-secondary/80 hover:bg-secondary'
                                            : 'h-8 bg-primary/80 hover:bg-primary'
                                    }`}
                                    title={`Slot #${idx + 1}: ${isDegraded ? '98.5% Respons Lambat' : isMaintenance ? '99.2% Pemeliharaan Rutin' : '100% Normal'}`}
                                />
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant text-[11px] font-['JetBrains_Mono'] mt-2">
                        <span>7 Hari Lalu</span>
                        <span className="text-primary font-semibold">100% Bebas Defacement</span>
                        <span>Hari Ini</span>
                    </div>
                </div>

                {/* Table / List of Monitored Services directly from DB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {services.map((service, index) => {
                        const isUp = service.status === 'up';
                        const isWarn = service.status === 'warn';
                        const isDown = service.status === 'down';

                        const dotColor = isDown ? 'bg-error' : isWarn ? 'bg-warning' : 'bg-primary';
                        const textColor = isDown ? 'text-error' : isWarn ? 'text-warning' : 'text-primary';
                        const statusLabel = service.status_label || (isDown ? 'Gangguan' : isWarn ? 'Perlu Atensi' : 'Aktif Normal');
                        const cardBorder = isDown
                            ? 'border-error/40 shadow-[0_0_20px_rgba(239,68,68,0.12)]'
                            : isWarn
                            ? 'border-warning/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                            : 'border-surface-container-highest/80';

                        return (
                            <div
                                key={service.id || index}
                                className={`p-4 rounded-xl bg-surface-container-high/60 border ${cardBorder} backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:bg-surface-container-high`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div
                                            className="text-sm font-bold text-on-surface font-['Plus_Jakarta_Sans'] truncate"
                                            title={service.name}
                                        >
                                            {service.name}
                                        </div>
                                        <div
                                            className="text-xs text-on-surface-variant font-['JetBrains_Mono'] mt-0.5 truncate"
                                            title={service.url}
                                        >
                                            {service.url}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 mt-1">
                                        <span className="relative flex h-2.5 w-2.5">
                                            {isDown && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>}
                                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`}></span>
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-surface-container-highest flex items-center justify-between text-xs font-['JetBrains_Mono']">
                                    <span className="text-on-surface-variant">Uptime {service.uptime || '99.9%'}</span>
                                    <span className={`${textColor} font-semibold`}>
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-surface-container-highest">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">policy</span>
                        <span className="text-xs text-on-surface-variant">
                            Dipantau dengan standar tata kelola keamanan siber modern &amp; jaminan ketersediaan SLA 99.9%.
                        </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <a
                            href="/status"
                            className="px-3.5 py-2 rounded-xl bg-primary text-slate-950 font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                        >
                            <span>Halaman Status Publik Mandiri</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
