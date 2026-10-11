import React from 'react';

interface SecurityStatCardsProps {
    stats: {
        avg_score: number;
        env_exposed: number;
        csp_missing: number;
        ssl_warning: number;
    };
}

export default function SecurityStatCards({ stats }: SecurityStatCardsProps) {
    const safeStats = stats || { avg_score: 0, env_exposed: 0, csp_missing: 0, ssl_warning: 0 };

    return (
        <div className="row g-3 mb-4">
            {/* Rata-rata Skor Keamanan */}
            <div className="col-12 col-sm-6 col-md-3">
                <div className="glass-card stat-pill">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))' }}>
                        <i className="bi bi-shield-check"></i>
                    </div>
                    <div>
                        <div className="val">{safeStats.avg_score}%</div>
                        <div className="lbl">Rata-rata Skor Keamanan</div>
                    </div>
                </div>
            </div>

            {/* File .env / Sensitif Terekspos */}
            <div className="col-12 col-sm-6 col-md-3">
                <div className="glass-card stat-pill">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--coral), #ff9d6e)' }}>
                        <i className="bi bi-file-earmark-lock2"></i>
                    </div>
                    <div>
                        <div className="val">{safeStats.env_exposed}</div>
                        <div className="lbl">File .env / Sensitif Terekspos</div>
                    </div>
                </div>
            </div>

            {/* Header CSP Hilang */}
            <div className="col-12 col-sm-6 col-md-3">
                <div className="glass-card stat-pill">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--sun), #ff9d6e)' }}>
                        <i className="bi bi-shield-x"></i>
                    </div>
                    <div>
                        <div className="val">{safeStats.csp_missing}</div>
                        <div className="lbl">Header CSP Hilang</div>
                    </div>
                </div>
            </div>

            {/* SSL Akan Kedaluwarsa */}
            <div className="col-12 col-sm-6 col-md-3">
                <div className="glass-card stat-pill">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--blue-1), var(--blue-2))' }}>
                        <i className="bi bi-clock-history"></i>
                    </div>
                    <div>
                        <div className="val">{safeStats.ssl_warning}</div>
                        <div className="lbl">SSL Akan Kedaluwarsa</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
