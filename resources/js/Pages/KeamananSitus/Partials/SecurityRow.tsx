import React, { useState } from 'react';

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
    onScanSingle: (siteId: string) => void;
}

export default function SecurityRow({ security, onScanSingle }: SecurityRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);

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
        switch (grade.toUpperCase()) {
            case 'A': return 'grade-a';
            case 'B': return 'grade-b';
            case 'C': return 'grade-c';
            case 'F': return 'grade-f';
            default: return 'grade-b';
        }
    };

    const getIssueBadge = () => {
        if (security.issues_count === 0) {
            return <span className="issue-count-badge ic-clean d-none d-md-inline-block">Tidak ada temuan</span>;
        }
        if (security.grade === 'F') {
            return <span className="issue-count-badge ic-danger d-none d-md-inline-block">{security.issues_count} temuan kritis</span>;
        }
        return <span className="issue-count-badge ic-warn d-none d-md-inline-block">{security.issues_count} peringatan</span>;
    };

    const getStrokeColor = (grade: string) => {
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
                
                <span className={`grade-badge ${getGradeClass(security.grade)}`}>{security.grade}</span>
                
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
                                onScanSingle(security.site_id);
                            }}
                            className="btn btn-sm btn-light border-0 d-flex align-items-center gap-1 py-1 px-2"
                            style={{ fontSize: '0.72rem', color: 'var(--teal-1)', fontWeight: 600, background: 'rgba(14,165,163,0.06)', borderRadius: '6px' }}
                        >
                            <i className="bi bi-arrow-repeat"></i> Pindai Ulang
                        </button>
                    </div>

                    {security.checks && security.checks.length > 0 ? (
                        security.checks.map((check, idx) => (
                            <div key={idx} className="check-item">
                                <div className={`check-icon ${check.status === 'ok' ? 'ok' : check.status === 'fail' ? 'fail' : 'warn'}`}>
                                    <i className={`bi ${check.status === 'ok' ? 'bi-check-lg' : check.status === 'fail' ? 'bi-x-lg' : 'bi-exclamation-lg'}`}></i>
                                </div>
                                <div className="flex-grow-1">
                                    <p className="check-title">{check.title}</p>
                                    <p className="check-desc">{check.desc}</p>
                                    {check.fix && (
                                        <div className="check-fix">
                                            <i className="bi bi-tools"></i> {check.fix}
                                        </div>
                                    )}
                                </div>
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
