import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import '../../../css/sites.css';
import AddSiteModal from './Partials/AddSiteModal';

export default function Index(props: any) {
    const sites = props.sites || { data: [], meta: { total: 0, from: 0, to: 0, last_page: 1 } };
    const filters = props.filters || {};
    const initialSearch = filters.search ? String(filters.search) : '';
    const initialFilter = filters.filter ? String(filters.filter) : 'all';

    const [search, setSearch] = useState(initialSearch);
    const [filter, setFilter] = useState(initialFilter);
    const [showModal, setShowModal] = useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        router.get(route('sites.index'), { search: e.target.value, filter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleFilter = (f: string) => {
        setFilter(f);
        router.get(route('sites.index'), { search, filter: f }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const getSiteFavicon = (category: string) => {
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

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'up': return <span className="status-chip chip-up"><span className="chip-dot"></span>Online</span>;
            case 'down': return <span className="status-chip chip-down"><span className="chip-dot"></span>Down</span>;
            case 'warn': return <span className="status-chip chip-warn"><span className="chip-dot"></span>Lambat</span>;
            case 'paused': return <span className="status-chip chip-paused"><span className="chip-dot"></span>Nonaktif</span>;
            default: return <span className="status-chip chip-up"><span className="chip-dot"></span>Online</span>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Daftar Situs" />
            
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-1">
                <div>
                    <div className="page-title">Daftar Situs</div>
                    <p className="page-sub">Kelola seluruh situs OPD yang dipantau — {sites.meta ? sites.meta.total : 0} situs terdaftar.</p>
                </div>
            </div>

            {/* Mini stat row */}
            <div className="row g-3 mb-3">
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3">
                        <div className="d-flex align-items-center gap-2 mb-1" style={{ color: 'var(--ink-faint)', fontSize: '0.75rem' }}><i className="bi bi-hdd-network"></i> Total Situs</div>
                        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{props.stats?.total || 0}</div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3">
                        <div className="d-flex align-items-center gap-2 mb-1" style={{ color: 'var(--teal-1)', fontSize: '0.75rem' }}><i className="bi bi-check-circle"></i> Online</div>
                        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{props.stats?.up || 0}</div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3">
                        <div className="d-flex align-items-center gap-2 mb-1" style={{ color: '#e0453a', fontSize: '0.75rem' }}><i className="bi bi-x-circle"></i> Down</div>
                        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{props.stats?.down || 0}</div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card p-3">
                        <div className="d-flex align-items-center gap-2 mb-1" style={{ color: 'var(--ink-faint)', fontSize: '0.75rem' }}><i className="bi bi-pause-circle"></i> Nonaktif</div>
                        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{props.stats?.paused || 0}</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="glass-card mb-0">
                <div className="toolbar">
                    <div className="search-local">
                        <i className="bi bi-search"></i>
                        <input 
                            type="text" 
                            placeholder="Cari nama situs atau URL..." 
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>Semua</div>
                    <div className={`filter-chip ${filter === 'up' ? 'active' : ''}`} onClick={() => handleFilter('up')}><span className="chip-dot" style={{ background: 'var(--teal-1)' }}></span>Online</div>
                    <div className={`filter-chip ${filter === 'down' ? 'active' : ''}`} onClick={() => handleFilter('down')}><span className="chip-dot" style={{ background: '#e0453a' }}></span>Down</div>
                    <div className={`filter-chip ${filter === 'warn' ? 'active' : ''}`} onClick={() => handleFilter('warn')}><span className="chip-dot" style={{ background: 'var(--sun)' }}></span>Lambat</div>
                    <div className={`filter-chip ${filter === 'paused' ? 'active' : ''}`} onClick={() => handleFilter('paused')}><i className="bi bi-pause-circle"></i></div>

                    <button className="btn-add-site" onClick={() => setShowModal(true)}>
                        <i className="bi bi-plus-lg"></i><span>Daftarkan Situs</span>
                    </button>
                </div>

                {/* Desktop table */}
                <div className="table-desktop" style={{ overflowX: 'auto' }}>
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Situs</th>
                                <th>Kategori</th>
                                <th>Status</th>
                                <th>Uptime 30 Hari</th>
                                <th>Interval Cek</th>
                                <th>PIC</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!sites.data || sites.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4">Tidak ada data situs.</td>
                                </tr>
                            ) : sites.data.map((site: any) => (
                                <tr key={site.id}>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            {getSiteFavicon(site.category)}
                                            <div>
                                                <p className="site-name">{site.name}</p>
                                                <p className="site-url">{site.url}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="category-tag">{site.category}</span></td>
                                    <td>{getStatusChip(site.status)}</td>
                                    <td>{site.uptime}%</td>
                                    <td>{site.check_interval} menit</td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{site.pic_name || '-'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="action-btn" title="Lihat detail"><i className="bi bi-eye"></i></button>
                                        <button className="action-btn" title="Ubah"><i className="bi bi-pencil"></i></button>
                                        <button 
                                            className="action-btn danger" 
                                            title="Hapus"
                                            onClick={() => {
                                                if (confirm('Apakah Anda yakin ingin menghapus situs ini?')) {
                                                    router.delete(route('sites.destroy', site.id));
                                                }
                                            }}
                                        ><i className="bi bi-trash"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile card list */}
                <div className="mobile-cards">
                    {!sites.data || sites.data.length === 0 ? (
                        <div className="text-center py-4">Tidak ada data situs.</div>
                    ) : sites.data.map((site: any) => (
                        <div className="site-card-mobile" key={site.id}>
                            <div className="top-row">
                                {getSiteFavicon(site.category)}
                                <div className="flex-grow-1 min-w-0">
                                    <p className="site-name">{site.name}</p>
                                    <p className="site-url">{site.url}</p>
                                </div>
                                {getStatusChip(site.status)}
                            </div>
                            <div className="meta-row">
                                <span><span className="category-tag">{site.category}</span></span>
                                <span>Uptime {site.uptime}%</span>
                            </div>
                            <div className="d-flex justify-content-end mt-2">
                                <button className="action-btn"><i className="bi bi-eye"></i></button>
                                <button className="action-btn"><i className="bi bi-pencil"></i></button>
                                <button 
                                    className="action-btn danger"
                                    onClick={() => {
                                        if (confirm('Apakah Anda yakin ingin menghapus situs ini?')) {
                                            router.delete(route('sites.destroy', site.id));
                                        }
                                    }}
                                ><i className="bi bi-trash"></i></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {sites.meta && sites.meta.last_page > 1 && (
                    <div className="pagination-footer">
                        <span style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>Menampilkan {sites.meta.from} - {sites.meta.to} dari {sites.meta.total} situs</span>
                        <div className="d-flex gap-1">
                            {sites.meta.links && sites.meta.links.map((link: any, index: number) => (
                                <Link 
                                    key={index} 
                                    href={link.url || '#'}
                                    className={`pg-btn ${link.active ? 'active' : ''} ${!link.url ? 'opacity-50' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AddSiteModal show={showModal} onClose={() => setShowModal(false)} />
        </AuthenticatedLayout>
    );
}
