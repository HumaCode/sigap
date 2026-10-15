import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DynamicToast, { toast } from '@/Components/DynamicToast';

interface SiteItem {
    id: string;
    name: string;
    url: string;
    category: string;
    status: 'up' | 'warn' | 'down' | 'maintenance';
    status_label: string;
    is_under_maintenance: boolean;
    maintenance_title?: string | null;
    uptime_percentage: number;
    latency: number;
    ssl_status: string;
    history: number[]; // 30 numbers: 1=up, 2=warn, 0=down
}

interface ClusterItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    status: 'operational' | 'warn' | 'down' | 'maintenance';
    avg_uptime: number;
    total_services: number;
    sites: SiteItem[];
}

interface Maintenance {
    id: string;
    title: string;
    description: string | null;
    status: string;
    start_time: string;
    end_time: string;
    sites: Array<{ id: string; name: string; url: string; category?: string }>;
}

interface IncidentItem {
    id: string;
    title: string;
    type: string;
    severity: string;
    status: string;
    description: string;
    site_name: string;
    date_formatted: string;
    time_ago: string;
    is_resolved: boolean;
}

interface StatusPageProps {
    overallStatus: {
        type: 'operational' | 'maintenance' | 'degraded' | 'outage';
        title: string;
        subtitle: string;
        badge: string;
        color: string;
        bg: string;
    };
    clusters: ClusterItem[];
    activeMaintenances: Maintenance[];
    upcomingMaintenances: Maintenance[];
    recentIncidents: IncidentItem[];
    stats: {
        total_services: number;
        operational_count: number;
        maintenance_count: number;
        down_count: number;
        warn_count: number;
        avg_uptime: number;
        last_updated: string;
    };
}

