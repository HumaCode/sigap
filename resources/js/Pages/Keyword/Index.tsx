import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';
import { toast } from '@/Components/DynamicToast';
import KeywordModal from './Partials/KeywordModal';
import '../../../css/keyword.css';
import Pagination from '@/Components/Pagination'; // Assuming Pagination is a generic component

interface Keyword {
    id: string;
    keyword: string;
    category: string;
    type: string;
    is_active: boolean;
    creator_name: string;
    created_at: string;
}

interface KeywordProps extends PageProps {
    keywords: {
        data: Keyword[];
        meta: any; // Include meta for pagination
    };
    filters: {
        search?: string;
        filter?: string;
    };
    stats: {
        total: number;
        judol: number;
        obat: number;
        regex: number;
    };
}

export default function Index({ 
    keywords, 
    filters, 
    stats 
}: KeywordProps) {
    // Force hot-reload check
    console.log('INDEX PROPS RECEIVED:', { keywords, filters, stats });
    
    // Ensure safe defaults
    const safeKeywords = keywords || { data: [], meta: { links: [], last_page: 1 } };
    const safeData = safeKeywords.data || [];
    const safeFilters = Array.isArray(filters) ? {} : (filters || {});
    const safeStats = stats || { total: 0, judol: 0, obat: 0, regex: 0 };

    const [searchTerm, setSearchTerm] = useState(safeFilters?.search || '');
    const [activeFilter, setActiveFilter] = useState(safeFilters?.filter || 'all');
    const [showModal, setShowModal] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchTerm !== (safeFilters?.search || '')) {
                router.get(route('keywords.index'), { search: searchTerm, filter: activeFilter }, { preserveState: true, preserveScroll: true });
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm, activeFilter]);

    const handleFilter = (filter: string) => {
        setActiveFilter(filter);
        router.get(route('keywords.index'), { search: searchTerm, filter }, { preserveState: true, preserveScroll: true });
    };

    const handleAdd = () => {
        setSelectedKeyword(null);
        setShowModal(true);
    };

    const handleEdit = (keyword: Keyword) => {
        setSelectedKeyword(keyword);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Yakin ingin menghapus kata kunci ini?')) {
            router.delete(route('keywords.destroy', id), {
                preserveScroll: true,
                onSuccess: () => toast.success('Berhasil', 'Kata kunci berhasil dihapus.'),
            });
        }
    };

    const toggleStatus = (keyword: Keyword) => {
        router.patch(route('keywords.update', keyword.id), { ...keyword, is_active: !keyword.is_active }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Berhasil', 'Status berhasil diubah.')
        });
    };

    const getCatBadge = (category: string) => {
        switch (category) {
            case 'judol': return <span className="category-tag cat-judol">Judi Online</span>;
            case 'obat': return <span className="category-tag cat-obat">Obat Terlarang</span>;
            case 'phising': return <span className="category-tag cat-phising">Phising</span>;
            default: return <span className="category-tag cat-lainnya">Lainnya</span>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kamus Kata Kunci" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', flexShrink: 0, boxShadow: '0 8px 16px rgba(14,165,163,0.2)' }}>
                        <i className="bi bi-journal-text"></i>
                    </div>
                    <div>
                        <h2 className="page-title m-0" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)' }}>Kamus Kata Kunci</h2>
                        <p className="page-sub m-0 mt-1" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Kelola daftar kata kunci & pola yang digunakan mesin deteksi sisipan konten.</p>
                    </div>
                </div>
            </div>

            {/* Stat pills */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="glass-card stat-pill h-100">
                        <div className="icon-circle" style={{background: 'linear-gradient(135deg,var(--teal-1),var(--teal-2))'}}><i className="bi bi-journal-code"></i></div>
                        <div><div className="val">{safeStats?.total || 0}</div><div className="lbl">Total Kata Kunci</div></div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card stat-pill h-100">
                        <div className="icon-circle" style={{background: 'linear-gradient(135deg,var(--coral),#ff9d6e)'}}><i className="bi bi-dice-5"></i></div>
                        <div><div className="val">{safeStats?.judol || 0}</div><div className="lbl">Judi Online</div></div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card stat-pill h-100">
                        <div className="icon-circle" style={{background: 'linear-gradient(135deg,var(--violet),#a78bfa)'}}><i className="bi bi-capsule"></i></div>
                        <div><div className="val">{safeStats?.obat || 0}</div><div className="lbl">Obat Terlarang</div></div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="glass-card stat-pill h-100">
                        <div className="icon-circle" style={{background: 'linear-gradient(135deg,var(--blue-1),var(--blue-2))'}}><i className="bi bi-code-slash"></i></div>
                        <div><div className="val">{safeStats?.regex || 0}</div><div className="lbl">Pola Regex Aktif</div></div>
                    </div>
                </div>
            </div>

            <div className="glass-card mb-4">
                {/* Toolbar */}
                <div className="toolbar">
                    <div className="search-local">
                        <i className="bi bi-search"></i>
                        <input 
                            type="text" 
                            placeholder="Cari kata kunci..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>Semua</div>
                    <div className={`filter-chip ${activeFilter === 'judol' ? 'active' : ''}`} onClick={() => handleFilter('judol')}>Judi Online</div>
                    <div className={`filter-chip ${activeFilter === 'obat' ? 'active' : ''}`} onClick={() => handleFilter('obat')}>Obat Terlarang</div>
                    <div className={`filter-chip ${activeFilter === 'phising' ? 'active' : ''}`} onClick={() => handleFilter('phising')}>Phising</div>
                    <button className="btn-add" onClick={handleAdd}>
                        <i className="bi bi-plus-lg"></i><span className="d-none d-sm-inline">Tambah Kata Kunci</span>
                    </button>
                </div>

                {/* Desktop table */}
                <div className="table-responsive">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Kata Kunci / Pola</th>
                                <th>Kategori</th>
                                <th>Tipe</th>
                                <th>Status</th>
                                <th>Ditambahkan Oleh</th>
                                <th>Tanggal</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safeData.length > 0 ? safeData.map((kw: Keyword) => (
                                <tr key={kw.id}>
                                    <td><span className="kw-code">{kw.keyword}</span></td>
                                    <td>{getCatBadge(kw.category)}</td>
                                    <td>
                                        <span className={kw.type === 'regex' ? 'regex-badge' : 'plain-badge'}>
                                            {kw.type === 'regex' ? 'Regex' : 'Teks Biasa'}
                                        </span>
                                    </td>
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input toggle-active" 
                                            checked={kw.is_active} 
                                            onChange={() => toggleStatus(kw)}
                                        />
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="avatar-tiny">{kw.creator_name ? kw.creator_name.substring(0, 2).toUpperCase() : 'SY'}</div>
                                            <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{kw.creator_name || 'System'}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>{kw.created_at}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="action-btn" title="Ubah" onClick={() => handleEdit(kw)}><i className="bi bi-pencil"></i></button>
                                        <button className="action-btn danger" title="Hapus" onClick={() => handleDelete(kw.id)}><i className="bi bi-trash"></i></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-5">
                                        <div className="d-flex flex-column align-items-center justify-content-center py-5">
                                            <div className="mb-4 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(14,165,163,0.1), rgba(59,130,246,0.1))', color: 'var(--teal-1)', fontSize: '2.5rem', boxShadow: 'inset 0 2px 6px rgba(14,165,163,0.08)' }}>
                                                <i className="bi bi-journal-x"></i>
                                            </div>
                                            <h5 style={{ fontWeight: 700, color: 'var(--ink)', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Belum Ada Kata Kunci</h5>
                                            <p className="text-muted mb-4" style={{ maxWidth: '320px', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                                Daftar kata kunci pencarian atau pola regex untuk mesin pemindai masih kosong.
                                            </p>
                                            <button 
                                                className="btn btn-primary d-flex align-items-center gap-2" 
                                                style={{ borderRadius: '12px', background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))', border: 'none', padding: '0.6rem 1.4rem', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 8px 16px rgba(14,165,163,0.25)' }}
                                                onClick={handleAdd}
                                            >
                                                <i className="bi bi-plus-lg"></i> Tambah Kata Kunci
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (using generic component) */}
                {safeKeywords?.meta?.last_page > 1 && (
                    <div className="p-3 border-top">
                        <Pagination links={safeKeywords.meta.links} />
                    </div>
                )}
            </div>

            <KeywordModal 
                show={showModal} 
                onClose={() => setShowModal(false)} 
                keyword={selectedKeyword} 
            />
        </AuthenticatedLayout>
    );
}
