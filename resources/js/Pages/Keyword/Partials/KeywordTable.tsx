import React from 'react';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import Tooltip from '@/Components/Tooltip';

export interface KeywordItem {
    id: string;
    keyword: string;
    category: string;
    type: string;
    is_active: boolean;
    creator_name?: string;
    created_at?: string;
    description?: string | null;
    [key: string]: any;
}

interface KeywordTableProps {
    keywords: {
        data: KeywordItem[];
        meta?: {
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            total: number;
        };
        links?: any[];
    };
    canEdit?: boolean;
    canDelete?: boolean;
    onEdit: (kw: KeywordItem) => void;
    onDelete: (kw: KeywordItem) => void;
    onToggleStatus: (kw: KeywordItem) => void;
    onAdd: () => void;
    onPageChange: (page: number) => void;
}

export default function KeywordTable({
    keywords,
    canEdit = true,
    canDelete = true,
    onEdit,
    onDelete,
    onToggleStatus,
    onAdd,
    onPageChange,
}: KeywordTableProps) {
    const data = keywords?.data || [];

    const getCatBadge = (category: string) => {
        switch (category) {
            case 'judol': return <span className="category-tag cat-judol">Judi Online</span>;
            case 'obat': return <span className="category-tag cat-obat">Obat Terlarang</span>;
            case 'hidden': return <span className="category-tag" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7', border: '1px solid rgba(56, 189, 248, 0.3)' }}>Teks Tersembunyi</span>;
            case 'newpage': return <span className="category-tag" style={{ background: 'rgba(14, 165, 163, 0.15)', color: '#0ea5a3', border: '1px solid rgba(14, 165, 163, 0.3)' }}>Halaman Baru</span>;
            case 'phising': return <span className="category-tag cat-phising">Phising</span>;
            default: return <span className="category-tag cat-lainnya">Lainnya</span>;
        }
    };

    return (
        <div>
            {/* Desktop and Tablet table */}
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
                            {(canEdit || canDelete) && <th style={{ textAlign: 'right' }}>Aksi</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map((kw) => (
                            <tr key={kw.id}>
                                <td>
                                    <span className="kw-code">{kw.keyword}</span>
                                    {kw.description && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                                            <i className="bi bi-info-circle me-1" style={{ color: 'var(--teal-1)' }}></i>
                                            {kw.description}
                                        </div>
                                    )}
                                </td>
                                <td>{getCatBadge(kw.category)}</td>
                                <td>
                                    <span className={kw.type === 'regex' ? 'regex-badge' : 'plain-badge'}>
                                        {kw.type === 'regex' ? 'Regex' : 'Teks Biasa'}
                                    </span>
                                </td>
                                <td>
                                    <Tooltip 
                                        title={kw.is_active ? "Kata Kunci Aktif" : "Kata Kunci Nonaktif"}
                                        description={kw.is_active ? "Klik untuk menonaktifkan pemindaian" : "Klik untuk mengaktifkan pemindaian"}
                                        variant={kw.is_active ? "teal" : "dark"}
                                    >
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input toggle-active" 
                                            checked={kw.is_active} 
                                            onChange={() => onToggleStatus(kw)}
                                            disabled={!canEdit}
                                            style={{ cursor: canEdit ? 'pointer' : 'default' }}
                                        />
                                    </Tooltip>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="avatar-tiny">
                                            {kw.creator_name ? kw.creator_name.substring(0, 2).toUpperCase() : 'SY'}
                                        </div>
                                        <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                                            {kw.creator_name || 'System'}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>{kw.created_at || '-'}</td>
                                {(canEdit || canDelete) && (
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="d-inline-flex align-items-center justify-content-end gap-1.5">
                                            {canEdit && (
                                                <Tooltip 
                                                    title="Ubah Kata Kunci" 
                                                    description="Edit pola atau kategori deteksi"
                                                    variant="blue"
                                                >
                                                    <button 
                                                        type="button"
                                                        className="action-btn" 
                                                        onClick={() => onEdit(kw)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                </Tooltip>
                                            )}
                                            {canDelete && (
                                                <Tooltip 
                                                    title="Hapus Kata Kunci" 
                                                    description="Hapus pola dari kamus pemindai"
                                                    variant="danger"
                                                >
                                                    <button 
                                                        type="button"
                                                        className="action-btn danger" 
                                                        onClick={() => onDelete(kw)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <EmptyState 
                                icon="bi-journal-x"
                                title="Belum Ada Kata Kunci"
                                description="Daftar kata kunci pencarian atau pola regex untuk mesin pemindai masih kosong."
                                actionLabel={canEdit ? "Tambah Kata Kunci" : undefined}
                                onAction={canEdit ? onAdd : undefined}
                                colSpan={7}
                            />
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reusable Pagination - Always displayed consistently */}
            <div className="pt-3 px-3" style={{ borderTop: '1px solid var(--line)' }}>
                <Pagination 
                    meta={keywords.meta} 
                    links={keywords.links} 
                    itemLabel="kata kunci"
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
}
