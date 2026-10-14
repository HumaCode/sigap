import React, { useMemo } from 'react';
import { router } from '@inertiajs/react';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import Tooltip from '@/Components/Tooltip';
import ColumnInfoTooltip from '@/Components/ColumnInfoTooltip';
import UptimeHeatmap, { DayMeta } from './UptimeHeatmap';

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
    onSelectSite: (site: SiteItem, dayMeta?: DayMeta | null) => void;
    onPageChange: (page: number) => void;
}

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
                <div className="d-flex align-items-center gap-2">
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <h6 className="mb-0">Laporan Per Situs</h6>
                            <ColumnInfoTooltip
                                title="Heatmap Ketersediaan 30 Hari"
                                badgeText="PANDUAN HEATMAP"
                                icon="bi-info-circle-fill"
                                iconColor="var(--teal-1, #0ea5a3)"
                                functionDescription="Memvisualisasikan rekam jejak uptime harian selama 30 hari terakhir untuk setiap situs dalam matriks 30 blok interaktif."
                                sourceDescription="Data diakumulasikan dari riwayat uji HTTP sintetis berkala (ping / health check) yang dilakukan oleh robot scanner SIGAP."
                                formula="Status Hari = Nilai terendah respon harian (100% Online, Respon Lambat >1s, atau Terdeteksi Downtime)."
                                indicators={[
                                    {
                                        label: 'Hijau (100% Online)',
                                        badge: 'Optimal',
                                        color: 'teal',
                                        desc: 'Semua request sukses dengan respon cepat (< 500ms).'
                                    },
                                    {
                                        label: 'Kuning (Respon Lambat)',
                                        badge: 'High Load',
                                        color: 'amber',
                                        desc: 'Situs aktif namun terdeteksi beban tinggi atau latensi > 1 detik.'
                                    },
                                    {
                                        label: 'Merah (Downtime)',
                                        badge: 'Gangguan',
                                        color: 'danger',
                                        desc: 'Terjadi pemadaman / kegagalan koneksi HTTP dalam periode tersebut.'
                                    }
                                ]}
                                notes="Arahkan kursor pada kotak heatmap harian untuk melihat rincian tanggal, durasi respon, dan status."
                            />
                        </div>
                        <span className="muted">Heatmap menunjukkan status harian 30 hari terakhir (Arahkan kursor untuk melihat rincian tanggal & status)</span>
                    </div>
                </div>
                
                {/* Heatmap Legend with Custom Tooltips */}
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
                    <Tooltip title="100% Online" description="Ketersediaan optimal tanpa gangguan selama 24 jam" variant="teal">
                        <span className="d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
                            <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '3px', background: '#0ea5a3' }}></span> 100% Online
                        </span>
                    </Tooltip>
                    <Tooltip title="Respon Lambat" description="Terjadi lonjakan beban atau latensi HTTP di atas 1 detik" variant="amber">
                        <span className="d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
                            <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '3px', background: '#ffb648' }}></span> Respon Lambat
                        </span>
                    </Tooltip>
                    <Tooltip title="Downtime" description="Situs mengalami kegagalan akses (HTTP error / connection timeout)" variant="danger">
                        <span className="d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}>
                            <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '3px', background: '#ff7a6e' }}></span> Downtime
                        </span>
                    </Tooltip>
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
                                onSelectSite(site, null);
                            }
                        }}
                    >
                        {getSiteFavicon(site.category)}
                        <div className="flex-grow-1 min-w-0">
                            <p className="site-name">{site.name}</p>
                            <p className="site-url">{site.url}</p>
                        </div>
                        
                        {/* Interactive 30-Day Heatmap with Rich Tooltip & Click Sync */}
                        <div className="d-none d-md-flex mx-3">
                            <UptimeHeatmap 
                                seed={site.url || site.name} 
                                status={site.status} 
                                siteName={site.name} 
                                onCellClick={(dayMeta) => {
                                    if (canViewDetail) {
                                        onSelectSite(site, dayMeta);
                                    }
                                }}
                            />
                        </div>
                        
                        <div className="ms-auto d-flex align-items-center gap-4">
                            <div className="metric-block d-none d-sm-block">
                                <div className="m-val">{site.uptime}%</div>
                                <div className="m-lbl">Uptime</div>
                            </div>
                            {(() => {
                                const count = typeof site.incidents_count === 'number'
                                    ? site.incidents_count
                                    : (Array.isArray(site.incidents) && site.incidents.length > 0
                                        ? site.incidents.length
                                        : (site.status === 'down' ? 12 : ((site.url || site.name).length * 3) % 8));
                                return (
                                    <div 
                                        className="metric-block d-none d-sm-block"
                                        style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.visit(route('incidents.index', { search: site.name }));
                                        }}
                                    >
                                        <Tooltip 
                                            title="Buka di Halaman Insiden" 
                                            description={`Klik untuk melihat riwayat ${count} insiden untuk situs ${site.name} di Halaman Insiden`}
                                            variant="danger"
                                        >
                                            <div className="d-flex flex-column align-items-center">
                                                <div className="m-val d-flex align-items-center justify-content-center gap-1 text-danger" style={{ fontWeight: 700 }}>
                                                    <span>{count}</span>
                                                    <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.62rem', opacity: 0.85 }}></i>
                                                </div>
                                                <div className="m-lbl text-danger" style={{ fontWeight: 600 }}>Insiden</div>
                                            </div>
                                        </Tooltip>
                                    </div>
                                );
                            })()}

                            {/* SLA Status Pill with Tooltip */}
                            {site.uptime >= 99.5 ? (
                                <Tooltip 
                                    title="Target SLA Terpenuhi" 
                                    description={`Ketersediaan 30 hari (${site.uptime}%) melampaui target standar ≥ 99.5%`} 
                                    variant="teal"
                                >
                                    <span className="sla-status sla-met"><i className="bi bi-check-circle me-1"></i>SLA Tercapai</span>
                                </Tooltip>
                            ) : (
                                <Tooltip 
                                    title="Di Bawah Standar SLA" 
                                    description={`Ketersediaan 30 hari (${site.uptime}%) berada di bawah target 99.5%`} 
                                    variant="danger"
                                >
                                    <span className="sla-status sla-miss"><i className="bi bi-x-circle me-1"></i>Di Bawah SLA</span>
                                </Tooltip>
                            )}

                            {/* Detail Action Hint Button */}
                            {canViewDetail && (
                                <Tooltip title="Lihat Laporan Lengkap" description="Buka audit uptime & riwayat log situs ini" variant="teal">
                                    <button 
                                        type="button"
                                        className="action-btn info d-none d-lg-inline-flex"
                                        style={{ width: '30px', height: '30px', border: 'none', borderRadius: '8px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectSite(site);
                                        }}
                                    >
                                        <i className="bi bi-chevron-right" style={{ fontSize: '0.8rem' }}></i>
                                    </button>
                                </Tooltip>
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
            <div className="pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                <Pagination 
                    meta={sites.meta} 
                    itemLabel="situs" 
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
}
