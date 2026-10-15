import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

interface SecurityStats {
    total_sites: number;
    pct_secure: number;
    clean_sec_count: number;
    audited_count?: number;
    exposed_env_count: number;
    missing_csp_count: number;
    expiring_ssl_count: number;
    xframe_count?: number;
}

interface DashboardSecurityCardProps {
    stats: SecurityStats;
}

interface SecurityCheckItem {
    id: 'env' | 'csp' | 'ssl' | 'xframe';
    title: string;
    subtitle: string;
    icon: string;
    risk: 'Kritis' | 'Tinggi' | 'Sedang';
    count: number;
    color: string;
    bgColor: string;
    goodLabel: string;
    warnLabel: string;
    details: {
        riskDesc: string;
        findingGood: string;
        findingWarn: string;
        remediation: string;
    };
}

export default function DashboardSecurityCard({ stats }: DashboardSecurityCardProps) {
    const [filterMode, setFilterMode] = useState<'all' | 'attention'>('all');
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    const auditedCount = stats.audited_count ?? stats.total_sites;
    const xframeCount = stats.xframe_count ?? 0;

    const securityItems: SecurityCheckItem[] = [
        {
            id: 'env',
            title: 'File Sensitif (.env / .git)',
            subtitle: 'Pencegahan kebocoran kredensial rahasia',
            icon: 'bi-file-earmark-lock2-fill',
            risk: 'Kritis',
            count: stats.exposed_env_count,
            color: '#dc2626',
            bgColor: 'rgba(239, 68, 68, 0.1)',
            goodLabel: 'Aman',
            warnLabel: `${stats.exposed_env_count} Bahaya`,
            details: {
                riskDesc: 'Akses publik ke file konfigurasi dapat mengekspos kata sandi basis data dan API keys rahasia.',
                findingGood: 'Semua domain memblokir akses file tersembunyi (.env, .git) dengan benar.',
                findingWarn: `Ditemukan ${stats.exposed_env_count} domain yang mengekspos file sensitif secara publik!`,
                remediation: 'Tambahkan aturan penolakan (deny all) untuk file tersembunyi pada konfigurasi web server Nginx atau Apache.'
            }
        },
        {
            id: 'csp',
            title: 'Content Security Policy (CSP)',
            subtitle: 'Perlindungan injeksi skrip & XSS',
            icon: 'bi-shield-shaded',
            risk: 'Sedang',
            count: stats.missing_csp_count,
            color: '#d97706',
            bgColor: 'rgba(245, 158, 11, 0.1)',
            goodLabel: 'Lengkap',
            warnLabel: `${stats.missing_csp_count} Terlewat`,
            details: {
                riskDesc: 'Header CSP membatasi asal sumber daya yang boleh dieksekusi browser pengguna.',
                findingGood: 'Header Content-Security-Policy terkonfigurasi dengan baik di domain terpantau.',
                findingWarn: `Ada ${stats.missing_csp_count} domain yang belum menyertakan header Content-Security-Policy.`,
                remediation: 'Konfigurasikan header Content-Security-Policy dengan direktif default-src \'self\' dan whitelist domain terpercaya.'
            }
        },
        {
            id: 'ssl',
            title: 'Sertifikat SSL / TLS',
            subtitle: 'Audit enkripsi & masa aktif sertifikat',
            icon: 'bi-lock-fill',
            risk: 'Tinggi',
            count: stats.expiring_ssl_count,
            color: '#0284c7',
            bgColor: 'rgba(2, 132, 199, 0.1)',
            goodLabel: 'Valid',
            warnLabel: `${stats.expiring_ssl_count} Expiring`,
            details: {
                riskDesc: 'Sertifikat kedaluwarsa atau tidak valid menyebabkan peringatan keamanan fatal bagi pengunjung.',
                findingGood: 'Seluruh sertifikat SSL valid dengan chain sertifikat enkripsi kuat.',
                findingWarn: `Terdapat ${stats.expiring_ssl_count} domain dengan sertifikat SSL kedaluwarsa atau mendekati masa tenggang!`,
                remediation: 'Lakukan perpanjangan sertifikat via Certbot atau provider SSL sebelum masa aktif berakhir.'
            }
        },
        {
            id: 'xframe',
            title: 'X-Frame-Options (Clickjacking)',
            subtitle: 'Proteksi manipulasi iframe transparan',
            icon: 'bi-window-dash',
            risk: 'Sedang',
            count: xframeCount,
            color: '#0ea5a3',
            bgColor: 'rgba(14, 165, 163, 0.1)',
            goodLabel: 'Aman',
            warnLabel: `${xframeCount} Atensi`,
            details: {
                riskDesc: 'Tanpa header pembatas iframe, penyerang dapat menyematkan situs dalam frame transparan untuk memicu klik berbahaya.',
                findingGood: 'Header X-Frame-Options terpasang dengan nilai SAMEORIGIN / DENY.',
                findingWarn: `Ditemukan ${xframeCount} domain yang belum membatasi pemuatan iframe via X-Frame-Options.`,
                remediation: 'Tambahkan header HTTP "X-Frame-Options: SAMEORIGIN" pada header respon web server.'
            }
        }
    ];

    const attentionItems = securityItems.filter(item => item.count > 0);
    const displayedItems = filterMode === 'attention' ? attentionItems : securityItems;

    const toggleItem = (id: string) => {
        setExpandedItem(prev => (prev === id ? null : id));
    };

    return (
        <div 
            className="glass-card section-card h-100 position-relative overflow-hidden d-flex flex-column" 
            style={{
                borderRadius: '18px',
                border: '1.5px solid rgba(15, 42, 63, 0.08)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 250, 0.65) 100%)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
            }}
        >
            {/* Header: Title & Badges */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-light">
                <div className="d-flex align-items-center gap-2">
                    <div 
                        style={{ 
                            width: '34px', 
                            height: '34px', 
                            borderRadius: '10px', 
                            background: 'rgba(14, 165, 163, 0.12)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--teal-1)',
                            fontSize: '1.05rem',
                            boxShadow: '0 2px 6px rgba(14, 165, 163, 0.1)'
                        }}
                    >
                        <i className="bi bi-shield-check-fill"></i>
                    </div>
                    <div>
                        <h6 className="mb-0 fw-bold" style={{ fontSize: '0.94rem', color: '#0f2a3f' }}>Status Keamanan</h6>
                        <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>Audit Postur &amp; Enkripsi</span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {/* Clean live pulse badge - No overlapping glitches */}
                    <div 
                        className="badge rounded-pill d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                        style={{
                            background: 'rgba(14, 165, 163, 0.08)',
                            border: '1px solid rgba(14, 165, 163, 0.22)',
                            color: 'var(--teal-1)',
                            fontSize: '0.7rem',
                            fontWeight: 600
                        }}
                    >
                        <span 
                            style={{ 
                                width: '6px', 
                                height: '6px', 
                                borderRadius: '50%', 
                                background: '#0ea5a3',
                                display: 'inline-block',
                                boxShadow: '0 0 6px #0ea5a3'
                            }}
                        />
                        <span>Terenkripsi &amp; Teruji</span>
                    </div>

                    <Link 
                        href={route('security.index')}
                        className="badge text-decoration-none px-2 py-1 d-inline-flex align-items-center gap-1"
                        style={{
                            background: '#ffffff',
                            color: '#0f2a3f',
                            border: '1px solid rgba(15, 42, 63, 0.12)',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--teal-1)';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = 'var(--teal-1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.color = '#0f2a3f';
                            e.currentTarget.style.borderColor = 'rgba(15, 42, 63, 0.12)';
                        }}
                    >
                        <span>Audit</span>
                        <i className="bi bi-arrow-right-short"></i>
                    </Link>
                </div>
            </div>

            {/* Circular Gauge & Posture Summary Tile */}
            <div 
                className="p-3 mb-3 rounded-3 position-relative overflow-hidden d-flex align-items-center gap-3"
                style={{
                    background: '#ffffff',
                    border: '1px solid rgba(14, 165, 163, 0.15)',
                    boxShadow: '0 4px 14px rgba(14, 165, 163, 0.06)',
                    transition: 'all 0.25s ease'
                }}
            >
                {/* Modern Radial Gauge */}
                <div 
                    className="position-relative flex-shrink-0" 
                    style={{ width: '66px', height: '66px' }}
                >
                    <svg width="66" height="66" style={{ transform: 'rotate(-90deg)' }}>
                        <defs>
                            <linearGradient id="shieldGradMini" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0ea5a3" />
                                <stop offset="100%" stopColor="#0284c7" />
                            </linearGradient>
                        </defs>
                        <circle cx="33" cy="33" r="27" stroke="rgba(15,42,63,0.08)" strokeWidth="6" fill="none"/>
                        <circle 
                            cx="33" 
                            cy="33" 
                            r="27" 
                            stroke="url(#shieldGradMini)" 
                            strokeWidth="6" 
                            fill="none" 
                            strokeDasharray={170} 
                            strokeDashoffset={170 - (170 * Math.min(100, Math.max(0, stats.pct_secure))) / 100} 
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                        />
                    </svg>
                    <div 
                        className="position-absolute d-flex flex-column align-items-center justify-content-center"
                        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                    >
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f2a3f', lineHeight: 1 }}>{stats.pct_secure}%</span>
                        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--teal-1)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aman</span>
                    </div>
                </div>

                {/* Status Text & Audit Progress */}
                <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center gap-1.5 mb-1">
                        <span 
                            className="badge rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1"
                            style={{
                                background: stats.pct_secure >= 90 ? '#f0fdf4' : '#fffbeb',
                                color: stats.pct_secure >= 90 ? '#15803d' : '#b45309',
                                border: stats.pct_secure >= 90 ? '1px solid #bbf7d0' : '1px solid #fde68a',
                                fontSize: '0.68rem',
                                fontWeight: 700
                            }}
                        >
                            <i className={stats.pct_secure >= 90 ? "bi bi-shield-check" : "bi bi-shield-exclamation"}></i>
                            {stats.pct_secure >= 90 ? 'Situs Terverifikasi Aman' : 'Perlu Penguatan Postur'}
                        </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f2a3f' }}>
                        {stats.clean_sec_count} dari {auditedCount} situs bebas temuan kritis
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', lineHeight: 1.3 }}>
                        Klik tiap indikator di bawah untuk melihat rincian &amp; panduan perbaikan.
                    </div>
                </div>
            </div>

            {/* Interactive Filter Pills */}
            <div className="d-flex align-items-center justify-content-between mb-2">
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-soft)' }}>
                    Indikator Keamanan
                </span>
                <div className="d-flex align-items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setFilterMode('all')}
                        className="btn btn-sm px-2 py-0.5 rounded-pill"
                        style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            border: '1px solid',
                            borderColor: filterMode === 'all' ? 'var(--teal-1)' : 'rgba(15, 42, 63, 0.12)',
                            background: filterMode === 'all' ? 'var(--teal-1)' : 'transparent',
                            color: filterMode === 'all' ? '#ffffff' : 'var(--ink-soft)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Semua ({securityItems.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterMode('attention')}
                        className="btn btn-sm px-2 py-0.5 rounded-pill d-inline-flex align-items-center gap-1"
                        style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            border: '1px solid',
                            borderColor: filterMode === 'attention' ? '#d97706' : (attentionItems.length > 0 ? '#fde68a' : 'rgba(15, 42, 63, 0.12)'),
                            background: filterMode === 'attention' ? '#d97706' : (attentionItems.length > 0 ? '#fffbeb' : 'transparent'),
                            color: filterMode === 'attention' ? '#ffffff' : (attentionItems.length > 0 ? '#b45309' : 'var(--ink-soft)'),
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <span>Perlu Atensi</span>
                        {attentionItems.length > 0 && (
                            <span 
                                className="badge rounded-circle p-0" 
                                style={{ 
                                    width: '14px', 
                                    height: '14px', 
                                    lineHeight: '14px',
                                    background: filterMode === 'attention' ? '#ffffff' : '#dc2626',
                                    color: filterMode === 'attention' ? '#d97706' : '#ffffff',
                                    fontSize: '0.58rem'
                                }}
                            >
                                {attentionItems.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Interactive Accordion Tiles */}
            <div className="d-flex flex-column gap-2 flex-grow-1">
                {displayedItems.length === 0 ? (
                    <div 
                        className="p-3 rounded-3 text-center d-flex flex-column align-items-center justify-content-center"
                        style={{
                            background: 'rgba(240, 253, 250, 0.6)',
                            border: '1px dashed rgba(14, 165, 163, 0.3)',
                            minHeight: '120px'
                        }}
                    >
                        <i className="bi bi-shield-check text-teal" style={{ fontSize: '1.6rem' }}></i>
                        <div className="fw-bold mt-1" style={{ fontSize: '0.82rem', color: '#0f2a3f' }}>Semua Indikator Prima!</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>Tidak ada temuan yang memerlukan atensi perbaikan.</div>
                    </div>
                ) : (
                    displayedItems.map((item) => {
                        const isExpanded = expandedItem === item.id;
                        const isWarning = item.count > 0;

                        return (
                            <div 
                                key={item.id}
                                className="rounded-3 overflow-hidden"
                                style={{
                                    border: isExpanded 
                                        ? `1.5px solid ${isWarning ? '#f59e0b' : 'var(--teal-1)'}` 
                                        : isWarning 
                                            ? '1px solid rgba(245, 158, 11, 0.35)' 
                                            : '1px solid rgba(15, 42, 63, 0.08)',
                                    background: isExpanded 
                                        ? '#ffffff' 
                                        : isWarning 
                                            ? 'linear-gradient(90deg, #fffbeb 0%, #ffffff 100%)' 
                                            : 'rgba(255, 255, 255, 0.85)',
                                    boxShadow: isExpanded 
                                        ? '0 6px 18px rgba(0, 0, 0, 0.05)' 
                                        : '0 2px 6px rgba(0, 0, 0, 0.02)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {/* Tile Row (Clickable) */}
                                <div 
                                    className="p-2.5 d-flex align-items-center justify-content-between"
                                    onClick={() => toggleItem(item.id)}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                    onMouseEnter={(e) => {
                                        if (!isExpanded) {
                                            e.currentTarget.style.background = '#ffffff';
                                            e.currentTarget.style.transform = 'translateX(2px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isExpanded) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-2.5 min-w-0">
                                        <div 
                                            style={{ 
                                                width: '30px', 
                                                height: '30px', 
                                                borderRadius: '8px', 
                                                background: item.bgColor, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                color: item.color,
                                                fontSize: '0.9rem',
                                                flexShrink: 0
                                            }}
                                        >
                                            <i className={`bi ${item.icon}`}></i>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="d-flex align-items-center gap-1.5">
                                                <span 
                                                    className="text-truncate" 
                                                    style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f2a3f' }}
                                                >
                                                    {item.title}
                                                </span>
                                            </div>
                                            <div 
                                                className="text-truncate" 
                                                style={{ fontSize: '0.68rem', color: 'var(--ink-faint)' }}
                                            >
                                                {item.subtitle}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                                        <span 
                                            className="badge px-2 py-1"
                                            style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                borderRadius: '6px',
                                                background: !isWarning ? '#f0fdf4' : '#fffbeb',
                                                color: !isWarning ? '#15803d' : '#b45309',
                                                border: !isWarning ? '1px solid #bbf7d0' : '1px solid #fde68a'
                                            }}
                                        >
                                            {!isWarning ? (
                                                <><i className="bi bi-check-lg me-1"></i>{item.goodLabel}</>
                                            ) : (
                                                <><i className="bi bi-exclamation-triangle-fill me-1"></i>{item.warnLabel}</>
                                            )}
                                        </span>
                                        <i 
                                            className={`bi bi-chevron-down text-muted`} 
                                            style={{ 
                                                fontSize: '0.75rem', 
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Expanded Interactive Drawer */}
                                {isExpanded && (
                                    <div 
                                        className="px-3 pb-3 pt-2 border-top"
                                        style={{ 
                                            borderColor: 'rgba(15, 42, 63, 0.06)',
                                            background: '#fafcff',
                                            fontSize: '0.76rem'
                                        }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="badge rounded-pill bg-light text-dark border px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                                                Tingkat Risiko: <strong>{item.risk}</strong>
                                            </span>
                                            <span style={{ fontSize: '0.68rem', color: 'var(--ink-faint)' }}>
                                                Audit Status: {isWarning ? 'Perlu Atensi' : 'Optimal'}
                                            </span>
                                        </div>

                                        <div className="p-2 rounded-2 mb-2" style={{ background: isWarning ? '#fff7ed' : '#f0fdf4', border: `1px solid ${isWarning ? '#fed7aa' : '#bbf7d0'}` }}>
                                            <div className="fw-bold mb-0.5" style={{ color: isWarning ? '#9a3412' : '#166534', fontSize: '0.74rem' }}>
                                                {isWarning ? '⚠️ Temuan Audit:' : '✅ Status Aman:'}
                                            </div>
                                            <div style={{ color: isWarning ? '#c2410c' : '#15803d', fontSize: '0.72rem', lineHeight: 1.35 }}>
                                                {isWarning ? item.details.findingWarn : item.details.findingGood}
                                            </div>
                                        </div>

                                        <div className="mb-2.5">
                                            <div className="fw-semibold mb-0.5" style={{ fontSize: '0.72rem', color: '#0f2a3f' }}>
                                                <i className="bi bi-lightbulb-fill text-warning me-1"></i>Rekomendasi Penanganan:
                                            </div>
                                            <div style={{ fontSize: '0.71rem', color: 'var(--ink-soft)', lineHeight: 1.35 }}>
                                                {item.details.remediation}
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-end">
                                            <Link
                                                href={route('security.index')}
                                                className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                                                style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 600,
                                                    borderRadius: '6px',
                                                    background: 'var(--teal-1)',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    boxShadow: '0 2px 6px rgba(14, 165, 163, 0.25)'
                                                }}
                                            >
                                                <span>Buka Forensik &amp; Scanner</span>
                                                <i className="bi bi-arrow-right"></i>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Footer Action */}
            <div className="mt-3 pt-2.5 border-top border-light d-flex align-items-center justify-content-between">
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>
                    <i className="bi bi-clock-history me-1"></i>Audit berkala otomatis
                </span>
                <Link
                    href={route('security.index')}
                    className="text-decoration-none d-inline-flex align-items-center gap-1"
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--teal-1)',
                        transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                    }}
                >
                    <span>Matriks Keamanan Lengkap</span>
                    <i className="bi bi-arrow-right"></i>
                </Link>
            </div>
        </div>
    );
}
