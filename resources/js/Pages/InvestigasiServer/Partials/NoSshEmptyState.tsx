import React from 'react';
import { Link } from '@inertiajs/react';

interface NoSshEmptyStateProps {
    totalSitesCount?: number;
}

export default function NoSshEmptyState({ totalSitesCount = 0 }: NoSshEmptyStateProps) {
    return (
        <div 
            className="card border-0 shadow-sm text-center p-5 mx-auto"
            style={{
                maxWidth: '680px',
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 20px 45px -20px rgba(15, 42, 63, 0.12)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
            }}
        >
            <div 
                className="d-inline-flex align-items-center justify-content-center mx-auto mb-4"
                style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, rgba(14, 165, 163, 0.12), rgba(15, 42, 63, 0.08))',
                    color: 'var(--teal-1, #0ea5a3)',
                    fontSize: '2.5rem',
                    boxShadow: '0 8px 24px rgba(14, 165, 163, 0.15)',
                }}
            >
                <i className="bi bi-terminal-split"></i>
            </div>

            <h4 className="fw-bold mb-2" style={{ color: 'var(--ink, #0f2a3f)', letterSpacing: '-0.02em' }}>
                Koneksi SSH Belum Dikonfigurasi
            </h4>

            <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '480px', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Fitur <strong>Investigasi Server CSIRT</strong> (Deep File Scan, Instant Rollback, dan Forensik Log) hanya aktif untuk situs web yang telah dilengkapi kredensial koneksi SSH aman.
            </p>

            <div 
                className="p-3 mb-4 rounded-3 text-start mx-auto"
                style={{
                    maxWidth: '520px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.82rem',
                    color: '#475569'
                }}
            >
                <div className="fw-semibold text-dark mb-1 d-flex align-items-center gap-1.5">
                    <i className="bi bi-info-circle-fill text-teal"></i>
                    Langkah Mengaktifkan Investigasi Server:
                </div>
                <ol className="mb-0 ps-3" style={{ lineHeight: 1.5 }}>
                    <li>Buka menu <strong>Daftar Situs</strong>.</li>
                    <li>Pilih tombol <strong>Edit</strong> pada situs yang ingin diinspeksi.</li>
                    <li>Buka tab <strong>Koneksi SSH</strong> dan masukkan Host, Port, Akun, serta Path aplikasi di server.</li>
                    <li>Klik <strong>Simpan Perubahan</strong>.</li>
                </ol>
            </div>

            <div>
                <Link
                    href={route('sites.index')}
                    className="btn text-white d-inline-flex align-items-center gap-2 shadow-sm px-4 py-2.5"
                    style={{
                        background: 'linear-gradient(135deg, var(--teal-1, #0ea5a3), var(--blue-1, #0284c7))',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        border: 'none',
                    }}
                >
                    <i className="bi bi-hdd-network"></i>
                    <span>Kelola & Pasang SSH pada Situs</span>
                </Link>
            </div>
        </div>
    );
}
