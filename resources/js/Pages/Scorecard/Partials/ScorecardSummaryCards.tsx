import React from 'react';

interface ScorecardSummaryCardsProps {
    summary: {
        total_sites: number;
        avg_score: number;
        compliance_percentage: number;
        grade_counts: {
            A_plus: number;
            A: number;
            B: number;
            C: number;
            D: number;
        };
    };
}

export default function ScorecardSummaryCards({ summary }: ScorecardSummaryCardsProps) {
    const { total_sites, avg_score, compliance_percentage, grade_counts } = summary;

    return (
        <div className="row g-3 mb-4">
            {/* 1. Indeks Rata-rata Mutu Daerah */}
            <div className="col-12 col-sm-6 col-xl-3">
                <div 
                    className="glass-card p-3.5 h-100 position-relative overflow-hidden" 
                    style={{ 
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 253, 250, 0.8) 100%)',
                        border: '1.5px solid rgba(14, 165, 163, 0.2)',
                        boxShadow: '0 8px 24px rgba(14, 165, 163, 0.08)'
                    }}
                >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Indeks Mutu Daerah
                        </span>
                        <div 
                            style={{ 
                                width: '38px', 
                                height: '38px', 
                                borderRadius: '10px', 
                                background: 'rgba(14, 165, 163, 0.12)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: 'var(--teal-1)',
                                fontSize: '1.2rem'
                            }}
                        >
                            <i className="bi bi-award-fill"></i>
                        </div>
                    </div>
                    <div className="d-flex align-items-baseline gap-2">
                        <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f2a3f', lineHeight: 1 }}>
                            {avg_score}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-faint)' }}>
                            / 100 Poin
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
                            <span>Standar SLA & Keamanan</span>
                            <span style={{ color: avg_score >= 80 ? 'var(--teal-1)' : '#d97706' }}>
                                {avg_score >= 85 ? 'Sangat Baik' : (avg_score >= 70 ? 'Memenuhi Standar' : 'Perlu Evaluasi')}
                            </span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(15, 42, 63, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div 
                                style={{ 
                                    width: `${Math.min(100, avg_score)}%`, 
                                    height: '100%', 
                                    background: 'linear-gradient(90deg, #0ea5a3 0%, #0284c7 100%)',
                                    borderRadius: '999px',
                                    transition: 'width 0.8s ease'
                                }} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Tingkat Kepatuhan Standar SLA */}
            <div className="col-12 col-sm-6 col-xl-3">
                <div 
                    className="glass-card p-3.5 h-100 position-relative overflow-hidden" 
                    style={{ 
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
                        border: '1.5px solid rgba(2, 132, 199, 0.2)',
                        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08)'
                    }}
                >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Kepatuhan SLA
                        </span>
                        <div 
                            style={{ 
                                width: '38px', 
                                height: '38px', 
                                borderRadius: '10px', 
                                background: 'rgba(2, 132, 199, 0.12)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: '#0284c7',
                                fontSize: '1.2rem'
                            }}
                        >
                            <i className="bi bi-shield-check"></i>
                        </div>
                    </div>
                    <div className="d-flex align-items-baseline gap-2">
                        <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f2a3f', lineHeight: 1 }}>
                            {compliance_percentage}%
                        </span>
                    </div>
                    <p className="mt-2 mb-0" style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                        <strong>{grade_counts.A_plus + grade_counts.A + grade_counts.B}</strong> dari {total_sites} situs meraih predikat Grade A+, A, atau B.
                    </p>
                </div>
            </div>

            {/* 3. Distribusi Rapor Mutu Website */}
            <div className="col-12 col-sm-6 col-xl-3">
                <div 
                    className="glass-card p-3.5 h-100 position-relative overflow-hidden" 
                    style={{ 
                        borderRadius: '16px',
                        background: '#ffffff',
                        border: '1.5px solid rgba(15, 42, 63, 0.08)',
                        boxShadow: '0 8px 24px rgba(15, 42, 63, 0.04)'
                    }}
                >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Distribusi Mutu
                        </span>
                        <div 
                            style={{ 
                                width: '38px', 
                                height: '38px', 
                                borderRadius: '10px', 
                                background: 'rgba(245, 158, 11, 0.12)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: '#d97706',
                                fontSize: '1.2rem'
                            }}
                        >
                            <i className="bi bi-bar-chart-fill"></i>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-1.5 flex-wrap mt-2">
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#b45309', fontWeight: 700, fontSize: '0.78rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            ⭐ A+: {grade_counts.A_plus}
                        </span>
                        <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', fontWeight: 700, fontSize: '0.78rem', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
                            A: {grade_counts.A}
                        </span>
                        <span className="badge" style={{ background: 'rgba(14, 165, 163, 0.12)', color: 'var(--teal-1)', fontWeight: 700, fontSize: '0.78rem', border: '1px solid rgba(14, 165, 163, 0.25)' }}>
                            B: {grade_counts.B}
                        </span>
                        <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#d97706', fontWeight: 700, fontSize: '0.78rem', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
                            C: {grade_counts.C}
                        </span>
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', fontWeight: 700, fontSize: '0.78rem', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                            D: {grade_counts.D}
                        </span>
                    </div>
                    <p className="mt-2 mb-0" style={{ fontSize: '0.74rem', color: 'var(--ink-faint)' }}>
                        Total evaluasi komprehensif pada {total_sites} situs web yang dipantau.
                    </p>
                </div>
            </div>

            {/* 4. Situs Perlu Remediasi Prioritas */}
            <div className="col-12 col-sm-6 col-xl-3">
                <div 
                    className="glass-card p-3.5 h-100 position-relative overflow-hidden" 
                    style={{ 
                        borderRadius: '16px',
                        background: (grade_counts.C + grade_counts.D) > 0 
                            ? 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)' 
                            : 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
                        border: (grade_counts.C + grade_counts.D) > 0 
                            ? '1.5px solid rgba(239, 68, 68, 0.25)' 
                            : '1.5px solid rgba(14, 165, 163, 0.2)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
                    }}
                >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Perlu Remediasi
                        </span>
                        <div 
                            style={{ 
                                width: '38px', 
                                height: '38px', 
                                borderRadius: '10px', 
                                background: (grade_counts.C + grade_counts.D) > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 165, 163, 0.12)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: (grade_counts.C + grade_counts.D) > 0 ? '#dc2626' : 'var(--teal-1)',
                                fontSize: '1.2rem'
                            }}
                        >
                            <i className={`bi ${(grade_counts.C + grade_counts.D) > 0 ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}></i>
                        </div>
                    </div>
                    <div className="d-flex align-items-baseline gap-2">
                        <span style={{ fontSize: '2.2rem', fontWeight: 800, color: (grade_counts.C + grade_counts.D) > 0 ? '#dc2626' : '#0f2a3f', lineHeight: 1 }}>
                            {grade_counts.C + grade_counts.D}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-faint)' }}>
                            Situs (Grade C & D)
                        </span>
                    </div>
                    <p className="mt-2 mb-0" style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                        {(grade_counts.C + grade_counts.D) > 0 
                            ? 'Membutuhkan intervensi teknis segera pada ketersediaan atau SSL.' 
                            : 'Luar biasa! Seluruh situs memenuhi standar kepatuhan minimum.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
