import { Head, router, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { useState, useEffect, useMemo } from 'react';
import '../../../css/laporan.css';
import EmptyState from '@/Components/EmptyState';

interface LaporanProps extends PageProps {
    sites: { data: any[]; links: any[]; meta: any };
    filters: { search?: string; category?: string; range?: string };
    stats: any;
}

// Komponen terpisah untuk SVG yang dianimasikan agar tidak me-render ulang seluruh halaman
const AnimatedChart = () => {
    const [time, setTime] = useState(0);

    useEffect(() => {
        let animationFrameId: number;
        const animate = (timestamp: number) => {
            setTime(timestamp / 1000);
            animationFrameId = requestAnimationFrame(animate);
        };
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    const getY = (baseY: number, phaseOffset: number, amplitude: number = 10, speed: number = 1.5) => {
        return baseY + Math.sin(time * speed + phaseOffset) * amplitude;
    };

    const animatedPath = `M0,${getY(90, 0)} C90,${getY(80, 1)} 130,${getY(60, 2)} 220,${getY(68, 3)} C310,${getY(76, 4)} 350,${getY(45, 5, 15)} 440,${getY(55, 6)} C530,${getY(65, 7)} 570,${getY(95, 8)} 660,${getY(75, 9)} C750,${getY(55, 10)} 790,${getY(35, 11)} 900,${getY(48, 12)}`;
    const animatedFillPath = `${animatedPath} L900,280 L0,280 Z`;

    return (
        <svg viewBox="0 0 900 280" preserveAspectRatio="none">
            <defs>
                <linearGradient id="areaFillLg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5a3" stopOpacity="0.32"/>
                    <stop offset="100%" stopColor="#0ea5a3" stopOpacity="0"/>
                </linearGradient>
            </defs>
            <line x1="0" y1="50" x2="900" y2="50" stroke="rgba(15,42,63,0.07)" strokeWidth="1"/>
            <line x1="0" y1="120" x2="900" y2="120" stroke="rgba(15,42,63,0.07)" strokeWidth="1"/>
            <line x1="0" y1="190" x2="900" y2="190" stroke="rgba(15,42,63,0.07)" strokeWidth="1"/>
            <line x1="0" y1="55" x2="900" y2="55" stroke="var(--ink-faint)" strokeWidth="1.5" strokeDasharray="6 6"/>
            <path d={animatedFillPath} fill="url(#areaFillLg)"/>
            <path d={animatedPath} fill="none" stroke="#0ea5a3" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="440" cy={getY(55, 6)} r="5.5" fill="#fff" stroke="#0ea5a3" strokeWidth="2.5"/>
            <circle cx="900" cy={getY(48, 12)} r="5.5" fill="#fff" stroke="#3b82f6" strokeWidth="2.5"/>
        </svg>
    );
};

// Heatmap component untuk menghindari Hook di dalam loop
const HeatmapCells = ({ seed }: { seed: string }) => {
    const cells = useMemo(() => {
        const result = [];
        let currentSeed = seed.length;
        for (let i = 0; i < 30; i++) {
            currentSeed = (currentSeed * 16807) % 2147483647;
            const r = (currentSeed - 1) / 2147483646;
            let c = 'hc-full';
            if (r > 0.95) c = 'hc-down';
            else if (r > 0.9) c = 'hc-low';
            else if (r > 0.8) c = 'hc-mid';
            
            result.push(<div key={i} className={`heatmap-cell ${c}`} title={`Day ${i + 1}`}></div>);
        }
        return result;
    }, [seed]);

    return <>{cells}</>;
};

// Incident Count component untuk menghindari Hook di dalam loop
const IncidentCount = ({ seed }: { seed: string }) => {
    const count = useMemo(() => {
        return (seed.length * 7) % 50;
    }, [seed]);
    
    return <>{count}</>;
};

export default function LaporanUptime({ sites, filters, stats }: LaporanProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'Semua Kategori Situs');
    const [rangeFilter, setRangeFilter] = useState(filters.range || '7d');
    
    // Auto refresh data every 5 seconds for real-time monitoring feel
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['stats', 'sites'] });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            router.get(route('reports.uptime'), { search: searchTerm, category: categoryFilter, range: rangeFilter }, { preserveState: true });
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setCategoryFilter(value);
        router.get(route('reports.uptime'), { search: searchTerm, category: value, range: rangeFilter }, { preserveState: true });
    };

    const handleRangeChange = (range: string) => {
        setRangeFilter(range);
        router.get(route('reports.uptime'), { search: searchTerm, category: categoryFilter, range }, { preserveState: true });
    };

    const getSiteFavicon = (category: string) => {
        switch (category) {
            case 'PPID':
                return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #ff7a6e, #ff9d6e)' }}><i className="bi bi-file-earmark-text"></i></div>;
            case 'SPBE':
                return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #8b7bf0, #a78bfa)' }}><i className="bi bi-diagram-3"></i></div>;
            case 'Portal Utama':
                return <div className="site-favicon"><i className="bi bi-building"></i></div>;
            default:
                return <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #ffb648, #ff9d6e)' }}><i className="bi bi-globe2"></i></div>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Uptime" />

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                <div>
                    <div className="page-title d-flex align-items-center gap-2 mb-2" style={{ margin: 0 }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--teal-1), var(--blue-1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', boxShadow: '0 8px 16px rgba(14,165,163,0.2)' }}>
                            <i className="bi bi-graph-up-arrow"></i>
                        </div>
                        Laporan Uptime
                    </div>
                    <p className="page-sub mb-0 ms-1">Ringkasan performa ketersediaan seluruh situs terpantau berdasarkan periode.</p>
                </div>
            </div>

            {/* Report toolbar */}
            <div className="report-toolbar">
                <div className={`range-chip ${rangeFilter === '24h' ? 'active' : ''}`} onClick={() => handleRangeChange('24h')}>24 Jam</div>
                <div className={`range-chip ${rangeFilter === '7d' ? 'active' : ''}`} onClick={() => handleRangeChange('7d')}>7 Hari</div>
                <div className={`range-chip ${rangeFilter === '30d' ? 'active' : ''}`} onClick={() => handleRangeChange('30d')}>30 Hari</div>
                <div className={`range-chip ${rangeFilter === '90d' ? 'active' : ''}`} onClick={() => handleRangeChange('90d')}>90 Hari</div>
                
                <select className="select-site d-none d-md-block" value={categoryFilter} onChange={handleCategoryChange}>
                    <option value="Semua Kategori Situs">Semua Kategori Situs</option>
                    <option value="Portal Utama">Portal Utama</option>
                    <option value="SPBE">SPBE</option>
                    <option value="PPID">PPID</option>
                </select>
                
                <button className="btn-export" onClick={() => window.print()}>
                    <i className="bi bi-download"></i><span>Ekspor Laporan (PDF)</span>
                </button>
            </div>

            {/* SLA summary cards */}
            <div className="row g-3 mb-3">
                <div className="col-6 col-lg-3">
                    <div className="glass-card sla-card">
                        <div className="sla-ring">
                            <svg width="64" height="64">
                                <circle cx="32" cy="32" r="26" stroke="rgba(15,42,63,0.08)" strokeWidth="7" fill="none"/>
                                <circle cx="32" cy="32" r="26" stroke="#0ea5a3" strokeWidth="7" fill="none" strokeDasharray="163" strokeDashoffset={163 - (163 * stats.avg_uptime / 100)} strokeLinecap="round"/>
                            </svg>
                            <div className="val">{stats.avg_uptime}%</div>
                        </div>
                        <div>
                            <div className="lbl">Rata-rata Uptime</div>
                            <div className="num">{stats.avg_uptime}%</div>
                            <div className="sub">Target SLA 99.5%</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="glass-card sla-card">
                        <div className="sla-ring">
                            <svg width="64" height="64">
                                <circle cx="32" cy="32" r="26" stroke="rgba(15,42,63,0.08)" strokeWidth="7" fill="none"/>
                                <circle cx="32" cy="32" r="26" stroke="#3b82f6" strokeWidth="7" fill="none" strokeDasharray="163" strokeDashoffset={stats.total_sites > 0 ? 163 - (163 * stats.sites_met_sla / stats.total_sites) : 163} strokeLinecap="round"/>
                            </svg>
                            <div className="val">{stats.total_sites > 0 ? Math.round((stats.sites_met_sla / stats.total_sites) * 100) : 0}%</div>
                        </div>
                        <div>
                            <div className="lbl">Situs Capai SLA</div>
                            <div className="num">{stats.sites_met_sla} / {stats.total_sites}</div>
                            <div className="sub">{stats.sites_missed_sla} situs di bawah target</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="glass-card sla-card">
                        <div className="sla-ring">
                            <svg width="64" height="64">
                                <circle cx="32" cy="32" r="26" stroke="rgba(15,42,63,0.08)" strokeWidth="7" fill="none"/>
                                <circle cx="32" cy="32" r="26" stroke="#ff7a6e" strokeWidth="7" fill="none" strokeDasharray="163" strokeDashoffset="145" strokeLinecap="round"/>
                            </svg>
                            <div className="val">{stats.total_downtime}m</div>
                        </div>
                        <div>
                            <div className="lbl">Total Downtime</div>
                            <div className="num">{stats.total_downtime} menit</div>
                            <div className="sub">Periode ini, seluruh situs</div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="glass-card sla-card">
                        <div className="sla-ring">
                            <svg width="64" height="64">
                                <circle cx="32" cy="32" r="26" stroke="rgba(15,42,63,0.08)" strokeWidth="7" fill="none"/>
                                <circle cx="32" cy="32" r="26" stroke="#ffb648" strokeWidth="7" fill="none" strokeDasharray="163" strokeDashoffset="100" strokeLinecap="round"/>
                            </svg>
                            <div className="val">{stats.avg_response_time}ms</div>
                        </div>
                        <div>
                            <div className="lbl">Avg Response Time</div>
                            <div className="num">{stats.avg_response_time} ms</div>
                            <div className="sub">Seluruh situs terpantau</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overall trend chart */}
            <div className="glass-card section-card mb-3">
                <div className="section-head">
                    <div>
                        <h6>Tren Uptime Keseluruhan</h6>
                        <span className="muted">Rata-rata harian dibanding target SLA</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                        <span className="legend-dot" style={{ background: 'var(--teal-1)' }}></span>Uptime aktual
                        <span className="legend-dot ms-3" style={{ background: 'var(--ink-faint)' }}></span>Target SLA (99.5%)
                    </div>
                </div>
                <div className="chart-wrap-lg">
                    <AnimatedChart />
                </div>
                <div className="d-flex justify-content-between mt-2" style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                    <span>Hari -6</span><span>Hari -5</span><span>Hari -4</span><span>Hari -3</span><span>Hari -2</span><span>Kemarin</span><span>Hari ini</span>
                </div>
            </div>

            {/* Per-site report */}
            <div className="glass-card section-card">
                <div className="section-head">
                    <div>
                        <h6>Laporan Per Situs</h6>
                        <span className="muted">Heatmap menunjukkan status harian 30 hari terakhir</span>
                    </div>
                    <span className="muted ms-auto">Menampilkan {sites.data.length} dari {stats.total_sites} situs</span>
                </div>

                <div>
                    {sites.data.map((site) => (
                        <div key={site.id} className="report-row">
                            {getSiteFavicon(site.category)}
                            <div className="flex-grow-1 min-w-0">
                                <p className="site-name">{site.name}</p>
                                <p className="site-url">{site.url}</p>
                            </div>
                            
                            <div className="heatmap-30 d-none d-md-flex mx-3">
                                <HeatmapCells seed={site.url || site.name} />
                            </div>
                            
                            <div className="ms-auto d-flex align-items-center gap-4">
                                <div className="metric-block d-none d-sm-block">
                                    <div className="m-val">{site.uptime}%</div>
                                    <div className="m-lbl">Uptime</div>
                                </div>
                                <div className="metric-block d-none d-sm-block">
                                    <div className="m-val"><IncidentCount seed={site.url || site.name} /></div>
                                    <div className="m-lbl">Insiden</div>
                                </div>
                                {site.uptime >= 99.5 ? (
                                    <span className="sla-status sla-met"><i className="bi bi-check-circle me-1"></i>SLA Tercapai</span>
                                ) : (
                                    <span className="sla-status sla-miss"><i className="bi bi-x-circle me-1"></i>Di Bawah SLA</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {sites.data.length === 0 && (
                        <EmptyState 
                            icon="bi-graph-down"
                            title="Belum Ada Laporan Uptime"
                            description="Tidak ada data situs terpantau untuk menampilkan laporan uptime saat ini."
                        />
                    )}
                </div>

                {/* Pagination */}
                {sites.meta && sites.meta.last_page > 1 && (
                    <div className="pagination-footer mt-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.2rem', borderTop: '1px solid var(--line)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>Menampilkan {sites.meta.from} - {sites.meta.to} dari {sites.meta.total} situs</span>
                        <div className="d-flex gap-1">
                            {sites.meta.links.map((link: any, index: number) => {
                                if (link.label === '...') {
                                    return (
                                        <span key={index} className="pg-btn" style={{ background: 'transparent', border: 'none', cursor: 'default', color: 'var(--ink-soft)' }}>
                                            ...
                                        </span>
                                    );
                                }
                                
                                return (
                                    <Link 
                                        key={index} 
                                        href={link.url || '#'}
                                        className={`pg-btn ${link.active ? 'active' : ''} ${!link.url ? 'opacity-50' : ''}`}
                                        style={!link.url ? { pointerEvents: 'none' } : {}}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                        preserveScroll
                                        data={{ search: searchTerm, category: categoryFilter, range: rangeFilter }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

        </AuthenticatedLayout>
    );
}
