import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PageHeader from '@/Components/PageHeader';
import ApexCharts from 'apexcharts';

interface StatisticsProps extends PageProps {
    telemetry: {
        defcon_level: string;
        defcon_status: string;
        defcon_type: string;
        defcon_color: string;
        anomalies_count: number;
        critical_count: number;
        active_incidents: number;
        resolved_incidents: number;
        total_detection_logs: number;
        latest_scanned_domain: string;
        radar_blips: Array<{
            name: string;
            domain: string;
            ping: string;
        }>;
    };
    inventory: {
        total: number;
        up: number;
        warn: number;
        down: number;
        paused: number;
        avg_uptime: number;
        sla_target: number;
        sla_status: string;
    };
    security: {
        pct_secure: number;
        clean_count: number;
        audited_count: number;
        exposed_env: number;
        missing_csp: number;
        expiring_ssl: number;
        xframe_warn: number;
    };
    categories: Array<{
        name: string;
        total: number;
        up: number;
        uptime_pct: number;
    }>;
    incidents_by_severity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    charts: {
        daily: {
            labels: string[];
            data: number[];
        };
        hourly_latency: {
            labels: string[];
            data: number[];
        };
    };
}

export default function StatisticsIndex({
    telemetry,
    inventory,
    security,
    categories = [],
    incidents_by_severity,
    charts,
}: StatisticsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'clusters' | 'incidents'>('overview');
    const chartUptimeRef = React.useRef<HTMLDivElement>(null);
    const chartDonutRef = React.useRef<HTMLDivElement>(null);

    // Initialize ApexCharts for 30-Day Aggregate Trend
    React.useEffect(() => {
        if (!chartUptimeRef.current) return;

        const optionsUptime: ApexCharts.ApexOptions = {
            series: [
                {
                    name: 'Ketersediaan Agregat',
                    data: charts.daily.data,
                },
            ],
            chart: {
                height: 280,
                type: 'area',
                fontFamily: 'Poppins, sans-serif',
                toolbar: { show: false },
                zoom: { enabled: false },
                dropShadow: {
                    enabled: true,
                    top: 3,
                    left: 0,
                    blur: 4,
                    color: '#0ea5a3',
                    opacity: 0.15,
                },
            },
            dataLabels: {
                enabled: false,
            },
            colors: ['#0ea5a3'],
            stroke: { curve: 'smooth', width: 3 },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.02,
                    stops: [0, 90, 100],
                },
            },
            markers: {
                size: 3.5,
                colors: ['#ffffff'],
                strokeColors: '#0ea5a3',
                strokeWidth: 2,
            },
            grid: {
                borderColor: 'rgba(15, 42, 63, 0.06)',
                strokeDashArray: 4,
            },
            xaxis: {
                categories: charts.daily.labels,
                labels: {
                    style: { colors: '#7c93a3', fontSize: '11px', fontWeight: 500 },
                    rotate: -35,
                },
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                min: (min: number) => (min < 90 ? Math.max(0, Math.floor(min - 5)) : 90),
                max: 100,
                tickAmount: 4,
                labels: {
                    formatter: (val: number) => `${val.toFixed(0)}%`,
                    style: { colors: '#7c93a3', fontSize: '11px' },
                },
            },
            annotations: {
                yaxis: [
                    {
                        y: 99.5,
                        borderColor: '#10b981',
                        strokeDashArray: 4,
                        label: {
                            borderColor: '#10b981',
                            style: { color: '#ffffff', background: '#059669', fontSize: '10px', fontWeight: 600 },
                            text: 'Target SLA 99.5%',
                        },
                    },
                ],
            },
            tooltip: {
                theme: 'light',
                y: { formatter: (val: number) => `${val.toFixed(2)}% Uptime Agregat` },
            },
        };

        const chartUptime = new ApexCharts(chartUptimeRef.current, optionsUptime);
        chartUptime.render();

        return () => {
            chartUptime.destroy();
        };
    }, [charts.daily]);

    // Initialize ApexCharts for Category / Status Donut
    React.useEffect(() => {
        if (!chartDonutRef.current) return;

        const seriesData = [
            inventory.up,
            inventory.warn,
            inventory.down,
            inventory.paused,
        ];

        const optionsDonut: ApexCharts.ApexOptions = {
            series: seriesData,
            labels: ['Aktif Normal', 'Perlu Atensi', 'Gangguan', 'Pemeliharaan'],
            chart: {
                height: 280,
                type: 'donut',
                fontFamily: 'Poppins, sans-serif',
            },
            colors: ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
            dataLabels: { enabled: false },
            legend: {
                position: 'bottom',
                fontSize: '12px',
                fontWeight: 600,
                labels: { colors: '#0f2a3f' },
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '72%',
                        labels: {
                            show: true,
                            name: { fontSize: '12px', color: '#7c93a3' },
                            value: { fontSize: '20px', fontWeight: 800, color: '#0f2a3f' },
                            total: {
                                show: true,
                                label: 'Total Domain',
                                color: '#7c93a3',
                                formatter: () => `${inventory.total}`,
                            },
                        },
                    },
                },
            },
        };

        const chartDonut = new ApexCharts(chartDonutRef.current, optionsDonut);
        chartDonut.render();

        return () => {
            chartDonut.destroy();
        };
    }, [inventory]);

    return (
        <AuthenticatedLayout header="Statistik &amp; Telemetri Layanan">
            <Head title="Statistik &amp; Telemetri Layanan - SIGAP" />

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes radarSpinSlow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes radarBlipPulse {
                    0% { transform: scale(0.9); opacity: 0.6; }
                    50% { transform: scale(1.3); opacity: 1; }
                    100% { transform: scale(0.9); opacity: 0.6; }
                }
                .radar-sweep-beam {
                    background: conic-gradient(from 0deg, rgba(14, 165, 163, 0.35) 0deg, rgba(14, 165, 163, 0.05) 60deg, transparent 70deg);
                    animation: radarSpinSlow 4.5s linear infinite;
                }
                .radar-blip-dot {
                    animation: radarBlipPulse 2s ease-in-out infinite;
                }
            `}} />

            <div className="container-fluid px-3 px-md-4 py-3">
                {/* Page Header */}
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <span 
                                className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                                style={{
                                    background: 'rgba(14, 165, 163, 0.1)',
                                    color: 'var(--teal-1)',
                                    border: '1px solid rgba(14, 165, 163, 0.25)',
                                    fontSize: '0.72rem',
                                    fontWeight: 700
                                }}
                            >
                                <span className="spinner-grow spinner-grow-sm text-teal" style={{ width: '6px', height: '6px' }} role="status"></span>
                                <span>Pusat Intelijen Operasional</span>
                            </span>
                            <span className="badge rounded-pill bg-light text-muted border px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-shield-lock me-1"></i>Akses Terotentikasi Internal
                            </span>
                        </div>
                        <h4 className="fw-bold mb-1" style={{ color: '#0f2a3f', letterSpacing: '-0.3px' }}>
                            Statistik &amp; Telemetri Layanan
                        </h4>
                        <p className="text-muted mb-0" style={{ fontSize: '0.84rem' }}>
                            Agregasi ketersediaan SLA, telemetri kesiagaan DEFCON, dan postur keamanan seluruh domain organisasi.
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <Link
                            href={route('dashboard')}
                            className="btn btn-outline-secondary btn-sm px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
                            style={{ borderRadius: '9px', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                            <i className="bi bi-grid-1x2"></i>
                            <span>Dashboard Utama</span>
                        </Link>
                        <Link
                            href={route('scorecard.index')}
                            className="btn btn-outline-secondary btn-sm px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
                            style={{ borderRadius: '9px', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                            <i className="bi bi-award"></i>
                            <span>Rapor Mutu</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="btn btn-primary btn-sm px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
                            style={{ 
                                borderRadius: '9px', 
                                fontSize: '0.78rem', 
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #0ea5a3 0%, #0284c7 100%)',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(14, 165, 163, 0.25)'
                            }}
                        >
                            <i className="bi bi-printer"></i>
                            <span>Cetak Laporan</span>
                        </button>
                    </div>
                </div>

                {/* Section 1: 4 Key Metric Tiles */}
                <div className="row g-3 mb-4">
                    {/* Tile 1: DEFCON Status */}
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div 
                            className="glass-card section-card h-100 p-3 position-relative overflow-hidden"
                            style={{
                                borderRadius: '16px',
                                border: '1.5px solid rgba(15, 42, 63, 0.08)',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 250, 0.5) 100%)'
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Kesiagaan Sistem
                                </span>
                                <span 
                                    className="badge px-2 py-0.5"
                                    style={{
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        borderRadius: '6px',
                                        background: `${telemetry.defcon_color}15`,
                                        color: telemetry.defcon_color,
                                        border: `1px solid ${telemetry.defcon_color}40`
                                    }}
                                >
                                    {telemetry.defcon_status}
                                </span>
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-1">
                                <h3 className="fw-bold mb-0" style={{ color: telemetry.defcon_color, letterSpacing: '-0.5px' }}>
                                    {telemetry.defcon_level}
                                </h3>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)' }}>
                                <i className="bi bi-shield-exclamation me-1" style={{ color: telemetry.defcon_color }}></i>
                                <strong>{telemetry.anomalies_count}</strong> anomali aktif memerlukan pantauan
                            </div>
                        </div>
                    </div>

                    {/* Tile 2: Aggregate SLA Uptime */}
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div 
                            className="glass-card section-card h-100 p-3 position-relative overflow-hidden"
                            style={{
                                borderRadius: '16px',
                                border: '1.5px solid rgba(15, 42, 63, 0.08)',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 250, 0.5) 100%)'
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    SLA Ketersediaan
                                </span>
                                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                                    Target 99.5%
                                </span>
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-1">
                                <h3 className="fw-bold mb-0" style={{ color: '#0f2a3f', letterSpacing: '-0.5px' }}>
                                    {inventory.avg_uptime}%
                                </h3>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d' }}>
                                    {inventory.sla_status}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)' }}>
                                <i className="bi bi-clock-history me-1 text-teal"></i>
                                Komitmen SLA terhitung dari {inventory.total} layanan
                            </div>
                        </div>
                    </div>

                    {/* Tile 3: Inventory Breakdown */}
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div 
                            className="glass-card section-card h-100 p-3 position-relative overflow-hidden"
                            style={{
                                borderRadius: '16px',
                                border: '1.5px solid rgba(15, 42, 63, 0.08)',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 250, 0.5) 100%)'
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Inventaris Domain
                                </span>
                                <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                                    {inventory.up} Normal
                                </span>
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-1">
                                <h3 className="fw-bold mb-0" style={{ color: '#0f2a3f', letterSpacing: '-0.5px' }}>
                                    {inventory.total}
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Situs Terpantau</span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)' }}>
                                <span className="text-success fw-bold me-2"><i className="bi bi-check-circle-fill me-0.5"></i>{inventory.up}</span>
                                <span className="text-warning fw-bold me-2"><i className="bi bi-exclamation-triangle-fill me-0.5"></i>{inventory.warn}</span>
                                <span className="text-danger fw-bold"><i className="bi bi-x-circle-fill me-0.5"></i>{inventory.down}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tile 4: Security Posture Index */}
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div 
                            className="glass-card section-card h-100 p-3 position-relative overflow-hidden"
                            style={{
                                borderRadius: '16px',
                                border: '1.5px solid rgba(15, 42, 63, 0.08)',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 250, 0.5) 100%)'
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Indeks Keamanan
                                </span>
                                <span className="badge rounded-pill bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-0.5" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                                    {security.pct_secure}% Aman
                                </span>
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-1">
                                <h3 className="fw-bold mb-0" style={{ color: '#0f2a3f', letterSpacing: '-0.5px' }}>
                                    {security.clean_count} / {security.audited_count}
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Situs Bersih</span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)' }}>
                                <i className="bi bi-lock-fill me-1 text-teal"></i>
                                {security.exposed_env} env terekspos, {security.xframe_warn} x-frame atensi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Interactive SOC Telemetry & Radar Engine */}
                <div className="glass-card section-card p-4 mb-4" style={{ borderRadius: '18px' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-light">
                        <div className="d-flex align-items-center gap-2">
                            <div 
                                style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '8px', 
                                    background: 'rgba(14, 165, 163, 0.12)', 
                                    color: 'var(--teal-1)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center' 
                                }}
                            >
                                <i className="bi bi-broadcast-pin"></i>
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold" style={{ color: '#0f2a3f' }}>
                                    Topologi Telemetri &amp; Radar Pengawasan Terpusat
                                </h6>
                                <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                                    Pemindaian real-time siklus transmisi dan latensi node server terpantau
                                </span>
                            </div>
                        </div>
                        <span className="badge rounded-pill bg-light text-muted border px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-hdd-network me-1"></i>Domain Terakhir: {telemetry.latest_scanned_domain}
                        </span>
                    </div>

                    <div className="row g-4 align-items-center">
                        {/* Radar Engine Canvas */}
                        <div className="col-12 col-lg-5 d-flex justify-content-center">
                            <div 
                                className="position-relative d-flex align-items-center justify-content-center"
                                style={{
                                    width: '260px',
                                    height: '260px',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(14, 165, 163, 0.08) 0%, rgba(2, 132, 199, 0.03) 70%, transparent 100%)',
                                    border: '2px solid rgba(14, 165, 163, 0.25)',
                                    boxShadow: '0 0 30px rgba(14, 165, 163, 0.12)'
                                }}
                            >
                                {/* Concentric Radar Rings */}
                                <div className="position-absolute" style={{ width: '190px', height: '190px', borderRadius: '50%', border: '1px dashed rgba(14, 165, 163, 0.25)' }} />
                                <div className="position-absolute" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '1px solid rgba(14, 165, 163, 0.2)' }} />
                                <div className="position-absolute" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1px solid rgba(14, 165, 163, 0.35)', background: 'rgba(14, 165, 163, 0.1)' }} />

                                {/* Crosshairs */}
                                <div className="position-absolute w-100" style={{ height: '1px', background: 'rgba(14, 165, 163, 0.15)' }} />
                                <div className="position-absolute h-100" style={{ width: '1px', background: 'rgba(14, 165, 163, 0.15)' }} />

                                {/* Sweeping Beam */}
                                <div 
                                    className="position-absolute radar-sweep-beam"
                                    style={{
                                        width: '256px',
                                        height: '256px',
                                        borderRadius: '50%',
                                        pointerEvents: 'none'
                                    }}
                                />

                                {/* Center Hub */}
                                <div 
                                    className="position-relative d-flex align-items-center justify-content-center"
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: '#0ea5a3',
                                        color: '#ffffff',
                                        boxShadow: '0 0 12px #0ea5a3',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    <i className="bi bi-radar"></i>
                                </div>

                                {/* Radar Blip Targets */}
                                <div className="position-absolute radar-blip-dot" style={{ top: '45px', left: '160px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'block', boxShadow: '0 0 8px #10b981' }} />
                                </div>
                                <div className="position-absolute radar-blip-dot" style={{ bottom: '65px', left: '55px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', display: 'block', boxShadow: '0 0 8px #0284c7' }} />
                                </div>
                                <div className="position-absolute radar-blip-dot" style={{ top: '130px', right: '40px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'block', boxShadow: '0 0 8px #f59e0b' }} />
                                </div>
                            </div>
                        </div>

                        {/* Telemetry Live Feed List */}
                        <div className="col-12 col-lg-7">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f2a3f' }}>
                                    Node Layanan Terpantau Secara Aktif:
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>
                                    Siklus Audit: Tiap 1 Menit
                                </span>
                            </div>

                            <div className="d-flex flex-column gap-2">
                                {telemetry.radar_blips.map((blip, idx) => (
                                    <div 
                                        key={idx}
                                        className="p-2.5 rounded-3 d-flex align-items-center justify-content-between"
                                        style={{
                                            background: '#ffffff',
                                            border: '1px solid rgba(15, 42, 63, 0.08)',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <div className="d-flex align-items-center gap-2.5">
                                            <span 
                                                style={{ 
                                                    width: '8px', 
                                                    height: '8px', 
                                                    borderRadius: '50%', 
                                                    background: '#10b981',
                                                    boxShadow: '0 0 6px #10b981'
                                                }}
                                            />
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f2a3f' }}>{blip.name}</div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', fontFamily: 'monospace' }}>{blip.domain}</div>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                            <span 
                                                className="badge px-2 py-0.5"
                                                style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    borderRadius: '6px',
                                                    background: '#f0fdf4',
                                                    color: '#15803d',
                                                    border: '1px solid #bbf7d0'
                                                }}
                                            >
                                                <i className="bi bi-lightning-charge-fill me-0.5"></i>{blip.ping}
                                            </span>
                                            <span className="badge rounded-pill bg-light text-muted border px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                                                SSL Valid
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Charts Row */}
                <div className="row g-3 mb-4">
                    {/* Left: 30-Day Aggregate Uptime Trend */}
                    <div className="col-12 col-xl-7">
                        <div className="glass-card section-card h-100 p-3" style={{ borderRadius: '18px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <div>
                                    <h6 className="fw-bold mb-0" style={{ color: '#0f2a3f' }}>
                                        Tren Ketersediaan Agregat 30 Hari Terakhir
                                    </h6>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                                        Fluktuasi persentase uptime rata-rata seluruh sistem
                                    </span>
                                </div>
                                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                                    <i className="bi bi-graph-up me-1"></i>SLA Tercapai
                                </span>
                            </div>

                            <div ref={chartUptimeRef} />
                        </div>
                    </div>

                    {/* Right: Category Distribution Donut */}
                    <div className="col-12 col-xl-5">
                        <div className="glass-card section-card h-100 p-3" style={{ borderRadius: '18px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <div>
                                    <h6 className="fw-bold mb-0" style={{ color: '#0f2a3f' }}>
                                        Distribusi Status &amp; Kesehatan Domain
                                    </h6>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                                        Proporsi operasional inventaris server aktif
                                    </span>
                                </div>
                            </div>

                            <div ref={chartDonutRef} />
                        </div>
                    </div>
                </div>

                {/* Section 4: Cluster & Category Performance Breakdown */}
                <div className="glass-card section-card p-4" style={{ borderRadius: '18px' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-light">
                        <div className="d-flex align-items-center gap-2">
                            <div 
                                style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '8px', 
                                    background: 'rgba(2, 132, 199, 0.1)', 
                                    color: '#0284c7', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center' 
                                }}
                            >
                                <i className="bi bi-layers-fill"></i>
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold" style={{ color: '#0f2a3f' }}>
                                    Performa Kategori &amp; Kluster Layanan
                                </h6>
                                <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                                    Tingkat ketersediaan dan rasio kesehatan per rumpun layanan
                                </span>
                            </div>
                        </div>
                        <span className="badge rounded-pill bg-light text-muted border px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                            {categories.length} Kategori Terpetakan
                        </span>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                            <thead>
                                <tr className="text-muted" style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <th style={{ background: 'transparent' }}>Kluster / Kategori</th>
                                    <th style={{ background: 'transparent' }} className="text-center">Total Domain</th>
                                    <th style={{ background: 'transparent' }} className="text-center">Domain Normal</th>
                                    <th style={{ background: 'transparent', width: '220px' }}>Indeks Ketersediaan</th>
                                    <th style={{ background: 'transparent' }} className="text-end">Status Operasional</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="bi bi-folder2-open text-teal"></i>
                                                <span className="fw-bold" style={{ color: '#0f2a3f' }}>{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-center fw-semibold">{cat.total}</td>
                                        <td className="text-center text-success fw-bold">{cat.up}</td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="progress flex-grow-1" style={{ height: '6px', borderRadius: '4px' }}>
                                                    <div 
                                                        className="progress-bar"
                                                        role="progressbar"
                                                        style={{ 
                                                            width: `${cat.uptime_pct}%`,
                                                            background: cat.uptime_pct >= 99 ? '#10b981' : (cat.uptime_pct >= 90 ? '#f59e0b' : '#ef4444')
                                                        }}
                                                    />
                                                </div>
                                                <span className="fw-bold" style={{ fontSize: '0.76rem', color: '#0f2a3f', width: '42px' }}>
                                                    {cat.uptime_pct}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-end">
                                            <span 
                                                className="badge px-2 py-1"
                                                style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    borderRadius: '6px',
                                                    background: cat.uptime_pct >= 99 ? '#f0fdf4' : '#fffbeb',
                                                    color: cat.uptime_pct >= 99 ? '#15803d' : '#b45309',
                                                    border: cat.uptime_pct >= 99 ? '1px solid #bbf7d0' : '1px solid #fde68a'
                                                }}
                                            >
                                                {cat.uptime_pct >= 99 ? 'Prima' : 'Perlu Atensi'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
