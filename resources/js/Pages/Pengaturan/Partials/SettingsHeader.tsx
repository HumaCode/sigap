import React from 'react';

export default function SettingsHeader() {
    return (
        <div className="settings-page-header">
            <div className="d-flex align-items-center gap-3">
                <div className="settings-icon-badge">
                    <i className="bi bi-gear-fill" style={{ fontSize: '1.35rem' }}></i>
                </div>
                <div>
                    <div className="page-title mb-0" style={{ lineHeight: 1.2 }}>Pengaturan Sistem</div>
                    <div className="page-subtitle text-muted" style={{ fontSize: '0.85rem' }}>
                        Kelola integrasi 9Router AI Engine, optimasi SEO, log audit, dan preferensi platform SIGAP
                    </div>
                </div>
            </div>
        </div>
    );
}
