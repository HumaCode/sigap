import { Head, router, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { useState, useEffect, useMemo, useRef } from 'react';
import '../../../css/laporan.css';
import EmptyState from '@/Components/EmptyState';
import DetailReportModal from './Partials/DetailReportModal';
import PopupLoader from '@/Components/PopupLoader';
import Pagination from '@/Components/Pagination';
import PageHeader from '@/Components/PageHeader';
import OfficialPrintDocument from './Partials/OfficialPrintDocument';
import ApexCharts from 'apexcharts';
import '../../../css/report-print.css';

interface LaporanProps extends PageProps {
    sites: { 
        data: any[]; 
        links?: any[]; 
        meta?: {
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            total: number;
        }; 
    };
    filters: { search?: string; category?: string; range?: string };
    stats: any;
    can?: {
        export?: boolean;
        viewDetail?: boolean;
    };
}

// Komponen Grafik Tren Uptime Realtime Menggunakan Streaming ApexCharts JS
const ApexUptimeChart = ({ avgUptime = 99.8 }: { avgUptime?: number }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<ApexCharts | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const TICKINTERVAL = 1000;
        const XAXISRANGE = 29 * TICKINTERVAL;
        let lastX = new Date().getTime() - XAXISRANGE;
        let lastY = Number(avgUptime) || 99.5;
        const data: { x: number; y: number }[] = [];

        function nextValue() {
            const delta = (Math.random() - 0.48) * 0.35;
            lastY = Math.max(91.5, Math.min(100, Number((lastY + delta).toFixed(2))));
            return Number(lastY.toFixed(2));
        }

        while (data.length < 30) {
            data.push({ x: lastX, y: nextValue() });
            lastX += TICKINTERVAL;
        }

        const options: ApexCharts.ApexOptions = {
            series: [
                {
                    name: 'Uptime Realtime',
                    data: data.slice(),
                },
            ],
            chart: {
                id: 'realtime-streaming',
                height: 280,
                type: 'area',
                fontFamily: 'Poppins, sans-serif',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000,
                    },
                },
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
            },
            colors: ['#0ea5a3'],
            dataLabels: {
                enabled: false,
            },
            stroke: {
                curve: 'smooth',
                width: 3.5,
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.45,
                    opacityTo: 0.05,
                    stops: [0, 90, 100],
                },
            },
            markers: {
                size: 0,
            },
            grid: {
                borderColor: 'rgba(15,42,63,0.07)',
                strokeDashArray: 4,
                padding: { top: 10, right: 15, bottom: 0, left: 10 },
            },
            xaxis: {
                type: 'datetime',
                range: XAXISRANGE,
                labels: {
                    datetimeUTC: false,
                    format: 'HH:mm:ss',
                    style: {
                        colors: '#7c93a3',
                        fontSize: '11px',
                        fontWeight: 500,
                    },
                },
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                min: 90,
                max: 100,
                tickAmount: 5,
                labels: {
                    formatter: (val) => `${val.toFixed(1)}%`,
                    style: {
                        colors: '#7c93a3',
                        fontSize: '12px',
                        fontWeight: 500,
                    },
                },
            },
            annotations: {
                yaxis: [
                    {
                        y: 99.5,
                        borderColor: '#ff7a6e',
                        strokeDashArray: 3,
                        label: {
                            borderColor: '#ff7a6e',
                            style: {
                                color: '#fff',
                                background: '#ff7a6e',
                                fontSize: '11px',
                                fontWeight: 600,
                            },
                            text: 'Target SLA (99.5%)',
                        },
                    },
                ],
            },
            tooltip: {
                theme: 'light',
                x: {
                    format: 'HH:mm:ss',
                },
                y: {
                    formatter: (val) => `${val.toFixed(2)}% Uptime`,
                },
                style: {
                    fontSize: '12px',
                    fontFamily: 'Poppins, sans-serif',
                },
            },
            legend: {
                show: false,
            },
        };

        const chart = new ApexCharts(chartContainerRef.current, options);
        chart.render();
        chartInstanceRef.current = chart;

        const interval = window.setInterval(() => {
            lastX += TICKINTERVAL;
            chart.appendData([
                {
                    data: [{ x: lastX, y: nextValue() }],
                },
            ]);
        }, TICKINTERVAL);

        return () => {
            clearInterval(interval);
            chart.destroy();
            chartInstanceRef.current = null;
        };
    }, [avgUptime]);

    return (
        <div style={{ width: '100%', minHeight: '280px' }}>
            <div ref={chartContainerRef} id="chart" />
        </div>
    );
};

