import React from 'react';

interface DetectionStatCardsProps {
    stats: {
        total_scanned: number;
        total_detections: number;
        drugs_category: number;
        gambling_category: number;
    };
}

export default function DetectionStatCards({ stats }: DetectionStatCardsProps) {
    return (
        <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
                <div className="glass-card stat-pill">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--teal-2))' }}>
                        <i className="bi bi-search"></i>
                    </div>
                    <div>
                        <div className="val">{(stats.total_scanned || 0).toLocaleString()}</div>
                        <div className="lbl">Halaman dipindai hari ini</div>
                    </div>
                </div>
            </div>

            <div className="col-6 col-md-3">
                <div className="glass-card stat-pill">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--coral), #ff9d6e)' }}>
                        <i className="bi bi-bug"></i>
                    </div>
                    <div>
                        <div className="val">{stats.total_detections || 0}</div>
                        <div className="lbl">Deteksi ditemukan</div>
                    </div>
                </div>
            </div>

            <div className="col-6 col-md-3">
                <div className="glass-card stat-pill">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--violet), #a78bfa)' }}>
                        <i className="bi bi-capsule"></i>
                    </div>
                    <div>
                        <div className="val">{stats.drugs_category || 0}</div>
                        <div className="lbl">Kategori obat terlarang</div>
                    </div>
                </div>
            </div>

            <div className="col-6 col-md-3">
                <div className="glass-card stat-pill">
                    <div className="icon-circle" style={{ background: 'linear-gradient(135deg, var(--sun), #ff9d6e)' }}>
                        <i className="bi bi-dice-5"></i>
                    </div>
                    <div>
                        <div className="val">{stats.gambling_category || 0}</div>
                        <div className="lbl">Kategori judi online</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
