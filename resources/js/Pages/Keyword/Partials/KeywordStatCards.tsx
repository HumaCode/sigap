import React from 'react';

interface KeywordStatCardsProps {
    stats: {
        total: number;
        judol: number;
        obat: number;
        regex: number;
    };
}

export default function KeywordStatCards({ stats }: KeywordStatCardsProps) {
    return (
        <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
                <div className="glass-card stat-pill h-100">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))' }}>
                        <i className="bi bi-journal-code"></i>
                    </div>
                    <div>
                        <div className="val">{stats?.total || 0}</div>
                        <div className="lbl">Total Kata Kunci</div>
                    </div>
                </div>
            </div>

            <div className="col-6 col-md-3">
                <div className="glass-card stat-pill h-100">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--coral), #ff9d6e)' }}>
                        <i className="bi bi-dice-5"></i>
                    </div>
                    <div>
                        <div className="val">{stats?.judol || 0}</div>
                        <div className="lbl">Judi Online</div>
                    </div>
                </div>
            </div>

            <div className="col-6 col-md-3">
                <div className="glass-card stat-pill h-100">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--violet), #a78bfa)' }}>
                        <i className="bi bi-capsule"></i>
                    </div>
                    <div>
                        <div className="val">{stats?.obat || 0}</div>
                        <div className="lbl">Obat Terlarang</div>
                    </div>
                </div>
            </div>

            <div className="col-6 col-md-3">
                <div className="glass-card stat-pill h-100">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--blue-1), var(--blue-2))' }}>
                        <i className="bi bi-code-slash"></i>
                    </div>
                    <div>
                        <div className="val">{stats?.regex || 0}</div>
                        <div className="lbl">Pola Regex Aktif</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
