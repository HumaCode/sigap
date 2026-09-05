import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import EmptyState from '@/Components/EmptyState';
import SecurityRow from './Partials/SecurityRow';
import { toast } from '@/Components/DynamicToast';
import '../../../css/security.css';
import PopupLoader from '@/Components/PopupLoader';

interface CheckItem {
    key: string;
    title: string;
    status: 'ok' | 'fail' | 'warn';
    desc: string;
    fix?: string;
}

interface SecurityData {
    id: string;
    site_id: string;
    site: {
        id: string;
        name: string;
        url: string;
        category: string;
    };
    score: number;
    grade: string;
    issues_count: number;
    checks: CheckItem[];
    last_scanned_at: string;
}

interface IndexProps {
    securities: {
        data: SecurityData[];
        links?: any[];
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            path: string;
            per_page: number;
            to: number;
            total: number;
            links: any[];
        };
    };
    filters: {
        search?: string;
        filter?: string;
    };
    stats: {
        avg_score: number;
        env_exposed: number;
        csp_missing: number;
        ssl_warning: number;
    };
}

export default function Index({ securities, filters, stats }: IndexProps) {
    const safeSecurities = securities || { data: [], meta: { total: 0, last_page: 1, links: [] } };
    const safeFilters = filters || {};
    const safeStats = stats || { avg_score: 0, env_exposed: 0, csp_missing: 0, ssl_warning: 0 };

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [activeFilter, setActiveFilter] = useState(safeFilters.filter || 'all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isScanningAll, setIsScanningAll] = useState(false);

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

    // Debounced search
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchTerm !== (safeFilters.search || '')) {
                const msg = searchTerm.trim() ? `Mencari situs "${searchTerm.trim()}"...` : 'Memuat data audit keamanan...';
                executeFilter(route('security.index'), { search: searchTerm, filter: activeFilter }, msg);
            }
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const handleFilterClick = (filterType: string) => {
        setActiveFilter(filterType);
        const filterNameMap: Record<string, string> = {
            'all': 'semua laporan keamanan',
            'critical': 'temuan kritis',
            'warn': 'situs ada peringatan',
            'clean': 'situs status aman'
        };
        executeFilter(route('security.index'), { search: searchTerm, filter: filterType }, `Memuat ${filterNameMap[filterType] || filterType}...`);
    };

    const handleRefresh = () => {
        setSearchTerm('');
        setActiveFilter('all');
        executeFilter(route('security.index'), { search: '', filter: 'all' }, 'Menyegarkan data keamanan situs...');
    };

    const handleScanAll = () => {
        setIsScanningAll(true);
        executeFilter(route('security.scan'), {}, 'Memindai ulang keamanan seluruh situs...', true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Keamanan Situs" />

            {/* Breadcrumbs / Header area */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--teal-1), var(--blue-1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', flexShrink: 0, boxShadow: '0 8px 16px rgba(14,165,163,0.2)' }}>
                        <i className="bi bi-shield-check" style={{ display: 'block', margin: 'auto' }}></i>
                    </div>
                    <div>
                        <h2 className="page-title m-0" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)' }}>Keamanan Situs</h2>
                        <p className="page-sub m-0 mt-1" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Pemeriksaan header keamanan, berkas terekspos, dan sertifikat SSL seluruh situs.</p>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-light shadow-sm d-flex align-items-center justify-content-center"
                        style={{ border: '1px solid var(--line)', color: 'var(--ink-soft)', background: 'rgba(255,255,255,0.8)', borderRadius: '12px', width: '42px', height: '42px' }}
                        title="Segarkan Data & Reset Filter"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin' : ''}`}></i>
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="glass-card stat-pill">
                        <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))' }}><i className="bi bi-shield-check"></i></div>
                        <div>
                            <div className="val">{safeStats.avg_score}%</div>
                            <div className="lbl">Rata-rata Skor Keamanan</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="glass-card stat-pill">
                        <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--coral), #ff9d6e)' }}><i className="bi bi-file-earmark-lock2"></i></div>
                        <div>
                            <div className="val">{safeStats.env_exposed}</div>
                            <div className="lbl">File .env / Sensitif Terekspos</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="glass-card stat-pill">
                        <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--sun), #ff9d6e)' }}><i className="bi bi-shield-x"></i></div>
                        <div>
                            <div className="val">{safeStats.csp_missing}</div>
                            <div className="lbl">Header CSP Hilang</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="glass-card stat-pill">
                        <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--blue-1), var(--blue-2))' }}><i className="bi bi-clock-history"></i></div>
                        <div>
                            <div className="val">{safeStats.ssl_warning}</div>
                            <div className="lbl">SSL Akan Kedaluwarsa</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="glass-card mb-4">
                {/* Grade Legend Bar */}
                <div className="d-flex align-items-center gap-3 px-3 pt-3 pb-2 flex-wrap" style={{ fontSize: '0.78rem', borderBottom: '1px solid var(--line)', background: 'rgba(255,255,255,0.4)', borderRadius: '16px 16px 0 0' }}>
                    <span className="fw-semibold text-muted me-1"><i className="bi bi-info-circle me-1" style={{ color: 'var(--teal-1)' }}></i>Legenda Audit:</span>
                    <span className="d-inline-flex align-items-center gap-1"><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#0ea5a3' }}></span> Grade A (≥90% Sempurna)</span>
                    <span className="d-inline-flex align-items-center gap-1"><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#3b82f6' }}></span> Grade B (75-89% Baik)</span>
                    <span className="d-inline-flex align-items-center gap-1"><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ffb648' }}></span> Grade C (60-74% Perbaikan)</span>
                    <span className="d-inline-flex align-items-center gap-1"><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff7a6e' }}></span> Grade F (&lt;60% Kritis)</span>
                    <span className="d-inline-flex align-items-center gap-1"><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }}></span> Offline (Ditangguhkan)</span>
                </div>

                {/* Toolbar */}
                <div className="toolbar flex-wrap gap-2">
                    <div className="search-local">
                        <i className="bi bi-search"></i>
                        <input 
                            type="text" 
                            placeholder="Cari nama situs atau URL..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div 
                        className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`} 
                        onClick={() => handleFilterClick('all')}
                    >
                        Semua
                    </div>
                    <div 
                        className={`filter-chip ${activeFilter === 'critical' ? 'active' : ''}`} 
                        onClick={() => handleFilterClick('critical')}
                    >
                        Temuan Kritis
                    </div>
                    <div 
                        className={`filter-chip ${activeFilter === 'warn' ? 'active' : ''}`} 
                        onClick={() => handleFilterClick('warn')}
                    >
                        Ada Peringatan
                    </div>
                    <div 
                        className={`filter-chip ${activeFilter === 'clean' ? 'active' : ''}`} 
                        onClick={() => handleFilterClick('clean')}
                    >
                        Aman
                    </div>
                    <button 
                        className="btn-scan ms-auto" 
                        onClick={handleScanAll}
                        disabled={isScanningAll}
                    >
                        {isScanningAll ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Memindai...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-arrow-repeat"></i>
                                <span>Pindai Ulang Semua</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Accordion list */}
                <div>
                    {safeSecurities.data && safeSecurities.data.length > 0 ? (
                        safeSecurities.data.map((security) => (
                            <SecurityRow 
                                key={security.id} 
                                security={security} 
                            />
                        ))
                    ) : (
                        <div className="p-5">
                            <EmptyState 
                                icon="bi-shield-slash"
                                title="Data Keamanan Situs Tidak Ditemukan"
                                description="Tidak ada laporan keamanan situs yang cocok dengan kata kunci atau filter terpilih."
                                actionLabel="Pindai Ulang Semua"
                                onAction={handleScanAll}
                            />
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <Pagination meta={safeSecurities.meta} links={safeSecurities.links} itemLabel="laporan keamanan" />
            </div>

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