export default function StatusPage({
    overallStatus,
    clusters = [],
    activeMaintenances = [],
    upcomingMaintenances = [],
    recentIncidents = [],
    stats,
}: StatusPageProps) {
    const [openClusters, setOpenClusters] = useState<{ [key: string]: boolean }>({
        portal: true,
        spbe: true,
    });

    const [showSubscribeModal, setShowSubscribeModal] = useState(false);
    const [subType, setSubType] = useState<'email' | 'whatsapp'>('email');
    const [subContact, setSubContact] = useState('');
    const [subSiteId, setSubSiteId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-refresh data every 60 seconds
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    router.reload();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleCluster = (id: string) => {
        setOpenClusters((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSubscribeSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!subContact.trim()) {
            toast.error(subType === 'email' ? 'Masukkan alamat email Anda.' : 'Masukkan nomor WhatsApp Anda.');
            return;
        }

        setIsSubmitting(true);

        router.post(
            route('status.subscribe'),
            {
                type: subType,
                contact: subContact,
                site_id: subSiteId || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowSubscribeModal(false);
                    setSubContact('');
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const firstErr = Object.values(errors)[0];
                    if (firstErr) toast.error(String(firstErr));
                },
            }
        );
    };

    const formatDateRange = (startStr: string, endStr: string) => {
        try {
            const s = new Date(startStr);
            const e = new Date(endStr);
            const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
            return `${s.toLocaleDateString('id-ID', opts)} — ${e.toLocaleDateString('id-ID', opts)} WIB`;
        } catch {
            return `${startStr} — ${endStr}`;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
            <Head>
                <title>Status Layanan Mandiri Publik — SIGAP Pemerintah Daerah</title>
                <meta name="description" content="Portal transparansi status real-time kesehatan sistem, uptime SPBE, dan jadwal pemeliharaan situs resmi pemerintah." />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            {/* Background Ambient Glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
            </div>

            {/* Top Navigation */}
            <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 py-3.5 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 p-0.5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                                <i className="bi bi-shield-check text-teal-400 text-xl"></i>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                                    SIGAP Status
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30 rounded-full">
                                    PUBLIK
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">Monitoring & Transparansi Layanan Warga</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSubscribeModal(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 active:scale-95"
                        >
                            <i className="bi bi-bell-fill"></i>
                            <span>Langganan Update</span>
                        </button>

                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
                        >
                            <i className="bi bi-person-fill"></i>
                            <span className="hidden sm:inline">Admin Login</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* 1. Overall Status Hero Banner */}
                <section className="mb-8">
                    <div className={`p-6 sm:p-8 rounded-2xl border ${overallStatus.bg} backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="relative mt-1">
                                    <span className={`w-4 h-4 rounded-full block ${overallStatus.color === 'success' ? 'bg-emerald-500' : overallStatus.color === 'info' ? 'bg-sky-500' : overallStatus.color === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                    <span className={`w-4 h-4 rounded-full block animate-ping absolute inset-0 ${overallStatus.color === 'success' ? 'bg-emerald-400' : overallStatus.color === 'info' ? 'bg-sky-400' : overallStatus.color === 'warning' ? 'bg-amber-400' : 'bg-red-400'} opacity-75`}></span>
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5">
                                        {overallStatus.title}
                                    </h1>
                                    <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                                        {overallStatus.subtitle}
                                    </p>
                                </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-700/50 pt-3 sm:pt-0">
                                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                    <i className="bi bi-clock-history"></i>
                                    {stats.last_updated}
                                </span>
                                <span className="text-[11px] text-teal-400 font-mono mt-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                                    Auto-refresh: {countdown}s
                                </span>
                            </div>
                        </div>

                        {/* Telemetry Stat Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/40">
                            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/80">
                                <span className="text-xs text-slate-400 block mb-0.5">Total Layanan</span>
                                <span className="text-lg font-bold text-white">{stats.total_services} Situs</span>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/80">
                                <span className="text-xs text-slate-400 block mb-0.5">Beroperasi Normal</span>
                                <span className="text-lg font-bold text-emerald-400">{stats.operational_count} Situs</span>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/80">
                                <span className="text-xs text-slate-400 block mb-0.5">Pemeliharaan Aktif</span>
                                <span className="text-lg font-bold text-sky-400">{stats.maintenance_count} Situs</span>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/80">
                                <span className="text-xs text-slate-400 block mb-0.5">Tingkat Uptime (30d)</span>
                                <span className="text-lg font-bold text-teal-400">{stats.avg_uptime}%</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Active Maintenance Alert Banner (if any) */}
                {activeMaintenances.length > 0 && (
                    <section className="mb-8">
                        <div className="space-y-4">
                            {activeMaintenances.map((m) => (
                                <div
                                    key={m.id}
                                    className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/80 to-blue-950/60 border border-sky-500/30 backdrop-blur-xl shadow-lg relative overflow-hidden"
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                                            <i className="bi bi-tools text-lg"></i>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-sky-500 text-slate-950 uppercase tracking-wide">
                                                    Sedang Berlangsung
                                                </span>
                                                <h3 className="font-bold text-white text-base">{m.title}</h3>
                                            </div>
                                            {m.description && (
                                                <p className="text-sm text-slate-300 mb-3 leading-relaxed">{m.description}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <i className="bi bi-clock text-sky-400"></i>
                                                    <span>Rentang Waktu: <strong>{formatDateRange(m.start_time, m.end_time)}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <i className="bi bi-grid-fill text-sky-400"></i>
                                                    <span>Situs Terdampak: <strong>{m.sites.length} Layanan</strong></span>
                                                </div>
                                            </div>

                                            {/* Affected Sites Tags */}
                                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-sky-500/20">
                                                {m.sites.map((s) => (
                                                    <span
                                                        key={s.id}
                                                        className="px-2.5 py-1 text-xs rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 font-medium"
                                                    >
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. Upcoming Scheduled Maintenances (if any) */}
                {upcomingMaintenances.length > 0 && (
                    <section className="mb-8">
                        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
                            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <i className="bi bi-calendar-event"></i>
                                Pemeliharaan Terjadwal Mendatang
                            </h2>
                            <div className="divide-y divide-slate-800/60">
                                {upcomingMaintenances.map((m) => (
                                    <div key={m.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                <span className="font-semibold text-white text-sm">{m.title}</span>
                                            </div>
                                            {m.description && (
                                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{m.description}</p>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 shrink-0 font-medium bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/40">
                                            {formatDateRange(m.start_time, m.end_time)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 4. Klaster Layanan Publik (Clusters of Services) */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <i className="bi bi-layers-fill text-teal-400"></i>
                                Status Layanan per Klaster Instansi
                            </h2>
                            <p className="text-xs text-slate-400">Dipantau berkala setiap 60 detik melalui multi-node probe</p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Maintenance
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Gangguan
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {clusters.map((cluster) => {
                            const isOpen = Boolean(openClusters[cluster.id]);
                            const statusConfig = {
                                operational: { label: 'Semua Beroperasi Normal', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
                                maintenance: { label: 'Dalam Pemeliharaan', badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
                                warn: { label: 'Perlu Perhatian', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
                                down: { label: 'Sebagian Gangguan', badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
                            };
                            const currentCfg = statusConfig[cluster.status] || statusConfig.operational;

                            return (
                                <div
                                    key={cluster.id}
                                    className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden transition-all shadow-sm"
                                >
                                    {/* Cluster Header */}
                                    <div
                                        onClick={() => toggleCluster(cluster.id)}
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors select-none"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-teal-400 shrink-0">
                                                <i className={`${cluster.icon} text-lg`}></i>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-white text-base">{cluster.title}</h3>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                                                        {cluster.total_services} Layanan
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{cluster.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <span className="text-xs text-slate-400 block mb-0.5">Uptime Rata-Rata</span>
                                                <span className="text-sm font-bold text-white font-mono">{cluster.avg_uptime}%</span>
                                            </div>

                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${currentCfg.badge}`}>
                                                {currentCfg.label}
                                            </span>

                                            <i className={`bi bi-chevron-down text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                                        </div>
                                    </div>

                                    {/* Cluster Service List & 30-Day Uptime Bars */}
                                    {isOpen && (
                                        <div className="px-5 pb-5 pt-2 border-t border-slate-800/70 bg-slate-950/40 divide-y divide-slate-800/50">
                                            {cluster.sites.map((site) => (
                                                <div key={site.id} className="py-3.5 first:pt-2 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={`https://${site.url}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="font-semibold text-white hover:text-teal-400 transition-colors text-sm truncate flex items-center gap-1.5"
                                                            >
                                                                <span>{site.name}</span>
                                                                <i className="bi bi-box-arrow-up-right text-[11px] text-slate-500"></i>
                                                            </a>
                                                            <span className="text-xs font-mono text-slate-500 truncate hidden md:inline">({site.url})</span>
                                                        </div>

                                                        {site.is_under_maintenance && site.maintenance_title && (
                                                            <div className="text-xs text-sky-400 mt-1 flex items-center gap-1 font-medium">
                                                                <i className="bi bi-info-circle"></i>
                                                                <span>{site.maintenance_title}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Mini 30-Day Uptime Bars */}
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div className="hidden lg:flex items-center gap-0.5" title="Riwayat Uptime 30 Hari Terakhir">
                                                            {site.history.map((dayStatus, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`w-1 h-5 rounded-sm transition-all hover:scale-125 ${
                                                                        dayStatus === 1
                                                                            ? 'bg-emerald-500/80 hover:bg-emerald-400'
                                                                            : dayStatus === 2
                                                                            ? 'bg-amber-400/80 hover:bg-amber-300'
                                                                            : 'bg-red-500/90 hover:bg-red-400'
                                                                    }`}
                                                                ></span>
                                                            ))}
                                                        </div>

                                                        <div className="text-right min-w-[70px]">
                                                            <span className="text-xs font-mono font-bold text-white block">
                                                                {site.uptime_percentage}%
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">30d uptime</span>
                                                        </div>

                                                        {/* Status Badge */}
                                                        <div className="min-w-[130px] text-right">
                                                            {site.status === 'up' && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                                    Operasional
                                                                </span>
                                                            )}
                                                            {site.status === 'maintenance' && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                                                                    Pemeliharaan
                                                                </span>
                                                            )}
                                                            {site.status === 'warn' && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                                    Respon Lambat
                                                                </span>
                                                            )}
                                                            {site.status === 'down' && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                                                                    Gangguan Akses
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 5. Incident History Timeline (Past 14 Days) */}
                <section className="mb-12">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i className="bi bi-clock-history text-teal-400"></i>
                        Riwayat & Penanganan Insiden Terkini
                    </h2>

                    {recentIncidents.length === 0 ? (
                        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 text-center">
                            <i className="bi bi-shield-check text-4xl text-emerald-400 block mb-2"></i>
                            <h3 className="text-base font-semibold text-white">Tidak Ada Catatan Insiden Signifikan</h3>
                            <p className="text-xs text-slate-400 mt-1">Seluruh sistem beroperasi dengan stabil tanpa gangguan besar dalam 14 hari terakhir.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentIncidents.map((inc) => (
                                <div
                                    key={inc.id}
                                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                                                inc.is_resolved 
                                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                                            }`}>
                                                {inc.is_resolved ? 'Selesai / Teratasi' : 'Investigasi / Aktif'}
                                            </span>
                                            <h3 className="font-bold text-white text-base">{inc.title}</h3>
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">{inc.date_formatted} ({inc.time_ago})</span>
                                    </div>
                                    <p className="text-sm text-slate-300 mb-2 leading-relaxed">{inc.description}</p>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span>Layanan Terkait: <strong className="text-slate-400">{inc.site_name}</strong></span>
                                        <span>•</span>
                                        <span>Kategori: <strong className="text-slate-400 uppercase">{inc.type}</strong></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 6. Citizen Subscription CTA Card */}
                <section className="mb-12">
                    <div className="p-8 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-blue-950/40 border border-teal-500/30 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 inline-block mb-3">
                                Layanan Warga & Instansi
                            </span>
                            <h2 className="text-xl font-bold text-white mb-2">
                                Dapatkan Notifikasi Langsung Saat Layanan Mengalami Gangguan
                            </h2>
                            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                                Daftarkan email atau nomor WhatsApp Anda untuk menerima pemberitahuan instan ketika terjadi gangguan sistem, eskalasi darurat, atau pemeliharaan terencana.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSubscribeModal(true)}
                            className="px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shrink-0 transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 active:scale-95 flex items-center gap-2"
                        >
                            <i className="bi bi-bell-fill"></i>
                            <span>Daftar Notifikasi Gratis</span>
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-slate-950/80 py-8 relative z-10 text-center text-xs text-slate-500">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <i className="bi bi-shield-lock-fill text-teal-400"></i>
                            <span className="font-semibold">SIGAP Web Security & Uptime Guard</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                            <Link href="/" className="hover:text-white transition-colors">Beranda Utama</Link>
                            <a href="#beranda" className="hover:text-white transition-colors">Kembali ke Atas</a>
                        </div>
                    </div>
                    <p className="max-w-xl mx-auto text-slate-500">
                        Sistem pemantauan ini dikelola secara independen oleh Tim Tanggap Insiden Siber (CSIRT) Dinas Komunikasi dan Informatika untuk menjamin ketersediaan dan keandalan layanan digital publik 24/7.
                    </p>
                    <p className="mt-3 text-slate-600">© 2026 SIGAP. Seluruh Hak Cipta Dilindungi.</p>
                </div>
            </footer>

            {/* Subscription Modal (Email & WhatsApp) */}
            {showSubscribeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
                        <button
                            onClick={() => setShowSubscribeModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>

                        <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-4">
                            <i className="bi bi-bell-fill text-xl"></i>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">Langganan Notifikasi Insiden</h3>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                            Pilih kanal notifikasi yang Anda inginkan untuk menerima kabar status sistem otomatis.
                        </p>

                        <form onSubmit={handleSubscribeSubmit}>
                            {/* Tabs Email / WhatsApp */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSubType('email')}
                                    className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                        subType === 'email' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <i className="bi bi-envelope-fill"></i>
                                    <span>Via Email</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSubType('whatsapp')}
                                    className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                        subType === 'whatsapp' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <i className="bi bi-whatsapp"></i>
                                    <span>Via WhatsApp</span>
                                </button>
                            </div>

                            {/* Contact Input */}
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    {subType === 'email' ? 'Alamat Email Anda' : 'Nomor WhatsApp (Awali 08 atau 62)'}
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                        <i className={subType === 'email' ? 'bi bi-envelope' : 'bi bi-whatsapp'}></i>
                                    </span>
                                    <input
                                        type={subType === 'email' ? 'email' : 'tel'}
                                        placeholder={subType === 'email' ? 'contoh: nama@instansi.go.id' : 'contoh: 081234567890'}
                                        value={subContact}
                                        onChange={(e) => setSubContact(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Service Scope Dropdown */}
                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    Cakupan Notifikasi
                                </label>
                                <select
                                    value={subSiteId}
                                    onChange={(e) => setSubSiteId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                                >
                                    <option value="">Semua Layanan SPBE & Publik (Rekomendasi)</option>
                                    {clusters.map((c) => (
                                        <optgroup key={c.id} label={c.title}>
                                            {c.sites.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} ({s.url})
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSubscribeModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20 active:scale-95 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                                            <span>Mendaftarkan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check2"></i>
                                            <span>Aktifkan Langganan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DynamicToast />
        </div>
    );
}
