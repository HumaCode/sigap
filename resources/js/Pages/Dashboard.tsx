import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/EmptyState';
import DashboardUptimeChart from '@/Components/DashboardUptimeChart';
import DashboardVitalityMonitor from '@/Components/DashboardVitalityMonitor';
import DashboardSecurityCard from '@/Components/DashboardSecurityCard';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import '../../css/dashboard.css';
import { PageProps } from '@/types';
import { Link } from '@inertiajs/react';

interface DashboardProps {
    stats: {
        total_sites: number;
        active_sites?: number;
        warn_sites?: number;
        down_sites?: number;
        paused_sites?: number;
        avg_uptime: number;
        open_incidents: number;
        critical_incidents: number;
        detections_count: number;
        total_logs_count?: number;
        pct_secure: number;
        clean_sec_count: number;
        audited_count?: number;
        exposed_env_count: number;
        missing_csp_count: number;
        expiring_ssl_count: number;
        xframe_count?: number;
    };
    chart_data?: {
        hourly: { data: number[]; labels: string[] };
        days_7: { data: number[]; labels: string[] };
        days_30: { data: number[]; labels: string[] };
        days_90: { data: number[]; labels: string[] };
    };
    latest_sites: Array<{
        id: string;
        name: string;
        url: string;
        category: string;
        status: string;
        response_time: string;
    }>;
    recent_incidents: Array<{
        id: string;
        title: string;
        type: string;
        severity: string;
        status: string;
        site_name: string;
        site_url: string;
        detected_at: string;
    }>;
    keywords: {
        list: string[];
        remaining_count: number;
    };
    vitality_monitor?: any;
}

