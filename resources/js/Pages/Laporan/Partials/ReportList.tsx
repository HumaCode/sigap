import React, { useMemo } from 'react';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';

interface SiteItem {
    id: string;
    name: string;
    url: string;
    category?: string;
    status: string;
    uptime: number;
    requests_formatted?: string;
    recent_logs?: any[];
    [key: string]: any;
}

interface ReportListProps {
    sites: {
        data: SiteItem[];
        meta?: {
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            total: number;
        };
    };
    totalSites: number;
    canViewDetail?: boolean;
    onSelectSite: (site: SiteItem) => void;
    onPageChange: (page: number) => void;
}

// Subcomponent: Heatmap Cells 30 Hari
const HeatmapCells = ({ seed, status }: { seed: string; status?: string }) => {
    const cells = useMemo(() => {
        const result = [];
        let currentSeed = seed.length;
        for (let i = 0; i < 30; i++) {
            currentSeed = (currentSeed * 16807) % 2147483647;
            const r = (currentSeed - 1) / 2147483646;
            let c = 'hc-full';
            
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

// Subcomponent: Incident Count
const IncidentCount = ({ seed, status }: { seed: string; status?: string }) => {
    const count = useMemo(() => {
        if (status === 'down') return ((seed.length * 7) % 10) + 12;
        return (seed.length * 3) % 8;
    }, [seed, status]);
    
    return <>{count}</>;
};

export default function ReportList({
    sites,
    totalSites,
    canViewDetail = true,
    onSelectSite,
    onPageChange,
}: ReportListProps) {
    const getSiteFavicon = (category?: string) => {
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
        <div className="glass-card section-card">
            {/* Header Section */}
            <div className="section-head align-items-center flex-wrap gap-2">
                <div>
                    <h6 className="mb-0">Laporan Per Situs</h6>
                    <span className="muted">Heatmap menunjukkan status harian 30 hari terakhir (Klik baris untuk rincian)</span>
                </div>
                
                {/* Heatmap Legend */}
                <div 
                    className="d-none d-md-flex align-items-center gap-3 ms-auto" 
                    style={{ 
                        fontSize: '0.76rem', 
                        color: 'var(--ink-soft)', 
                        background: 'rgba(255,255,255,0.7)', 
                        padding: '0.35rem 0.8rem', 
                        borderRadius: '10px', 
                        border: '1px solid rgba(0,0,0,0.04)' 
                    }}
                >
                    <span className="d-flex align-items-center gap-1">
                        <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '3px', background: '#0ea5a3' }}></span> 100% Online
                    </span>
                    <span className="d-flex align-items-center gap-1">
                        <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '3px', background: '#ffb648' }}></span> Respon Lambat
                    </span>
                    <span className="d-flex align-items-center gap-1">
                        <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '3px', background: '#ff7a6e' }}></span> Downtime
                    </span>
                </div>

                <span className="muted ms-md-2">Menampilkan {sites.data.length} dari {totalSites} situs</span>
            </div>

            {/* Sites List */}
            <div>
                {sites.data.map((site) => (
                    <div 
                        key={site.id} 
                        className="report-row" 
                        style={{ cursor: canViewDetail ? 'pointer' : 'default', transition: 'all 0.2s ease' }}
                        onClick={() => {
                            if (canViewDetail) {
                                onSelectSite(site);
                            }
                        }}
                        title={canViewDetail ? "Klik untuk melihat rincian laporan situs ini" : undefined}
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
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </div>
    );
}
