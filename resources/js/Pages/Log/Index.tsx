import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { useState } from 'react';
import { toast } from '@/Components/DynamicToast';
import DetailLogModal from './Partials/DetailLogModal';
import '../../../css/detection.css';
import EmptyState from '@/Components/EmptyState';

interface LogProps extends PageProps {
    logs: { data: any[]; links: any[]; meta: any };
    filters: { search?: string; filter?: string };
    stats: any;
}

export default function DetectionLog({ logs, filters, stats }: LogProps) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [activeFilter, setActiveFilter] = useState(filters?.filter || 'all');
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            router.get(route('logs.detection'), { search: searchTerm, filter: activeFilter }, { preserveState: true });
        }
    };

    const handleFilter = (filter: string) => {
        setActiveFilter(filter);
        router.get(route('logs.detection'), { search: searchTerm, filter }, { preserveState: true });
    };

    const handleUpdateStatus = (id: string, status: string) => {
        router.patch(route('logs.detection.status', id), { status }, {
            preserveScroll: true,
            onSuccess: () => {
                let actionText = 'diperbarui';
                if (status === 'blocked') actionText = 'diblokir';
                if (status === 'false_positive') actionText = 'ditandai sebagai bukan spam';
                toast.success('Berhasil', `Status log deteksi berhasil ${actionText}.`);
            },
            onError: () => {
                toast.error('Gagal', 'Terjadi kesalahan saat memperbarui status.');
            }
        });
    };

    const getCatBadge = (category: string) => {
        switch (category) {
            case 'judol': return <span className="cat-tag cat-judol">Judi Online</span>;
            case 'obat': return <span className="cat-tag cat-obat">Obat Terlarang</span>;
            case 'hidden': return <span className="cat-tag cat-hidden">Teks Tersembunyi</span>;
            case 'newpage': return <span className="cat-tag cat-newpage">Halaman Baru</span>;
            default: return <span className="cat-tag">{category}</span>;
        }
    };

    const getIconInfo = (category: string) => {
        switch (category) {
            case 'judol': return { bg: 'linear-gradient(135deg,#ff7a6e,#ff9d6e)', icon: 'bi-dice-5' };
            case 'obat': return { bg: 'linear-gradient(135deg,var(--violet),#a78bfa)', icon: 'bi-capsule' };
            case 'hidden': return { bg: 'linear-gradient(135deg,var(--blue-1),var(--blue-2))', icon: 'bi-eye-slash' };
            case 'newpage': return { bg: 'linear-gradient(135deg,var(--teal-1),var(--teal-2))', icon: 'bi-file-earmark-plus' };
            default: return { bg: 'linear-gradient(135deg,var(--ink-soft),var(--ink-faint))', icon: 'bi-bug' };
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return <span className="status-badge st-new">Baru</span>;
            case 'reviewed': return <span className="status-badge st-reviewed">Ditinjau</span>;
            case 'blocked': return <span className="status-badge st-blocked">Diblokir</span>;
            case 'false_positive': return <span className="status-badge st-false">Bukan Spam</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get(route('logs.detection'), { search: searchTerm, filter: activeFilter }, { 
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setIsRefreshing(false);
                toast.info('Segarkan', 'Data log deteksi terbaru telah dimuat.');
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Log Deteksi Konten" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--teal-1), var(--blue-1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', flexShrink: 0, boxShadow: '0 8px 16px rgba(14,165,163,0.2)' }}>
                        <i className="bi bi-bug-fill"></i>
                    </div>
                    <div>
                        <h2 className="page-title m-0" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)' }}>Log Deteksi Konten</h2>
                        <p className="page-sub m-0 mt-1" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Riwayat mesin pemindai mendeteksi sisipan kata kunci, tautan, dan konten mencurigakan.</p>
                    </div>
                </div>
                
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-light shadow-sm d-flex align-items-center justify-content-center"
                        style={{ border: '1px solid var(--line)', color: 'var(--ink-soft)', background: 'rgba(255,255,255,0.8)', borderRadius: '12px', width: '42px', height: '42px' }}
                        title="Segarkan Data"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spinner-border spinner-border-sm' : ''}`} style={isRefreshing ? { borderWidth: '2px' } : {}}></i>
                    </button>
                </div>
            </div>

            {/* Stat pills */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="glass-card stat-pill">
                        <div className="icon-circle" style={{background: 'linear-gradient(135deg,var(--teal-1),var(--teal-2))'}}><i className="bi bi-search"></i></div>
                        <div><div className="val">{stats.total_scanned.toLocaleString()}</div><div className="lbl">Halaman dipindai hari ini</div></div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card stat-pill">
                        <div className="icon-circle" style={{background: 'linear-gradient(135deg,var(--coral),#ff9d6e)'}}><i className="bi bi-bug"></i></div>
                        <div><div className="val">{stats.total_detections}</div><div className="lbl">Deteksi ditemukan</div></div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card stat-pill">
                        <div className="icon-circle" style={{background: 'linear-gradient(135deg,var(--violet),#a78bfa)'}}><i className="bi bi-capsule"></i></div>
                        <div><div className="val">{stats.drugs_category}</div><div className="lbl">Kategori obat terlarang</div></div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card stat-pill">
                        <div className="icon-circle" style={{background: 'linear-gradient(135deg,var(--sun),#ff9d6e)'}}><i className="bi bi-dice-5"></i></div>
                        <div><div className="val">{stats.gambling_category}</div><div className="lbl">Kategori judi online</div></div>
                    </div>
                </div>
            </div>

            <div className="glass-card">
                {/* Live feed header */}
                <div className="live-feed-header">
                    <span className="scan-pulse"></span>
                    <span style={{fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink-soft)'}}>Pemindaian berjalan otomatis — entri baru akan muncul di atas secara real-time</span>
                </div>

                {/* Toolbar */}
                <div className="toolbar">
                    <div className="search-local">
                        <i className="bi bi-search"></i>
                        <input 
                            type="text" 
                            placeholder="Cari kata kunci, URL, situs..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                    <div className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>Semua</div>
                    <div className={`filter-chip ${activeFilter === 'judol' ? 'active' : ''}`} onClick={() => handleFilter('judol')}><span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#c8332a',display:'inline-block'}}></span>Judi Online</div>
                    <div className={`filter-chip ${activeFilter === 'obat' ? 'active' : ''}`} onClick={() => handleFilter('obat')}><span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--violet)',display:'inline-block'}}></span>Obat Terlarang</div>
                    <div className={`filter-chip ${activeFilter === 'hidden' ? 'active' : ''}`} onClick={() => handleFilter('hidden')}><span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--blue-1)',display:'inline-block'}}></span>Teks Tersembunyi</div>
                    <div className={`filter-chip ${activeFilter === 'newpage' ? 'active' : ''}`} onClick={() => handleFilter('newpage')}><span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--teal-1)',display:'inline-block'}}></span>Halaman Baru</div>
                </div>

                {/* Log feed */}
                <div>
                    {logs.data.length > 0 ? logs.data.map(log => {
                        const iconData = getIconInfo(log.category);
                        return (
                            <div key={log.id} className="log-item">
                                <div className="log-icon" style={{background: iconData.bg}}><i className={`bi ${iconData.icon}`}></i></div>
                                <div className="flex-grow-1 min-w-0">
                                    <p className="log-title">{log.title} {getCatBadge(log.category)}</p>
                                    <div className="log-context" dangerouslySetInnerHTML={{ __html: log.context }}></div>
                                    <div className="log-meta">
                                        <span><i className="bi bi-globe2"></i> {log.site?.name || 'Situs Tidak Diketahui'}</span>
                                        <span><i className="bi bi-link-45deg"></i> {log.url_path || '/'}</span>
                                        <span><i className="bi bi-clock"></i> {log.created_at}</span>
                                    </div>
                                </div>
                                <div className="log-right">
                                    {getStatusBadge(log.status)}
                                    <div className="log-actions">
                                        <button onClick={() => handleUpdateStatus(log.id, 'blocked')} className="mini-action" title="Blokir"><i className="bi bi-slash-circle"></i></button>
                                        <button onClick={() => handleUpdateStatus(log.id, 'false_positive')} className="mini-action" title="Bukan spam"><i className="bi bi-flag"></i></button>
                                        <button onClick={() => { setSelectedLog(log); setShowModal(true); }} className="mini-action" title="Lihat detail"><i className="bi bi-eye"></i></button>
                                    </div>
                                </div>
                            </div>
                        )
                    }) : (
                        <EmptyState 
                            icon="bi-receipt-cutoff"
                            title="Belum Ada Log Deteksi"
                            description="Riwayat log pemindaian konten masih kosong. Seluruh aktivitas deteksi sisipan konten mencurigakan akan muncul di sini."
                        />
                    )}
                </div>
            </div>

            <DetailLogModal
                showModal={showModal}
                setShowModal={setShowModal}
                selectedLog={selectedLog}
                handleUpdateStatus={handleUpdateStatus}
                getCatBadge={getCatBadge}
                getIconInfo={getIconInfo}
                getStatusBadge={getStatusBadge}
            />
        </AuthenticatedLayout>
    );
}
