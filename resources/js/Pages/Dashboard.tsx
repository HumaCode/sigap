import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import '../../css/dashboard.css';
import { PageProps } from '@/types';
import { Link } from '@inertiajs/react';

interface DashboardProps {
    stats: {
        total_sites: number;
        avg_uptime: number;
        open_incidents: number;
        critical_incidents: number;
        detections_count: number;
        pct_secure: number;
        clean_sec_count: number;
        exposed_env_count: number;
        missing_csp_count: number;
        expiring_ssl_count: number;
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
}

export default function Dashboard({ stats, latest_sites, recent_incidents, keywords }: DashboardProps) {
    const user = usePage<PageProps>().props.auth.user;
    const [currentTime, setCurrentTime] = useState(new Date());

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

            <div className="d-flex justify-content-between align-items-center mb-4">
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

            {/* Stat cards */}
            <div className="row g-3 mb-3">
                <div className="col-6 col-xl-3">
                    <div className="glass-card stat-card">
                        <div className="stat-icon icon-teal"><i className="bi bi-hdd-network"></i></div>
                        <div className="stat-value">{stats.total_sites}</div>
                        <div className="stat-label">Situs Terpantau</div>
                        <div className="stat-trend trend-up"><i className="bi bi-arrow-up-short"></i> Total terdaftar</div>
                        <i className="bi bi-hdd-network stat-deco"></i>
                    </div>
                </div>
                <div className="col-6 col-xl-3">
                    <div className="glass-card stat-card">
                        <div className="stat-icon icon-blue"><i className="bi bi-check-circle"></i></div>
                        <div className="stat-value">{stats.avg_uptime}%</div>
                        <div className="stat-label">Rata-rata Uptime</div>
                        <div className="stat-trend trend-up"><i className="bi bi-arrow-up-short"></i> Berdasarkan status saat ini</div>
                        <i className="bi bi-check-circle stat-deco"></i>
                    </div>
                </div>
                <div className="col-6 col-xl-3">
                    <div className="glass-card stat-card">
                        <div className="stat-icon icon-coral"><i className="bi bi-exclamation-triangle"></i></div>
                        <div className="stat-value">{stats.open_incidents}</div>
                        <div className="stat-label">Insiden Terbuka</div>
                        <div className="stat-trend trend-down"><i className="bi bi-arrow-up-short"></i> {stats.critical_incidents} kritis</div>
                        <i className="bi bi-exclamation-triangle stat-deco"></i>
                    </div>
                </div>
                <div className="col-6 col-xl-3">
                    <div className="glass-card stat-card">
                        <div className="stat-icon icon-violet"><i className="bi bi-bug"></i></div>
                        <div className="stat-value">{stats.detections_count}</div>
                        <div className="stat-label">Sisipan Terdeteksi</div>
                        <div className="stat-trend trend-down"><i className="bi bi-arrow-up-short"></i> Log total</div>
                        <i className="bi bi-bug stat-deco"></i>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {/* Chart */}
                <div className="col-12 col-xl-8">
                    <div className="glass-card section-card h-100">
                        <div className="section-head">
                            <div>
                                <h6>Tren Uptime 7 Hari Terakhir</h6>
                                <span className="muted">Rata-rata seluruh situs terpantau</span>
                            </div>
                            <div className="d-flex gap-2 ms-auto">
                                <span className="pill-tab active">7 Hari</span>
                                <span className="pill-tab">30 Hari</span>
                                <span className="pill-tab">90 Hari</span>
                            </div>
                        </div>
                        <div className="chart-wrap">
                            <svg viewBox="0 0 700 230" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0ea5a3" stopOpacity="0.35"/>
                                        <stop offset="100%" stopColor="#0ea5a3" stopOpacity="0"/>
                                    </linearGradient>
                                </defs>
                                <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(15,42,63,0.08)" strokeWidth="1"/>
                                <line x1="0" y1="95" x2="700" y2="95" stroke="rgba(15,42,63,0.08)" strokeWidth="1"/>
                                <line x1="0" y1="150" x2="700" y2="150" stroke="rgba(15,42,63,0.08)" strokeWidth="1"/>
                                <path d="M0,120 C60,110 100,60 160,70 C220,80 260,40 320,50 C380,60 420,90 480,75 C540,60 580,30 640,45 C670,52 690,55 700,50 L700,230 L0,230 Z" fill="url(#areaFill)"/>
                                <path d="M0,120 C60,110 100,60 160,70 C220,80 260,40 320,50 C380,60 420,90 480,75 C540,60 580,30 640,45 C670,52 690,55 700,50" fill="none" stroke="#0ea5a3" strokeWidth="3" strokeLinecap="round"/>
                                <circle cx="320" cy="50" r="5" fill="#fff" stroke="#0ea5a3" strokeWidth="2.5"/>
                                <circle cx="640" cy="45" r="5" fill="#fff" stroke="#3b82f6" strokeWidth="2.5"/>
                            </svg>
                        </div>
                        <div className="d-flex justify-content-between mt-2" style={{fontSize: '0.72rem', color: 'var(--ink-faint)'}}>
                            <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Ming</span>
                        </div>
                    </div>
                </div>

                {/* Ring summary */}
                <div className="col-12 col-xl-4">
                    <div className="glass-card section-card h-100">
                        <div className="section-head"><h6>Status Keamanan</h6></div>
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="ring-mini">
                                <svg width="64" height="64">
                                    <circle cx="32" cy="32" r="26" stroke="rgba(15,42,63,0.08)" strokeWidth="7" fill="none"/>
                                    <circle cx="32" cy="32" r="26" stroke="#0ea5a3" strokeWidth="7" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"/>
                                </svg>
                                <div className="ring-val">{stats.pct_secure}%</div>
                            </div>
                            <div>
                                <div style={{fontWeight: 600, fontSize: '0.9rem'}}>Situs Aman</div>
                                <div style={{fontSize: '0.78rem', color: 'var(--ink-soft)'}}>{stats.clean_sec_count} dari {stats.total_sites} situs tanpa temuan</div>
                            </div>
                        </div>
                        <hr style={{borderColor: 'var(--line)', margin: '0.9rem 0'}} />
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span style={{fontSize: '0.82rem'}}><i className="bi bi-file-earmark-lock2 me-1" style={{color: 'var(--coral)'}}></i>File .env terekspos</span>
                            <span className="fw-semibold" style={{fontSize: '0.82rem'}}>{stats.exposed_env_count}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span style={{fontSize: '0.82rem'}}><i className="bi bi-shield-x me-1" style={{color: 'var(--sun)'}}></i>Header CSP hilang</span>
                            <span className="fw-semibold" style={{fontSize: '0.82rem'}}>{stats.missing_csp_count}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span style={{fontSize: '0.82rem'}}><i className="bi bi-clock-history me-1" style={{color: 'var(--blue-1)'}}></i>SSL akan kedaluwarsa / fail</span>
                            <span className="fw-semibold" style={{fontSize: '0.82rem'}}>{stats.expiring_ssl_count}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3 mt-1">
                {/* Site status list */}
                <div className="col-12 col-xl-7">
                    <div className="glass-card section-card h-100">
                        <div className="section-head">
                            <h6>Status Situs Terbaru</h6>
                            <span className="muted ms-auto">Status terkini</span>
                        </div>
                        <div className="scroll-slim" style={{maxHeight: '340px', overflowY: 'auto'}}>
                            {latest_sites && latest_sites.length > 0 ? (
                                latest_sites.map((site) => (
                                    <div key={site.id} className="site-row">
                                        {getSiteFavicon(site.category)}
                                        <div className="flex-grow-1 min-w-0">
                                            <p className="site-name">{site.name}</p>
                                            <p className="site-url">{site.url}</p>
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

                {/* Incident list */}
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
                                            <p className="incident-title">{inc.title}</p>
                                            <span className="incident-meta">{inc.site_name} • {inc.detected_at}</span>
                                        </div>
                                        <span className={getSeverityBadgeClass(inc.severity)}>
                                            {inc.severity === 'critical' ? 'Kritis' : inc.severity === 'high' ? 'Tinggi' : inc.severity === 'medium' ? 'Sedang' : 'Rendah'}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-muted" style={{fontSize: '0.85rem'}}>Tidak ada insiden terbuka aktif.</div>
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
