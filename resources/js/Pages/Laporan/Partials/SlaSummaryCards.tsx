import React from 'react';

interface SlaSummaryCardsProps {
    stats: {
        avg_uptime: number;
        total_sites: number;
        sites_met_sla: number;
        sites_missed_sla: number;
        total_downtime: number;
        avg_response_time: number;
        mttr?: number;
        mttd?: number;
    };
}

export default function SlaSummaryCards({ stats }: SlaSummaryCardsProps) {
    const metPercentage = stats.total_sites > 0 ? Math.round((stats.sites_met_sla / stats.total_sites) * 100) : 0;
    const uptimeOffset = 163 - (163 * (stats.avg_uptime || 0) / 100);
    const metOffset = stats.total_sites > 0 ? 163 - (163 * stats.sites_met_sla / stats.total_sites) : 163;

    return (
        <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3">
                <div className="glass-card sla-card">
                    <div className="sla-ring">
                        <svg width="64" height="64">
                            <circle cx="32" cy="32" r="26" stroke="rgba(15,42,63,0.08)" strokeWidth="7" fill="none" />
                            <circle 
                                cx="32" 
                                cy="32" 
                                r="26" 
                                stroke="#0ea5a3" 
                                strokeWidth="7" 
                                fill="none" 
                                strokeDasharray="163" 
                                strokeDashoffset={uptimeOffset} 
                                strokeLinecap="round" 
                            />
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
                            <circle cx="32" cy="32" r="26" stroke="rgba(15,42,63,0.08)" strokeWidth="7" fill="none" />
                            <circle 
                                cx="32" 
                                cy="32" 
                                r="26" 
                                stroke="#3b82f6" 
                                strokeWidth="7" 
                                fill="none" 
                                strokeDasharray="163" 
                                strokeDashoffset={metOffset} 
                                strokeLinecap="round" 
                            />
                        </svg>
                        <div className="val">{metPercentage}%</div>
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
                            <circle cx="32" cy="32" r="26" stroke="rgba(15,42,63,0.08)" strokeWidth="7" fill="none" />
                            <circle 
                                cx="32" 
                                cy="32" 
                                r="26" 
                                stroke="#ff7a6e" 
                                strokeWidth="7" 
                                fill="none" 
                                strokeDasharray="163" 
                                strokeDashoffset="145" 
                                strokeLinecap="round" 
                            />
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
                            <circle cx="32" cy="32" r="26" stroke="rgba(15,42,63,0.08)" strokeWidth="7" fill="none" />
                            <circle 
                                cx="32" 
                                cy="32" 
                                r="26" 
                                stroke="#ffb648" 
                                strokeWidth="7" 
                                fill="none" 
                                strokeDasharray="163" 
                                strokeDashoffset="100" 
                                strokeLinecap="round" 
                            />
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
    );
}