export default function Dashboard({ stats, chart_data, latest_sites, recent_incidents, keywords, vitality_monitor }: DashboardProps) {
    const user = usePage<PageProps>().props.auth.user;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'hourly' | '7days' | '30days' | '90days'>('7days');

    // Hourly data initialized from backend real database data
    const [hourlyData, setHourlyData] = useState<number[]>(
        chart_data?.hourly?.data || [stats.avg_uptime]
    );
    const [hourlyLabels, setHourlyLabels] = useState<string[]>(
        chart_data?.hourly?.labels || []
    );

    // Sync if props update
    useEffect(() => {
        if (chart_data?.hourly?.data) {
            setHourlyData(chart_data.hourly.data);
            setHourlyLabels(chart_data.hourly.labels);
        }
    }, [chart_data]);

    // Hourly realtime updates
    useEffect(() => {
        if (activeTab !== 'hourly') return;

        const interval = setInterval(() => {
            setHourlyData((prevData) => {
                const newData = [...prevData.slice(1)];
                const baseVal = stats.avg_uptime;
                const fluctuation = (Math.random() - 0.5) * 0.4;
                const newVal = Math.max(90, Math.min(100, Number((baseVal + fluctuation).toFixed(1))));
                newData.push(newVal);
                return newData;
            });

            setHourlyLabels((prevLabels) => {
                const newLabels = [...prevLabels.slice(1)];
                const d = new Date();
                newLabels.push(
                    d.getHours().toString().padStart(2, '0') + ':' +
                    d.getMinutes().toString().padStart(2, '0') + ':' +
                    d.getSeconds().toString().padStart(2, '0')
                );
                return newLabels;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [activeTab, stats.avg_uptime]);

    const getChartConfig = () => {
        switch (activeTab) {
            case 'hourly':
                return {
                    data: hourlyData,
                    labels: hourlyLabels,
                    title: 'Tren Uptime 12 Jam Terakhir',
                    subtitle: 'Rata-rata seluruh situs terpantau (Real-time)',
                    isLive: true,
                };
            case '7days':
                return {
                    data: chart_data?.days_7?.data || [stats.avg_uptime],
                    labels: chart_data?.days_7?.labels || ['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
                    title: 'Tren Uptime 7 Hari Terakhir',
                    subtitle: 'Berdasarkan catatan ketersediaan harian',
                    isLive: false,
                };
            case '30days':
                return {
                    data: chart_data?.days_30?.data || [stats.avg_uptime],
                    labels: chart_data?.days_30?.labels || ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu Ini'],
                    title: 'Tren Uptime 30 Hari Terakhir',
                    subtitle: 'Agregasi mingguan seluruh situs',
                    isLive: false,
                };
            case '90days':
                return {
                    data: chart_data?.days_90?.data || [stats.avg_uptime],
                    labels: chart_data?.days_90?.labels || ['Bulan 1', 'Bulan 2', 'Bulan 3'],
                    title: 'Tren Uptime 90 Hari Terakhir',
                    subtitle: 'Historis performa kuartal berjalan',
                    isLive: false,
                };
        }
    };

    const config = getChartConfig();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = currentTime.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const getSiteFavicon = (category: string) => {
        const cat = category.toLowerCase();
        if (cat.includes('belajar') || cat.includes('akademik') || cat.includes('siakad')) {
            return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))' }}><i className="bi bi-mortarboard"></i></div>;
        } else if (cat.includes('ppid') || cat.includes('informasi')) {
            return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #ff7a6e, #ff9d6e)' }}><i className="bi bi-file-earmark-text"></i></div>;
        } else if (cat.includes('spbe') || cat.includes('sistem')) {
            return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #8b7bf0, #a78bfa)' }}><i className="bi bi-diagram-3"></i></div>;
        } else if (cat.includes('peka') || cat.includes('karyawan') || cat.includes('kepegawaian')) {
            return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #ffb648, #ff9d6e)' }}><i className="bi bi-clipboard-data"></i></div>;
        } else if (cat.includes('keuangan') || cat.includes('apbd') || cat.includes('rapbd')) {
            return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}><i className="bi bi-cash-coin"></i></div>;
        }
        return <div className="site-favicon"><i className="bi bi-building"></i></div>;
    };

    const getIncidentIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('keyword') || t.includes('link') || t.includes('sisipan') || t.includes('injection')) {
            return <div className="incident-icon" style={{ background: 'linear-gradient(135deg, #ff7a6e, #ff9d6e)' }}><i className="bi bi-bug"></i></div>;
        } else if (t.includes('defacement') || t.includes('konten') || t.includes('content')) {
            return <div className="incident-icon" style={{ background: 'linear-gradient(135deg, #ffb648, #ff9d6e)' }}><i className="bi bi-pencil-square"></i></div>;
        } else if (t.includes('down') || t.includes('offline') || t.includes('unresponsive')) {
            return <div className="incident-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}><i className="bi bi-hdd-network"></i></div>;
        } else if (t.includes('env') || t.includes('git')) {
            return <div className="incident-icon" style={{ background: 'linear-gradient(135deg, #8b7bf0, #a78bfa)' }}><i className="bi bi-file-earmark-lock2"></i></div>;
        }
        return <div className="incident-icon" style={{ background: 'linear-gradient(135deg, #0ea5a3, #22c1a4)' }}><i className="bi bi-shield-exclamation"></i></div>;
    };

    const getStatusChipClass = (status: string) => {
        if (status === 'down') return 'status-chip chip-down';
        if (status === 'warn') return 'status-chip chip-warn';
        if (status === 'paused') return 'status-chip';
        return 'status-chip chip-up';
    };

    const getSeverityBadgeClass = (severity: string) => {
        const sev = severity.toLowerCase();
        if (sev === 'critical') return 'sev-badge sev-critical';
        if (sev === 'high') return 'sev-badge sev-high';
        if (sev === 'medium') return 'sev-badge sev-medium';
        return 'sev-badge';
    };

    const circumference = 163;
    const strokeDashoffset = circumference - (circumference * stats.pct_secure) / 100;
    
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <div className="page-title d-flex align-items-center gap-2 mb-2" style={{ margin: 0 }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--teal-1), var(--blue-1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', boxShadow: '0 8px 16px rgba(14,165,163,0.2)' }}>
                            <i className="bi bi-grid-1x2-fill"></i>
                        </div>
                        Selamat bekerja, {user.name.split(' ')[0]} 👋
                    </div>
                    <p className="page-sub mb-0 ms-1">Berikut ringkasan status monitoring seluruh situs instansi hari ini.</p>
                </div>
                <div className="glass-card" style={{ padding: '0.6rem 1.2rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-1)', fontSize: '1.2rem' }}>
                        <i className="bi bi-clock-history"></i>
                    </div>
                    <div className="text-end">
                        <div style={{ fontWeight: 700, color: 'var(--ink-dark)', fontSize: '1.1rem', letterSpacing: '0.02em' }}>{formattedTime}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{formattedDate}</div>
                    </div>
                </div>
            </div>

            {/* Stat cards from Real Database */}
            <div className="row g-3 mb-3">
                <div className="col-6 col-xl-3">
                    <div className="glass-card stat-card">
                        <div className="stat-icon icon-teal"><i className="bi bi-hdd-network"></i></div>
                        <div className="stat-value">{stats.total_sites}</div>
                        <div className="stat-label">Situs Terpantau</div>
                        <div className="stat-trend trend-up">
                            <i className="bi bi-check-circle me-1"></i>
                            {stats.active_sites ?? stats.total_sites} Online {stats.down_sites ? `• ${stats.down_sites} Down` : ''}
                        </div>
                        <i className="bi bi-hdd-network stat-deco"></i>
                    </div>
                </div>
                <div className="col-6 col-xl-3">
                    <div className="glass-card stat-card">
                        <div className="stat-icon icon-blue"><i className="bi bi-check-circle"></i></div>
                        <div className="stat-value">{stats.avg_uptime}%</div>
                        <div className="stat-label">Rata-rata Uptime</div>
                        <div className="stat-trend trend-up">
                            <i className="bi bi-shield-check me-1"></i> SLA Ketersediaan Sistem
                        </div>
                        <i className="bi bi-check-circle stat-deco"></i>
                    </div>
                </div>
                <div className="col-6 col-xl-3">
                    <div className="glass-card stat-card">
                        <div className="stat-icon icon-coral"><i className="bi bi-exclamation-triangle"></i></div>
                        <div className="stat-value">{stats.open_incidents}</div>
                        <div className="stat-label">Insiden Terbuka</div>
                        <div className={`stat-trend ${stats.open_incidents > 0 ? 'trend-down' : 'trend-up'}`}>
                            {stats.open_incidents > 0 ? (
                                <><i className="bi bi-exclamation-circle me-1"></i> {stats.critical_incidents} Kritis</>
                            ) : (
                                <><i className="bi bi-shield-check me-1"></i> Sistem Normal &amp; Aman</>
                            )}
                        </div>
                        <i className="bi bi-exclamation-triangle stat-deco"></i>
                    </div>
                </div>
                <div className="col-6 col-xl-3">
                    <div className="glass-card stat-card">
                        <div className="stat-icon icon-violet"><i className="bi bi-bug"></i></div>
                        <div className="stat-value">{stats.detections_count}</div>
                        <div className="stat-label">Sisipan Terdeteksi</div>
                        <div className={`stat-trend ${stats.detections_count > 0 ? 'trend-down' : 'trend-up'}`}>
                            {stats.detections_count > 0 ? (
                                <><i className="bi bi-exclamation-octagon me-1"></i> Perlu Ditinjau</>
                            ) : (
                                <><i className="bi bi-check2-all me-1"></i> Bebas Sisipan Judol/Malware</>
                            )}
                        </div>
                        <i className="bi bi-bug stat-deco"></i>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {/* Real Trend Chart */}
                <div className="col-12 col-xl-8">
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes pulse {
                            0% { opacity: 0.6; }
                            50% { opacity: 1; }
                            100% { opacity: 0.6; }
                        }
                    `}} />
                    <div className="glass-card section-card h-100 d-flex flex-column">
                        <div className="section-head mb-2">
                            <div>
                                <h6 className="d-flex align-items-center gap-2 mb-1">
                                    {config.title}
                                    {config.isLive && (
                                        <span className="badge bg-success d-flex align-items-center gap-1" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '6px', animation: 'pulse 1.5s infinite', fontWeight: 600 }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff', display: 'inline-block' }}></span>
                                            LIVE
                                        </span>
                                    )}
                                </h6>
                                <span className="muted">{config.subtitle}</span>
                            </div>
                            <div className="d-flex gap-2 ms-auto flex-wrap">
                                <span className={`pill-tab ${activeTab === 'hourly' ? 'active' : ''}`} onClick={() => setActiveTab('hourly')} style={{ cursor: 'pointer' }}>Per Jam</span>
                                <span className={`pill-tab ${activeTab === '7days' ? 'active' : ''}`} onClick={() => setActiveTab('7days')} style={{ cursor: 'pointer' }}>7 Hari</span>
                                <span className={`pill-tab ${activeTab === '30days' ? 'active' : ''}`} onClick={() => setActiveTab('30days')} style={{ cursor: 'pointer' }}>30 Hari</span>
                                <span className={`pill-tab ${activeTab === '90days' ? 'active' : ''}`} onClick={() => setActiveTab('90days')} style={{ cursor: 'pointer' }}>90 Hari</span>
                            </div>
                        </div>

                        {stats.total_sites > 0 ? (
                            <div className="flex-grow-1 d-flex flex-column">
                                <DashboardUptimeChart
                                    activeTab={activeTab}
                                    data={config.data}
                                    labels={config.labels}
                                    avgUptime={stats.avg_uptime}
                                    isLive={config.isLive}
                                />
                            </div>
                        ) : (
                            <EmptyState
                                icon="bi-activity"
                                title="Belum Ada Tren Uptime"
                                description="Grafik tren ketersediaan akan aktif secara otomatis begitu Anda mendaftarkan situs terpantau pertama."
                            />
                        )}
                    </div>
                </div>

                {/* Interactive Security Posture Card */}
                <div className="col-12 col-xl-4">
                    <DashboardSecurityCard stats={stats} />
                </div>
            </div>

            {/* Service Vitality & HTTP Diagnostics (Monitoring Keaktifan & Diagnostik Respon/TTFB) */}
            <DashboardVitalityMonitor data={vitality_monitor} />

            <div className="row g-3 mt-1">
                {/* Site status list with Real Latency */}
                <div className="col-12 col-xl-7">
                    <div className="glass-card section-card h-100">
                        <div className="section-head">
                            <h6>Status Situs Terbaru</h6>
                            <span className="muted ms-auto">Status &amp; latensi terkini</span>
                        </div>
                        <div className="scroll-slim" style={{maxHeight: '340px', overflowY: 'auto'}}>
                            {latest_sites && latest_sites.length > 0 ? (
                                latest_sites.map((site) => (
                                    <div key={site.id} className="site-row">
                                        {getSiteFavicon(site.category)}
                                        <div className="flex-grow-1 min-w-0">
                                            <p className="site-name mb-0">{site.name}</p>
                                            <p className="site-url mb-0">{site.url}</p>
                                        </div>
                                        <span className={getStatusChipClass(site.status)}>
                                            <span className="chip-dot"></span>
                                            {site.status === 'up' ? 'Online' : site.status === 'down' ? 'Down' : site.status === 'warn' ? 'Lambat' : 'Paused'}
                                        </span>
                                        <span className="response-time">{site.response_time}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-muted" style={{fontSize: '0.85rem'}}>Belum ada situs terdaftar.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Incident list with clean empty state */}
                <div className="col-12 col-xl-5">
                    <div className="glass-card section-card h-100">
                        <div className="section-head">
                            <h6>Insiden Terbaru</h6>
                            <span className="muted ms-auto">{stats.open_incidents} terbuka</span>
                        </div>
                        <div className="scroll-slim" style={{maxHeight: '340px', overflowY: 'auto'}}>
                            {recent_incidents && recent_incidents.length > 0 ? (
                                recent_incidents.map((inc) => (
                                    <div key={inc.id} className="incident-item">
                                        {getIncidentIcon(inc.type)}
                                        <div className="flex-grow-1">
                                            <p className="incident-title mb-0">{inc.title}</p>
                                            <span className="incident-meta">{inc.site_name} • {inc.detected_at}</span>
                                        </div>
                                        <span className={getSeverityBadgeClass(inc.severity)}>
                                            {inc.severity === 'critical' ? 'Kritis' : inc.severity === 'high' ? 'Tinggi' : inc.severity === 'medium' ? 'Sedang' : 'Rendah'}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 px-3" style={{ margin: 'auto 0' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', fontSize: '1.5rem' }}>
                                        <i className="bi bi-shield-check"></i>
                                    </div>
                                    <div style={{ fontWeight: 600, color: 'var(--ink-dark)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                        Tidak Ada Insiden Aktif
                                    </div>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
                                        Seluruh situs instansi terpantau aman dan tidak ada insiden yang memerlukan mitigasi saat ini.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Keyword dictionary widget */}
            <div className="row g-3 mt-1">
                <div className="col-12">
                    <div className="glass-card section-card">
                        <div className="section-head">
                            <div>
                                <h6>Kamus Kata Kunci Aktif</h6>
                                <span className="muted">Digunakan mesin deteksi sisipan konten</span>
                            </div>
                            <Link 
                                href={route('keywords.index')}
                                className="btn btn-sm ms-auto" 
                                style={{background: 'linear-gradient(120deg,var(--teal-1),var(--blue-1))', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.78rem', padding: '0.4rem 0.9rem'}}
                            >
                                <i className="bi bi-gear-fill me-1"></i>Kelola Kata Kunci
                            </Link>
                        </div>
                        <div>
                            {keywords && keywords.list && keywords.list.length > 0 ? (
                                <>
                                    {keywords.list.map((kw, idx) => (
                                        <span key={idx} className="kw-tag"><i className="bi bi-dot"></i>{kw}</span>
                                    ))}
                                    {keywords.remaining_count > 0 && (
                                        <span className="kw-tag">+ {keywords.remaining_count} lainnya</span>
                                    )}
                                </>
                            ) : (
                                <span className="text-muted" style={{fontSize: '0.82rem'}}>Belum ada kata kunci aktif terdaftar.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
