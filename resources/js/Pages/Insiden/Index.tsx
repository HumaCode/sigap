import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';
import '../../../css/incidents.css';
import DetailIncidentModal from './Partials/DetailIncidentModal';
import AiRemediationModal from './Partials/AiRemediationModal';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import PopupLoader from '@/Components/PopupLoader';
import { toast } from '@/Components/DynamicToast';

interface IncidentProps extends PageProps {
    incidents: { data: any[]; links: any[]; meta: any };
    filters: { search?: string; status?: string };
    stats: {
        total: number;
        critical: number;
        resolved: number;
        open: number;
        investigating?: number;
        active?: number;
    };
}

export default function Index({ incidents, filters, stats }: IncidentProps) {
    const safeIncidents = incidents || { data: [], meta: { total: 0, last_page: 1, links: [] } };
    const safeData = safeIncidents.data || [];
    const safeFilters = filters || {};

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(safeFilters.status || 'all');
    const [selectedIncident, setSelectedIncident] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // AI Remediation Modal state
    const [aiIncident, setAiIncident] = useState<any>(null);
    const [showAiModal, setShowAiModal] = useState(false);

    // Popup loader modal state
    const [isFiltering, setIsFiltering] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Mohon tunggu sebentar...');

    const executeFilter = (url: string, params: Record<string, any>, msg: string, isPost = false) => {
        setLoaderMessage(msg);
        setIsFiltering(true);
        const startTime = Date.now();

        const options = {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 450 - elapsed);
                setTimeout(() => {
                    setIsFiltering(false);
                }, remaining);
            },
            onError: () => {
                setIsFiltering(false);
            }
        };

        if (isPost) {
            router.post(url, params, options);
        } else {
            router.get(url, params, options);
        }
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const msg = searchTerm.trim() ? `Mencari insiden "${searchTerm.trim()}"...` : 'Memuat data insiden...';
            executeFilter(route('incidents.index'), { search: searchTerm, status: statusFilter }, msg);
        }
    };

    const handleFilterClick = (status: string) => {
        setStatusFilter(status);
        const statusMap: Record<string, string> = {
            'all': 'semua insiden',
            'critical': 'insiden Kritis',
            'open': 'insiden Terbuka',
            'investigating': 'insiden Dalam Peninjauan',
            'resolved': 'insiden Selesai'
        };
        executeFilter(route('incidents.index'), { search: searchTerm, status }, `Memuat ${statusMap[status] || status}...`);
    };

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        executeFilter(route('incidents.index'), {}, 'Mereset filter insiden...');
    };

    const handleMarkAllResolved = () => {
        executeFilter(route('incidents.mark-all-resolved'), {}, 'Menandai seluruh insiden aktif sebagai selesai...', true);
    };

    const openDetail = (incident: any) => {
        setSelectedIncident(incident);
        setShowDetailModal(true);
    };

    const openAiRemediation = (e: React.MouseEvent, incident: any) => {
        e.stopPropagation();
        setAiIncident(incident);
        setShowAiModal(true);
    };

    const renderSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': 
                return <span className="sev-badge sev-critical d-inline-flex align-items-center gap-1" style={{ background: 'rgba(200,51,42,0.12)', color: '#c8332a', border: '1px solid rgba(200,51,42,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c8332a', boxShadow: '0 0 6px #c8332a' }}></span> Kritis</span>;
            case 'high': 
                return <span className="sev-badge sev-high" style={{ background: 'rgba(255,122,110,0.12)', color: '#ff7a6e', border: '1px solid rgba(255,122,110,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}>Tinggi</span>;
            case 'medium': 
                return <span className="sev-badge sev-medium" style={{ background: 'rgba(251,191,36,0.12)', color: '#d97706', border: '1px solid rgba(251,191,36,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}>Sedang</span>;
            case 'low': 
                return <span className="sev-badge sev-low" style={{ background: 'rgba(14,165,163,0.12)', color: '#0ea5a3', border: '1px solid rgba(14,165,163,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}>Rendah</span>;
            default: 
                return <span className="sev-badge sev-low">{severity}</span>;
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'open': 
                return <span className="status-badge st-open d-inline-flex align-items-center gap-1" style={{ background: 'rgba(255, 122, 110, 0.12)', color: '#ff7a6e', border: '1px solid rgba(255,122,110,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><i className="bi bi-exclamation-circle me-1"></i> Terbuka</span>;
            case 'investigating':
            case 'acknowledged': 
                return <span className="status-badge st-ack" style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#d97706', border: '1px solid rgba(251,191,36,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><i className="bi bi-hourglass-split me-1"></i> Ditinjau</span>;
            case 'resolved': 
                return <span className="status-badge st-resolved" style={{ background: 'rgba(14, 165, 163, 0.12)', color: '#0ea5a3', border: '1px solid rgba(14,165,163,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><i className="bi bi-check2-circle me-1"></i> Selesai</span>;
            case 'false_positive': 
                return <span className="status-badge st-false" style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#64748b', border: '1px solid rgba(100,116,139,0.3)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}><i className="bi bi-shield-x me-1"></i> Bukan Insiden</span>;
            default: 
                return <span className="status-badge">{status}</span>;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'defacement': return { icon: 'bi bi-pencil-square', bg: 'linear-gradient(135deg,var(--sun),#ff9d6e)' };
            case 'down':
            case 'uptime': return { icon: 'bi bi-hdd-network-fill', bg: 'linear-gradient(135deg,#ff7a6e,#c8332a)' };
            case 'keyword_found': return { icon: 'bi bi-bug', bg: 'linear-gradient(135deg,#ff7a6e,#ff9d6e)' };
            case 'error': return { icon: 'bi bi-file-earmark-lock2', bg: 'linear-gradient(135deg,var(--violet),#a78bfa)' };
            default: return { icon: 'bi bi-shield-exclamation', bg: 'linear-gradient(135deg,var(--teal-1),var(--teal-2))' };
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Insiden" />

            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
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
                            Riwayat insiden dari seluruh situs terpantau — {stats.active ?? (stats.total - stats.resolved)} insiden belum selesai.
                        </p>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button 
                        className="btn shadow-sm d-flex align-items-center gap-1.5"
                        style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', padding: '0.5rem 0.95rem', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}
                        onClick={handleMarkAllResolved}
                        title="Tandai Seluruh Insiden Aktif Sebagai Selesai"
                    >
                        <i className="bi bi-check2-all text-teal" style={{ color: 'var(--teal-1)', fontSize: '1rem' }}></i>
                        <span>Tandai Semua Selesai</span>
                    </button>
                </div>
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
                                <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--sun)', lineHeight: '1.2', marginTop: '0.2rem' }}>{stats.investigating ?? (stats.total - stats.resolved - stats.open)}</div>
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

            <div className="glass-card mb-4">
                {/* Toolbar */}
                <div className="toolbar flex-wrap gap-2">
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
                    <div className={`filter-chip ${statusFilter === 'investigating' ? 'active' : ''}`} onClick={() => handleFilterClick('investigating')}>Ditinjau</div>
                    <div className={`filter-chip ${statusFilter === 'resolved' ? 'active' : ''}`} onClick={() => handleFilterClick('resolved')}>Selesai</div>

                    <button 
                        className="btn btn-light ms-auto" 
                        style={{ 
                            height: '38px', borderRadius: '10px', padding: '0 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                            border: '1px solid rgba(0,0,0,0.08)', background: '#ffffff', color: 'var(--ink-dark)', fontSize: '0.82rem', fontWeight: 600,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)', transition: 'all 0.2s'
                        }} 
                        onClick={handleReset} 
                        title="Reset Filter & Segarkan Data"
                    >
                        <i className="bi bi-arrow-clockwise" style={{ fontSize: '1rem' }}></i> Reset
                    </button>
                </div>

                {/* List */}
                <div>
                    {safeData.length === 0 ? (
                        <EmptyState 
                            icon="bi-shield-check"
                            title="Sistem Aman & Terkendali"
                            description="Belum ada insiden keamanan yang terdeteksi. Mesin pemantau terus berjalan secara real-time di latar belakang."
                        />
                    ) : (
                        safeData.map((incident) => {
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
                                    <div className="inc-right d-flex align-items-center gap-2">
                                        {renderSeverityBadge(incident.severity)}
                                        {renderStatusBadge(incident.status)}
                                        <button 
                                            type="button" 
                                            className="btn btn-sm text-white border-0 d-inline-flex align-items-center gap-1 shadow-sm"
                                            style={{ 
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                                                borderRadius: '8px', 
                                                fontWeight: 600, 
                                                fontSize: '0.78rem',
                                                padding: '0.35rem 0.65rem'
                                            }}
                                            onClick={(e) => openAiRemediation(e, incident)}
                                            title="Tampilkan analisis & solusi perbaikan otomatis AI"
                                        >
                                            <i className="bi bi-magic" style={{ fontSize: '0.85rem' }}></i>
                                            <span>Solusi AI</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                <Pagination meta={safeIncidents.meta} links={safeIncidents.links} itemLabel="insiden" />
            </div>

            {/* Modals */}
            <DetailIncidentModal 
                show={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                incident={selectedIncident}
                onOpenAi={(inc) => {
                    setShowDetailModal(false);
                    setAiIncident(inc);
                    setShowAiModal(true);
                }}
            />

            <AiRemediationModal 
                show={showAiModal}
                onClose={() => setShowAiModal(false)}
                incident={aiIncident}
            />

            {/* Popup Loader Modal for Filters */}
            <PopupLoader 
                isOpen={isFiltering} 
                status="loading" 
                message={loaderMessage} 
                title="Sedang Memproses..."
            />

        </AuthenticatedLayout>
    );
}
