import { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

interface DashboardUptimeChartProps {
    activeTab: 'hourly' | '7days' | '30days' | '90days';
    data: number[];
    labels: string[];
    avgUptime: number;
    isLive?: boolean;
}

export default function DashboardUptimeChart({
    activeTab,
    data,
    labels,
    avgUptime,
    isLive = false,
}: DashboardUptimeChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<ApexCharts | null>(null);

    const dataMin = data.length > 0 ? Math.min(...data) : 95;
    const dataMax = data.length > 0 ? Math.max(...data) : 100;
    const currentAvg = data.length > 0 ? +(data.reduce((a, b) => a + b, 0) / data.length).toFixed(2) : avgUptime;
    const slaTarget = 99.5;
    const slaMet = currentAvg >= slaTarget;

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const yMin = Math.max(80, Math.floor(dataMin - 1.5));
        const yMax = Math.min(100, Math.ceil(dataMax + 0.5));

        const options: ApexCharts.ApexOptions = {
            series: [
                {
                    name: 'Ketersediaan (Uptime)',
                    data: data.slice(),
                },
            ],
            chart: {
                id: 'dashboard-uptime-trend',
                height: 270,
                type: 'area',
                fontFamily: 'Poppins, -apple-system, sans-serif',
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
                dropShadow: {
                    enabled: true,
                    top: 3,
                    left: 0,
                    blur: 4,
                    color: '#0ea5a3',
                    opacity: 0.16,
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 550,
                    dynamicAnimation: {
                        enabled: isLive,
                        speed: 800,
                    },
                },
            },
            colors: ['#0ea5a3'],
            dataLabels: {
                enabled: false,
            },
            stroke: {
                curve: 'smooth',
                width: 3,
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.38,
                    opacityTo: 0.02,
                    stops: [0, 85, 100],
                },
            },
            markers: {
                size: 4,
                colors: ['#ffffff'],
                strokeColors: '#0ea5a3',
                strokeWidth: 2.5,
                hover: {
                    size: 6.5,
                    sizeOffset: 2,
                },
            },
            grid: {
                borderColor: 'rgba(15, 42, 63, 0.06)',
                strokeDashArray: 4,
                padding: {
                    top: 10,
                    right: 15,
                    bottom: 0,
                    left: 15,
                },
            },
            xaxis: {
                categories: labels.slice(),
                labels: {
                    style: {
                        colors: '#7c93a3',
                        fontSize: '11.5px',
                        fontWeight: 500,
                    },
                },
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                tooltip: {
                    enabled: false,
                },
            },
            yaxis: {
                min: yMin,
                max: yMax,
                tickAmount: 4,
                labels: {
                    formatter: (val: number) => `${val?.toFixed ? val.toFixed(1) : val}%`,
                    style: {
                        colors: '#7c93a3',
                        fontSize: '11px',
                        fontWeight: 500,
                    },
                },
            },
            annotations: {
                yaxis: [
                    {
                        y: 99.5,
                        borderColor: '#22c55e',
                        strokeDashArray: 4,
                        opacity: 0.75,
                        label: {
                            borderColor: '#22c55e',
                            style: {
                                color: '#ffffff',
                                background: '#16a34a',
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: {
                                    left: 6,
                                    right: 6,
                                    top: 2,
                                    bottom: 2,
                                },
                            },
                            text: 'SLA 99.5%',
                            position: 'right',
                        },
                    },
                ],
            },
            tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    const val = series[seriesIndex][dataPointIndex];
                    const label = w.globals.categoryLabels[dataPointIndex] || labels[dataPointIndex] || '';
                    const isGood = val >= 99.0;
                    return `
                        <div style="padding: 8px 12px; background: #ffffff; border: 1px solid rgba(15,42,63,0.12); border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); font-family: Poppins, sans-serif;">
                            <div style="font-size: 11px; color: #7c93a3; font-weight: 500; margin-bottom: 2px;">${label}</div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 13px; font-weight: 700; color: #0f2a3f;">${Number(val).toFixed(2)}%</span>
                                <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${isGood ? '#dcfce7' : '#fef3c7'}; color: ${isGood ? '#15803d' : '#b45309'};">
                                    ${isGood ? 'Optimal' : 'Degradasi'}
                                </span>
                            </div>
                        </div>
                    `;
                },
            },
            legend: {
                show: false,
            },
        };

        if (chartInstanceRef.current) {
            chartInstanceRef.current.updateOptions({
                xaxis: {
                    categories: labels.slice(),
                },
                yaxis: {
                    min: yMin,
                    max: yMax,
                    tickAmount: 4,
                },
                chart: {
                    animations: {
                        dynamicAnimation: {
                            enabled: isLive,
                            speed: 800,
                        },
                    },
                },
            });
            chartInstanceRef.current.updateSeries([
                {
                    name: 'Ketersediaan (Uptime)',
                    data: data.slice(),
                },
            ]);
        } else {
            const chart = new ApexCharts(chartContainerRef.current, options);
            chart.render();
            chartInstanceRef.current = chart;
        }

        return () => {
            // cleanup on dependency change handled safely
        };
    }, [activeTab, data, labels, isLive]);

    // Clean up on component unmount
    useEffect(() => {
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div className="d-flex flex-column h-100">
            {/* ApexCharts Canvas Container */}
            <div style={{ width: '100%', minHeight: '270px' }}>
                <div ref={chartContainerRef} />
            </div>

            {/* Bottom KPI Metrics Bar (Fills remaining height smoothly) */}
            <div 
                className="mt-auto pt-3 border-top border-light"
            >
                <div className="row g-2">
                    <div className="col-6 col-sm-3">
                        <div 
                            className="p-2 rounded-3 d-flex align-items-center gap-2"
                            style={{
                                background: 'rgba(255, 255, 255, 0.75)',
                                border: '1px solid rgba(15, 42, 63, 0.06)'
                            }}
                        >
                            <div 
                                style={{ 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '7px', 
                                    background: 'rgba(14, 165, 163, 0.1)', 
                                    color: 'var(--teal-1)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '0.82rem',
                                    flexShrink: 0
                                }}
                            >
                                <i className="bi bi-graph-up-arrow"></i>
                            </div>
                            <div className="min-w-0">
                                <div style={{ fontSize: '0.66rem', color: 'var(--ink-faint)', lineHeight: 1.1 }}>Rata-rata Uptime</div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f2a3f' }}>{currentAvg}%</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-sm-3">
                        <div 
                            className="p-2 rounded-3 d-flex align-items-center gap-2"
                            style={{
                                background: 'rgba(255, 255, 255, 0.75)',
                                border: '1px solid rgba(15, 42, 63, 0.06)'
                            }}
                        >
                            <div 
                                style={{ 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '7px', 
                                    background: 'rgba(2, 132, 199, 0.1)', 
                                    color: '#0284c7', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '0.82rem',
                                    flexShrink: 0
                                }}
                            >
                                <i className="bi bi-award-fill"></i>
                            </div>
                            <div className="min-w-0">
                                <div style={{ fontSize: '0.66rem', color: 'var(--ink-faint)', lineHeight: 1.1 }}>Target SLA</div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f2a3f' }}>99.5%</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-sm-3">
                        <div 
                            className="p-2 rounded-3 d-flex align-items-center gap-2"
                            style={{
                                background: 'rgba(255, 255, 255, 0.75)',
                                border: '1px solid rgba(15, 42, 63, 0.06)'
                            }}
                        >
                            <div 
                                style={{ 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '7px', 
                                    background: 'rgba(22, 163, 74, 0.1)', 
                                    color: '#16a34a', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '0.82rem',
                                    flexShrink: 0
                                }}
                            >
                                <i className="bi bi-shield-check"></i>
                            </div>
                            <div className="min-w-0">
                                <div style={{ fontSize: '0.66rem', color: 'var(--ink-faint)', lineHeight: 1.1 }}>Puncak Uptime</div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f2a3f' }}>{dataMax.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-sm-3">
                        <div 
                            className="p-2 rounded-3 d-flex align-items-center gap-2"
                            style={{
                                background: 'rgba(255, 255, 255, 0.75)',
                                border: '1px solid rgba(15, 42, 63, 0.06)'
                            }}
                        >
                            <div 
                                style={{ 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '7px', 
                                    background: slaMet ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                                    color: slaMet ? '#16a34a' : '#d97706', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '0.82rem',
                                    flexShrink: 0
                                }}
                            >
                                <i className={slaMet ? "bi bi-check-circle-fill" : "bi bi-exclamation-circle-fill"}></i>
                            </div>
                            <div className="min-w-0">
                                <div style={{ fontSize: '0.66rem', color: 'var(--ink-faint)', lineHeight: 1.1 }}>Status SLA</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: slaMet ? '#15803d' : '#b45309' }}>
                                    {slaMet ? 'Memenuhi' : 'Atensi'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