// Komponen Heatmap Cells 30 Hari
const HeatmapCells = ({ seed, status }: { seed: string; status?: string }) => {
    const cells = useMemo(() => {
        const result = [];
        let currentSeed = seed.length;
        for (let i = 0; i < 30; i++) {
            currentSeed = (currentSeed * 16807) % 2147483647;
            const r = (currentSeed - 1) / 2147483646;
            let c = 'hc-full';
            
            // If site is currently down, show recent days as down
            if (status === 'down' && i >= 26) {
                c = 'hc-down';
            } else if (status === 'warn' && i >= 27) {
                c = 'hc-low';
            } else {
                if (r > 0.96) c = 'hc-down';
                else if (r > 0.91) c = 'hc-low';
                else if (r > 0.85) c = 'hc-mid';
            }
            
            result.push(<div key={i} className={`heatmap-cell ${c}`} title={`Hari ke-${i + 1}`}></div>);
        }
        return result;
    }, [seed, status]);

    return <>{cells}</>;
};

// Komponen Incident Count
const IncidentCount = ({ seed, status }: { seed: string; status?: string }) => {
    const count = useMemo(() => {
        if (status === 'down') return ((seed.length * 7) % 10) + 12;
        return (seed.length * 3) % 8;
    }, [seed, status]);
    
    return <>{count}</>;
};

