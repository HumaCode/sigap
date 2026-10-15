import React, { useState } from 'react';
import Pagination from '@/Components/Pagination';

interface ScorecardTableProps {
    leaderboard: any[];
    onSelectSite: (site: any) => void;
}

export default function ScorecardTable({ leaderboard, onSelectSite }: ScorecardTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 15;

    const totalPages = Math.ceil(leaderboard.length / perPage);
    const paginatedItems = leaderboard.slice((currentPage - 1) * perPage, currentPage * perPage);

    if (leaderboard.length === 0) {
        return (
            <div className="glass-card p-5 text-center" style={{ borderRadius: '16px' }}>
                <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3 mb-1" style={{ fontWeight: 700, color: '#0f2a3f' }}>Tidak Ada Data Evaluasi</h5>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    Tidak ditemukan data situs yang sesuai dengan kriteria filter pencarian atau kategori situs.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden" style={{ borderRadius: '16px', border: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
            <div className="table-responsive">
                <table className="table align-middle mb-0" style={{ fontSize: '0.86rem' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
                        <tr>
                            <th style={{ width: '80px', padding: '1rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                                Peringkat
                            </th>
                            <th style={{ padding: '1rem', fontWeight: 700, color: '#475569' }}>
                                Website & Layanan
                            </th>
                            <th style={{ width: '130px', padding: '1rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                                Mutu (Grade)
                            </th>
                            <th style={{ width: '160px', padding: '1rem', fontWeight: 700, color: '#475569' }}>
                                Skor Kematangan
                            </th>
                            <th style={{ width: '220px', padding: '1rem', fontWeight: 700, color: '#475569' }}>
                                Rincian 3 Pilar Penilaian
                            </th>
                            <th style={{ width: '130px', padding: '1rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.map((item) => {
                            const isTop3 = item.rank <= 3;
                            return (
                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(15, 42, 63, 0.05)', transition: 'background 0.15s' }}>
                                    {/* Peringkat */}
                                    <td className="text-center" style={{ padding: '0.9rem' }}>
                                        {item.rank === 1 ? (
                                            <span className="badge rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: '#fef3c7', color: '#b45309', border: '1.5px solid #f59e0b', fontWeight: 800 }}>
                                                🥇
                                            </span>
                                        ) : item.rank === 2 ? (
                                            <span className="badge rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: '#f1f5f9', color: '#475569', border: '1.5px solid #94a3b8', fontWeight: 800 }}>
                                                🥈
                                            </span>
                                        ) : item.rank === 3 ? (
                                            <span className="badge rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: '#ffedd5', color: '#9a3412', border: '1.5px solid #ea580c', fontWeight: 800 }}>
                                                🥉
                                            </span>
                                        ) : (
                                            <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.9rem' }}>
                                                #{item.rank}
                                            </span>
                                        )}
                                    </td>

                                    {/* Website & Instansi */}
                                    <td style={{ padding: '0.9rem' }}>
                                        <div className="d-flex flex-column">
                                            <div className="d-flex align-items-center gap-2">
                                                <strong style={{ color: '#0f2a3f', fontSize: '0.92rem' }}>
                                                    {item.name}
                                                </strong>
                                                <span className="badge bg-light text-secondary border px-2 py-0.5" style={{ fontSize: '0.72rem', fontWeight: 500 }}>
                                                    {item.category}
                                                </span>
                                            </div>
                                            <a 
                                                href={item.url.startsWith('http') ? item.url : `https://${item.url}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-decoration-none text-muted mt-0.5"
                                                style={{ fontSize: '0.78rem' }}
                                            >
                                                {item.url} <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '0.7rem' }}></i>
                                            </a>
                                        </div>
                                    </td>

                                    {/* Grade */}
                                    <td className="text-center" style={{ padding: '0.9rem' }}>
                                        <span 
                                            className="badge px-3 py-1.5"
                                            style={{
                                                background: item.grade === 'A+' ? '#fef3c7' : (item.grade === 'A' ? '#e0f2fe' : (item.grade === 'B' ? '#ccfbf1' : (item.grade === 'C' ? '#fef3c7' : '#fee2e2'))),
                                                color: item.grade_color,
                                                border: `1.5px solid ${item.grade_color}`,
                                                fontWeight: 800,
                                                fontSize: '0.88rem',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            Grade {item.grade}
                                        </span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginTop: '3px' }}>
                                            {item.grade_label}
                                        </div>
                                    </td>

                                    {/* Total Skor */}
                                    <td style={{ padding: '0.9rem' }}>
                                        <div className="d-flex align-items-baseline gap-1 mb-1">
                                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f2a3f' }}>
                                                {item.total_score}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', fontWeight: 600 }}>
                                                / 100 Poin
                                            </span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(15, 42, 63, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div 
                                                style={{ 
                                                    width: `${Math.min(100, item.total_score)}%`, 
                                                    height: '100%', 
                                                    background: item.total_score >= 85 ? 'var(--teal-1)' : (item.total_score >= 70 ? '#0284c7' : (item.total_score >= 50 ? '#d97706' : '#dc2626')),
                                                    borderRadius: '999px' 
                                                }} 
                                            />
                                        </div>
                                    </td>

                                    {/* Rincian 3 Pilar */}
                                    <td style={{ padding: '0.9rem' }}>
                                        <div className="d-flex flex-column gap-1" style={{ fontSize: '0.75rem' }}>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">Uptime (40%):</span>
                                                <strong>{item.breakdown.uptime.score} / 40 ({item.breakdown.uptime.raw_value})</strong>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">Keamanan/SSL (30%):</span>
                                                <strong>{item.breakdown.security.score} / 30</strong>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">Bebas Insiden (30%):</span>
                                                <strong>{item.breakdown.incidents.score} / 30</strong>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Aksi */}
                                    <td className="text-center" style={{ padding: '0.9rem' }}>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                            onClick={() => onSelectSite(item)}
                                            style={{ borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600 }}
                                        >
                                            <i className="bi bi-eye"></i>
                                            <span>Evaluasi</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Standard Reusable SIGAP Pagination Component */}
            {leaderboard.length > 0 && (
                <div className="bg-white">
                    <Pagination
                        meta={{
                            current_page: currentPage,
                            last_page: totalPages,
                            from: ((currentPage - 1) * perPage) + 1,
                            to: Math.min(currentPage * perPage, leaderboard.length),
                            total: leaderboard.length,
                            per_page: perPage,
                        }}
                        itemLabel="situs"
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            )}
        </div>
    );
}
