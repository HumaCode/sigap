import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { useState } from 'react';
import '../../../css/incidents.css';
import DetailIncidentModal from './Partials/DetailIncidentModal';

interface IncidentProps extends PageProps {
    incidents: { data: any[]; links: any[]; meta: any };
    filters: { search?: string; status?: string };
    stats: {
        total: number;
        critical: number;
        resolved: number;
        open: number;
    };
}

export default function Index({ incidents, filters, stats }: IncidentProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [selectedIncident, setSelectedIncident] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            router.get(route('incidents.index'), { search: searchTerm, status: statusFilter }, { preserveState: true });
        }
    };

    const handleFilterClick = (status: string) => {
        setStatusFilter(status);
        router.get(route('incidents.index'), { search: searchTerm, status }, { preserveState: true });
    };

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        router.get(route('incidents.index'));
    };

    const openDetail = (incident: any) => {
        setSelectedIncident(incident);
        setShowDetailModal(true);
    };

    const renderSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return <span className="sev-badge sev-critical">Kritis</span>;
            case 'high': return <span className="sev-badge sev-high">Tinggi</span>;
            case 'medium': return <span className="sev-badge sev-medium">Sedang</span>;
            case 'low': return <span className="sev-badge sev-low">Rendah</span>;
            default: return <span className="sev-badge sev-low">{severity}</span>;
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <span className="status-badge st-open">Terbuka</span>;
            case 'acknowledged': return <span className="status-badge st-ack">Ditinjau</span>;
            case 'resolved': return <span className="status-badge st-resolved">Selesai</span>;
            case 'false_positive': return <span className="status-badge st-false">Bukan Insiden</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'defacement': return { icon: 'bi bi-pencil-square', bg: 'linear-gradient(135deg,var(--sun),#ff9d6e)' };
            case 'down': return { icon: 'bi bi-hdd-network', bg: 'linear-gradient(135deg,var(--blue-1),var(--blue-2))' };
            case 'keyword_found': return { icon: 'bi bi-bug', bg: 'linear-gradient(135deg,#ff7a6e,#ff9d6e)' };
            case 'error': return { icon: 'bi bi-file-earmark-lock2', bg: 'linear-gradient(135deg,var(--violet),#a78bfa)' };
            default: return { icon: 'bi bi-shield-exclamation', bg: 'linear-gradient(135deg,var(--teal-1),var(--teal-2))' };
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Insiden</h2>}
        >
            <Head title="Insiden" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div style={{
                        width: '46px', height: '46px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(14,165,163,0.2)', flexShrink: 0
                    }}>
                        <i className="bi bi-exclamation-octagon" style={{ fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                        <div className="page-title mb-0" style={{ lineHeight: 1.2 }}>Manajemen Insiden</div>
                        <p className="page-sub mb-0 mt-1" style={{ margin: 0 }}>
                            Riwayat insiden dari seluruh situs terpantau — {stats.open} insiden masih terbuka.
                        </p>
                    </div>
                </div>
                
                <button 
                    className="btn btn-light" 
                    style={{ 
                        width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.6)', 
                        backdropFilter: 'blur(10px)', color: 'var(--ink-dark)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', 
                        transition: 'all 0.2s' 
                    }} 
                    onClick={handleReset} 
                    title="Reset Filter & Segarkan Data"
                >
                    <i className="bi bi-arrow-clockwise" style={{ fontSize: '1.2rem' }}></i>
                </button>
            </div>

            {/* Stat pills */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(255,122,110,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}><i className="bi bi-exclamation-octagon-fill"></i></div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ color: 'var(--coral)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terbuka</div>
                                <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--coral)', lineHeight: '1.2', marginTop: '0.2rem' }}>{stats.open}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Belum Ditangani</div>
                            </div>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,122,110,0.12)', color: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(255,122,110,0.1)' }}>
                                <i className="bi bi-exclamation-octagon"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(200,51,42,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}><i className="bi bi-lightning-charge-fill"></i></div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ color: '#c8332a', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kritis</div>
                                <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#c8332a', lineHeight: '1.2', marginTop: '0.2rem' }}>{stats.critical}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Risiko Tinggi</div>
                            </div>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(200,51,42,0.12)', color: '#c8332a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(200,51,42,0.1)' }}>
                                <i className="bi bi-lightning-charge"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(251,191,36,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}><i className="bi bi-hourglass-split"></i></div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ color: 'var(--sun)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ditinjau</div>
                                <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--sun)', lineHeight: '1.2', marginTop: '0.2rem' }}>{stats.total - stats.resolved - stats.open}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Dalam Proses</div>
                            </div>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(251,191,36,0.12)', color: 'var(--sun)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(251,191,36,0.1)' }}>
                                <i className="bi bi-hourglass-split"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '6rem', color: 'rgba(14,165,163,0.04)', zIndex: 0, transform: 'rotate(-10deg)' }}><i className="bi bi-check2-circle"></i></div>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ color: 'var(--teal-1)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selesai</div>
                                <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--teal-1)', lineHeight: '1.2', marginTop: '0.2rem' }}>{stats.resolved}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Sudah Ditangani</div>
                            </div>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(14,165,163,0.12)', color: 'var(--teal-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(14,165,163,0.1)' }}>
                                <i className="bi bi-check2-circle"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card">
                {/* Toolbar */}
                <div className="toolbar">
                    <div className="search-local">
                        <i className="bi bi-search"></i>
                        <input 
                            type="text" 
                            placeholder="Cari insiden atau situs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                    <div className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => handleFilterClick('all')}>Semua</div>
                    <div className={`filter-chip ${statusFilter === 'critical' ? 'active' : ''}`} onClick={() => handleFilterClick('critical')}><span className="chip-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c8332a', display: 'inline-block' }}></span>Kritis</div>
                    <div className={`filter-chip ${statusFilter === 'open' ? 'active' : ''}`} onClick={() => handleFilterClick('open')}>Terbuka</div>
                </div>

                {/* List */}
                <div>
                    {incidents.data.length === 0 ? (
                        <div className="p-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                            <div className="empty-state-icon mb-4" style={{ position: 'relative' }}>
                                <div className="pulse-ring" style={{
                                    position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
                                    borderRadius: '50%', background: 'rgba(14, 165, 163, 0.1)', animation: 'pulse 2s infinite'
                                }}></div>
                                <div className="pulse-ring delay" style={{
                                    position: 'absolute', top: '-20px', left: '-20px', right: '-20px', bottom: '-20px',
                                    borderRadius: '50%', background: 'rgba(14, 165, 163, 0.05)', animation: 'pulse 2s infinite 1s'
                                }}></div>
                                <i className="bi bi-shield-check" style={{ fontSize: '3.5rem', color: 'var(--teal-1)', position: 'relative', zIndex: 1, animation: 'float 3s ease-in-out infinite' }}></i>
                            </div>
                            <h5 style={{ fontWeight: 600, color: 'var(--ink-dark)' }}>Sistem Aman & Terkendali</h5>
                            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
                                Belum ada insiden yang terdeteksi. Sistem pemantauan terus berjalan di latar belakang.
                            </p>
                            <style>
                                {`
                                @keyframes pulse {
                                    0% { transform: scale(0.8); opacity: 0.8; }
                                    100% { transform: scale(1.5); opacity: 0; }
                                }
                                @keyframes float {
                                    0% { transform: translateY(0px); }
                                    50% { transform: translateY(-8px); }
                                    100% { transform: translateY(0px); }
                                }
                                `}
                            </style>
                        </div>
                    ) : (
                        incidents.data.map((incident) => {
                            const { icon, bg } = getIcon(incident.type);
                            return (
                                <div key={incident.id} className="incident-row" onClick={() => openDetail(incident)}>
                                    <div className="inc-icon" style={{ background: bg }}><i className={icon}></i></div>
                                    <div className="flex-grow-1 min-w-0">
                                        <p className="inc-title">{incident.title}</p>
                                        <p className="inc-desc">{incident.description || '-'}</p>
                                        <div className="inc-meta">
                                            <span><i className="bi bi-globe2"></i> {incident.site_name || '-'}</span>
                                            <span><i className="bi bi-clock"></i> {incident.detected_at_human}</span>
                                        </div>
                                    </div>
                                    <div className="inc-right">
                                        {renderSeverityBadge(incident.severity)}
                                        {renderStatusBadge(incident.status)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {incidents.meta && incidents.meta.last_page > 1 && (
                    <div className="pagination-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', borderTop: '1px solid var(--line)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>Menampilkan {incidents.meta.from} - {incidents.meta.to} dari {incidents.meta.total} insiden</span>
                        <div className="d-flex gap-1">
                            {incidents.meta.links && incidents.meta.links.map((link: any, index: number) => {
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
                                        data={{ search: searchTerm, status: statusFilter }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <DetailIncidentModal 
                show={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                incident={selectedIncident}
            />

        </AuthenticatedLayout>
    );
}
