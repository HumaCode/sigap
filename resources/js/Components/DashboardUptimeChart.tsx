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

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const dataMin = data.length > 0 ? Math.min(...data) : 95;
        const dataMax = data.length > 0 ? Math.max(...data) : 100;
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
                height: 250,
                type: 'area',
                fontFamily: 'Poppins, sans-serif',
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 500,
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
                width: 3.2,
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.42,
                    opacityTo: 0.03,
                    stops: [0, 85, 100],
                },
            },
            markers: {
                size: 4.5,
                colors: ['#ffffff'],
                strokeColors: '#0ea5a3',
                strokeWidth: 2.5,
                hover: {
                    size: 7,
                    sizeOffset: 3,
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
                        opacity: 0.7,
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
                theme: 'light',
                x: {
                    show: true,
                },
                y: {
                    formatter: (val: number) => `${val?.toFixed ? val.toFixed(2) : val}% Uptime`,
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
            // Only destroy when unmounting component
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
        <div style={{ width: '100%', minHeight: '250px' }}>
            <div ref={chartContainerRef} />
        </div>
    );
}