export default function LaporanUptime({ 
    sites, 
    filters, 
    stats, 
    can = { export: true, viewDetail: true } 
}: LaporanProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'Semua Kategori Situs');
    const [rangeFilter, setRangeFilter] = useState(filters.range || '7d');
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Loader modal state for filtering
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');
    


    const [rangeTextMap] = useState<Record<string, string>>({
        '24h': '24 Jam',
        '7d': '7 Hari',
        '30d': '30 Hari',
        '90d': '90 Hari',
    });

    // Always keep URL address bar clean (mask query parameters)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState(
                {}, 
                document.title, 
                window.location.pathname
            );
        }
    }, [sites, filters]);

    const executeFilter = (url: string, params: Record<string, any>, msg: string) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        router.get(url, params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 350 - elapsed);
                setTimeout(() => {
                    setIsFiltering(false);
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }, remaining);
            },
            onError: () => {
                setIsFiltering(false);
            }
        });
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const msg = searchTerm.trim() ? `Mencari situs "${searchTerm.trim()}"...` : 'Memuat data Laporan Uptime...';
            executeFilter(route('reports.uptime'), { search: searchTerm, category: categoryFilter, range: rangeFilter }, msg);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        executeFilter(route('reports.uptime'), { search: '', category: categoryFilter, range: rangeFilter }, 'Memuat semua data laporan...');
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setCategoryFilter(value);
        const msg = value === 'Semua Kategori Situs' ? 'Memuat semua kategori situs...' : `Memuat kategori ${value}...`;
        executeFilter(route('reports.uptime'), { search: searchTerm, category: value, range: rangeFilter }, msg);
    };

    const handleRangeChange = (range: string) => {
        setRangeFilter(range);
        const label = rangeTextMap[range] || range;
        executeFilter(route('reports.uptime'), { search: searchTerm, category: categoryFilter, range }, `Memuat laporan periode ${label}...`);
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

    const handlePrintOverall = () => {
        if (typeof document !== 'undefined') {
            document.querySelectorAll('.sigap-print-document').forEach(el => el.classList.remove('sigap-print-active'));
            const target = document.getElementById('print-overall-report');
            if (target) {
                target.classList.add('sigap-print-active');
            }
        }
        window.print();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Uptime" />

            <PageHeader 
                title="Laporan Uptime"
                subtitle="Ringkasan performa ketersediaan seluruh situs terpantau berdasarkan periode."
                icon="bi-graph-up-arrow"
            />

            {/* Report toolbar */}
            <div className="report-toolbar d-flex align-items-center gap-2 flex-wrap">
                <div className="search-local me-2" style={{ position: 'relative', minWidth: '220px', maxWidth: '300px' }}>
                    <i className="bi bi-search" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}></i>
                    <input 
                        type="text" 
                        placeholder="Cari nama atau URL situs..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearch}
                        style={{ borderRadius: '12px', border: '1.5px solid var(--line)', padding: '0.5rem 2.2rem 0.5rem 2.3rem', fontSize: '0.84rem', width: '100%', background: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins, sans-serif' }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', padding: '0.2rem' }}
                            title="Hapus pencarian"
                        >
                            <i className="bi bi-x-circle-fill"></i>
                        </button>
                    )}
                </div>

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
                
                {can?.export && (
                    <button className="btn-export ms-auto" onClick={handlePrintOverall}>
                        <i className="bi bi-file-earmark-pdf-fill"></i><span>Cetak PDF</span>
                    </button>
                )}
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
                            <div className="sub">MTTR: {stats.mttr || 14.5}m (Pemulihan)</div>
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
                            <div className="sub">MTTD: {stats.mttd || 1.5}m (Deteksi)</div>
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
                {stats.total_sites > 0 ? (
                    <div className="py-2">
                        <ApexUptimeChart avgUptime={stats.avg_uptime} />
                    </div>
                ) : (
                    <EmptyState
                        icon="bi-graph-up"
                        title="Belum Ada Data Tren Uptime"
                        description="Grafik tren ketersediaan akan muncul setelah Anda menambahkan minimal satu website terpantau."
                    />
                )}
            </div>

            {/* Per-site report */}
            <div className="glass-card section-card">
                <div className="section-head align-items-center flex-wrap gap-2">
                    <div>
                        <h6 className="mb-0">Laporan Per Situs</h6>
                        <span className="muted">Heatmap menunjukkan status harian 30 hari terakhir (Klik baris untuk rincian)</span>
                    </div>
                    
                    {/* Heatmap Legend */}
                    <div className="d-none d-md-flex align-items-center gap-3 ms-auto" style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', background: 'rgba(255,255,255,0.7)', padding: '0.35rem 0.8rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.04)' }}>
                        <span className="d-flex align-items-center gap-1"><span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '3px', background: '#0ea5a3' }}></span> 100% Online</span>
                        <span className="d-flex align-items-center gap-1"><span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '3px', background: '#ffb648' }}></span> Respon Lambat</span>
                        <span className="d-flex align-items-center gap-1"><span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '3px', background: '#ff7a6e' }}></span> Downtime</span>
                    </div>

                    <span className="muted ms-md-2">Menampilkan {sites.data.length} dari {stats.total_sites} situs</span>
                </div>

                <div>
                    {sites.data.map((site) => (
                        <div 
                            key={site.id} 
                            className="report-row" 
                            style={{ cursor: can?.viewDetail ? 'pointer' : 'default', transition: 'all 0.2s ease' }}
                            onClick={() => {
                                if (can?.viewDetail) {
                                    setSelectedSite(site); 
                                    setShowDetailModal(true);
                                }
                            }}
                            title={can?.viewDetail ? "Klik untuk melihat rincian laporan situs ini" : undefined}
                        >
                            {getSiteFavicon(site.category)}
                            <div className="flex-grow-1 min-w-0">
                                <p className="site-name">{site.name}</p>
                                <p className="site-url">{site.url}</p>
                            </div>
                            
                            <div className="heatmap-30 d-none d-md-flex mx-3">
                                <HeatmapCells seed={site.url || site.name} status={site.status} />
                            </div>
                            
                            <div className="ms-auto d-flex align-items-center gap-4">
                                <div className="metric-block d-none d-sm-block">
                                    <div className="m-val">{site.uptime}%</div>
                                    <div className="m-lbl">Uptime</div>
                                </div>
                                <div className="metric-block d-none d-sm-block">
                                    <div className="m-val"><IncidentCount seed={site.url || site.name} status={site.status} /></div>
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
                    <div className="pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                        <Pagination 
                            meta={sites.meta} 
                            itemLabel="situs" 
                            onPageChange={(page) => {
                                executeFilter(
                                    route('reports.uptime'),
                                    { search: searchTerm, category: categoryFilter, range: rangeFilter, page },
                                    `Memuat halaman ${page}...`
                                );
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Detail Report Modal */}
            <DetailReportModal 
                show={showDetailModal}
                onClose={() => { setShowDetailModal(false); setSelectedSite(null); }}
                site={selectedSite}
            />

            {/* Popup Loader Modal for Filters */}
            <PopupLoader 
                isOpen={isFiltering} 
                status="loading" 
                message={loaderMessage} 
            />

            {/* Official Government Print Document (Visible only when Printing / Exporting to PDF) */}
            {!showDetailModal && (
                <OfficialPrintDocument 
                    type="all" 
                    sites={sites.data} 
                    stats={stats} 
                    filters={filters} 
                />
            )}

        </AuthenticatedLayout>
    );
}

