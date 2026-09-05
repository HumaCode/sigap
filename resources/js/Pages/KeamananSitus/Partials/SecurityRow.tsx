import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';

interface CheckItem {
    key: string;
    title: string;
    status: 'ok' | 'fail' | 'warn';
    desc: string;
    fix?: string;
}

interface SecurityRowProps {
    security: {
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
    };
    onOpenAi?: (incidentData: any) => void;
}

export default function SecurityRow({ security, onOpenAi }: SecurityRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Check if site is offline / unreachable
    const isOffline = security.score === 0 || (security.checks && security.checks.some(c => c.desc && (
        c.desc.includes('offline') || 
        c.desc.includes('tidak dapat dihubungi') || 
        c.desc.includes('resolusi DNS') ||
        c.desc.includes('Koneksi gagal')
    )));

    const handleScan = () => {
        setIsScanning(true);
        router.post(route('security.scan'), { site_id: security.site_id }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pindaian Selesai', `Situs ${security.site.name} berhasil dipindai ulang.`);
            },
            onError: () => {
                toast.error('Gagal', `Gagal memindai ulang situs ${security.site.name}.`);
            },
            onFinish: () => setIsScanning(false)
        });
    };

    const getCategoryIcon = (category: string, name: string) => {
        const nameLower = name.toLowerCase();
        if (nameLower.includes('spbe')) return 'bi-diagram-3';
        if (nameLower.includes('siakad')) return 'bi-mortarboard';
        if (nameLower.includes('rapbd')) return 'bi-cash-coin';
        if (nameLower.includes('sipeka')) return 'bi-clipboard-data';
        if (category === 'PPID') return 'bi-file-earmark-text';
        if (category === 'Portal Utama') return 'bi-building';
        return 'bi-globe2';
    };

    const getGradeClass = (grade: string) => {
        if (isOffline) return 'grade-f';
        switch (grade.toUpperCase()) {
            case 'A': return 'grade-a';
            case 'B': return 'grade-b';
            case 'C': return 'grade-c';
            case 'F': return 'grade-f';
            default: return 'grade-b';
        }
    };

    const getIssueBadge = () => {
        if (isOffline) {
            return (
                <span className="issue-count-badge ic-offline d-none d-md-inline-block" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 600 }}>
                    <i className="bi bi-wifi-off me-1"></i> Situs Offline (Ditangguhkan)
                </span>
            );
        }
        if (security.issues_count === 0) {
            return <span className="issue-count-badge ic-clean d-none d-md-inline-block">Tidak ada temuan</span>;
        }
        if (security.grade === 'F') {
            return <span className="issue-count-badge ic-danger d-none d-md-inline-block">{security.issues_count} temuan kritis</span>;
        }
        return <span className="issue-count-badge ic-warn d-none d-md-inline-block">{security.issues_count} peringatan</span>;
    };

    const getStrokeColor = (grade: string) => {
        if (isOffline) return '#ef4444';
        switch (grade.toUpperCase()) {
            case 'A': return '#0ea5a3';
            case 'B': return '#3b82f6';
            case 'C': return '#ffb648';
            case 'F': return '#ff7a6e';
            default: return '#3b82f6';
        }
    };

    const circumference = 132;
    const offset = circumference - (circumference * Math.min(100, Math.max(0, security.score))) / 100;

    return (
        <div className={`sec-row ${isExpanded ? 'expanded' : ''}`}>
            {/* Header Click Area */}
            <div className="sec-row-head" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="site-favicon">
                    <i className={`bi ${getCategoryIcon(security.site.category, security.site.name)}`}></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                    <p className="site-name">{security.site.name}</p>
                    <p className="site-url">{security.site.url}</p>
                </div>
                
                <span className={`grade-badge ${getGradeClass(security.grade)}`}>{isOffline ? 'OFF' : security.grade}</span>
                
                <div className="score-ring">
                    <svg width="52" height="52">
                        <circle cx="26" cy="26" r="21" stroke="rgba(15,42,63,0.08)" strokeWidth="5.5" fill="none"/>
                        <circle 
                            cx="26" 
                            cy="26" 
                            r="21" 
                            stroke={getStrokeColor(security.grade)} 
                            strokeWidth="5.5" 
                            fill="none" 
                            strokeDasharray={circumference} 
                            strokeDashoffset={offset} 
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="val">{security.score}%</div>
                </div>

                {getIssueBadge()}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleScan();
                    }}
                    disabled={isScanning}
                    className="btn-scan-single ms-2"
                    title="Pindai Ulang Situs Ini"
                >
                    {isScanning ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px', borderWidth: '1.5px', color: 'var(--teal-1)' }}></span>
                    ) : (
                        <i className="bi bi-arrow-repeat"></i>
                    )}
                </button>
                
                <i className="bi bi-chevron-down chevron-toggle ms-2"></i>
            </div>

            {/* Expanded Content Area */}
            {isExpanded && (
                <div className="sec-row-body">
                    <div className="d-flex align-items-center justify-content-between pt-3 pb-2 border-bottom border-light">
                        <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                            <i className="bi bi-clock me-1"></i> Terakhir dipindai: {security.last_scanned_at}
                        </span>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleScan();
                            }}
                            disabled={isScanning}
                            className="btn btn-sm btn-light border-0 d-flex align-items-center gap-1 py-1 px-2"
                            style={{ fontSize: '0.72rem', color: 'var(--teal-1)', fontWeight: 600, background: 'rgba(14,165,163,0.06)', borderRadius: '6px' }}
                        >
                            {isScanning ? (
                                <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span> Memindai...</>
                            ) : (
                                <><i className="bi bi-arrow-repeat"></i> Pindai Ulang</>
                            )}
                        </button>
                    </div>

                    {isOffline && (
                        <div className="alert border-0 shadow-sm d-flex align-items-center gap-2.5 mb-3 mt-3" style={{ borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', fontSize: '0.82rem', padding: '0.8rem 1rem', borderLeft: '4px solid #ef4444' }}>
                            <i className="bi bi-wifi-off flex-shrink-0" style={{ fontSize: '1.25rem', color: '#ef4444' }}></i>
                            <div>
                                <strong style={{ display: 'block', fontWeight: 600 }}>Situs Sedang Offline / Tidak Dapat Dihubungi</strong>
                                <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>Audit keamanan (.env, .git, CSP, HSTS, SSL) ditangguhkan sampai situs kembali online. Pastikan server web dan rute DNS berfungsi normal.</span>
                            </div>
                        </div>
                    )}

                    {security.checks && security.checks.length > 0 ? (
                        security.checks.map((check, idx) => (
                            <div key={idx} className="check-item d-flex align-items-start justify-content-between flex-wrap gap-2">
                                <div className="d-flex align-items-start gap-2.5 flex-grow-1 min-w-0">
                                    <div className={`check-icon ${check.status === 'ok' ? 'ok' : check.status === 'fail' ? 'fail' : 'warn'}`}>
                                        <i className={`bi ${check.status === 'ok' ? 'bi-check-lg' : check.status === 'fail' ? 'bi-x-lg' : 'bi-exclamation-lg'}`}></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                            <p className="check-title mb-0">{check.title}</p>
                                            {check.key && check.key.startsWith('ssh_') && (
                                                <span 
                                                    className="badge ms-1 py-0.5 px-2"
                                                    style={{ 
                                                        fontSize: '0.65rem', 
                                                        background: 'rgba(14,165,163,0.12)', 
                                                        color: 'var(--teal-1)', 
                                                        border: '1px solid rgba(14,165,163,0.25)',
                                                        borderRadius: '4px',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <i className="bi bi-terminal me-1"></i> SSH Audit
                                                </span>
                                            )}
                                        </div>
                                        <p className="check-desc mt-1">{check.desc}</p>
                                        {check.fix && (
                                            <div className="check-fix">
                                                <i className="bi bi-tools"></i> {check.fix}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {check.status !== 'ok' && !isOffline && onOpenAi && (
                                    <button 
                                        type="button" 
                                        className="btn btn-sm text-white border-0 d-inline-flex align-items-center gap-1.5 shadow-sm mt-1"
                                        style={{ 
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                                            borderRadius: '8px', 
                                            fontWeight: 600, 
                                            fontSize: '0.75rem',
                                            padding: '0.35rem 0.7rem'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenAi({
                                                id: `sec-${security.site_id}-${check.key}`,
                                                title: `Panduan Perbaikan: ${check.title}`,
                                                site_name: security.site.name,
                                                site_url: security.site.url,
                                                severity: check.status === 'fail' ? 'critical' : 'high',
                                                type: 'security_audit',
                                                description: `${check.desc} — ${check.fix || ''}`,
                                            });
                                        }}
                                        title={`Tanyakan Solusi Perbaikan AI untuk ${check.title}`}
                                    >
                                        <i className="bi bi-magic"></i>
                                        <span>Solusi AI</span>
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-muted py-3 mb-0" style={{ fontSize: '0.8rem' }}>Tidak ada item pemeriksaan keamanan.</p>
                    )}
                </div>
            )}
        </div>
    );
}
