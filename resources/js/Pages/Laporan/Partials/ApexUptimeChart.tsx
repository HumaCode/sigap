import { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

interface ApexUptimeChartProps {
    avgUptime?: number;
}

export default function ApexUptimeChart({ avgUptime = 99.8 }: ApexUptimeChartProps) {
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
}
