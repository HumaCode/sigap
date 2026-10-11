import React, { useState } from 'react';

interface ActivityLogTabProps {
    data: {
        retention_days: number;
        log_level: string;
        auto_prune: boolean;
    };
    onSave: (settings: Record<string, any>) => void;
    isSaving: boolean;
}

export default function ActivityLogTab({ data, onSave, isSaving }: ActivityLogTabProps) {
    const [retentionDays, setRetentionDays] = useState(data.retention_days || 30);
    const [logLevel, setLogLevel] = useState(data.log_level || 'info');
    const [autoPrune, setAutoPrune] = useState(Boolean(data.auto_prune));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            retention_days: Number(retentionDays),
            log_level: logLevel,
            auto_prune: autoPrune,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="settings-card">
                <div className="settings-card-header">
                    <div>
                        <h4 className="settings-card-title">
                            <i className="bi bi-journal-text text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                            Pengaturan Log Aktivitas & Audit
                        </h4>
                        <p className="settings-card-subtitle">
                            Kelola kebijakan penyimpanan jejak audit keamanan, retensi riwayat deteksi, dan ambang batas pencatatan
                        </p>
                    </div>
                </div>

                <div className="row g-4 mb-4">
                    {/* Retention Days */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">Masa Retensi Log Deteksi</label>
                        <select
                            className="settings-input"
                            value={retentionDays}
                            onChange={(e) => setRetentionDays(Number(e.target.value))}
                        >
                            <option value={15}>15 Hari (Penyimpanan Hemat)</option>
                            <option value={30}>30 Hari (Standar Rekomendasi)</option>
                            <option value={60}>60 Hari (2 Bulan)</option>
                            <option value={90}>90 Hari (3 Bulan - Kepatuhan Audit)</option>
                            <option value={180}>180 Hari (6 Bulan)</option>
                            <option value={365}>365 Hari (1 Tahun Penuh)</option>
                        </select>
                        <div className="settings-hint">
                            Log crawler dan deteksi yang lebih tua dari batas ini akan diarsipkan/dibersihkan secara otomatis
                        </div>
                    </div>

                    {/* Log Level */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">Ambang Batas Pencatatan (Log Level)</label>
                        <select
                            className="settings-input"
                            value={logLevel}
                            onChange={(e) => setLogLevel(e.target.value)}
                        >
                            <option value="debug">DEBUG (Catat semua detail sistem & crawler)</option>
                            <option value="info">INFO (Catat aktivitas penting & rutin)</option>
                            <option value="warning">WARNING (Hanya peringatan & anomali)</option>
                            <option value="error">ERROR (Hanya kegagalan fatal & insiden kritis)</option>
                        </select>
                        <div className="settings-hint">
                            Tingkat rincian informasi audit yang disimpan ke dalam storage log
                        </div>
                    </div>

                    {/* Auto Prune Switch */}
                    <div className="col-12">
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="autoPruneSwitch"
                                    checked={autoPrune}
                                    onChange={(e) => setAutoPrune(e.target.checked)}
                                    style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                                />
                                <label className="form-check-label ms-2 fw-semibold" htmlFor="autoPruneSwitch" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                    Pembersihan Otomatis Terjadwal (Daily Auto-Prune)
                                </label>
                            </div>
                            <div className="text-muted ms-4 ps-2 mt-1" style={{ fontSize: '0.8rem' }}>
                                Jalankan task scheduler harian untuk membuang riwayat log kedaluwarsa secara otomatis demi menjaga performa database PostgreSQL/MySQL tetap optimal.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-end pt-3 border-top">
                    <button
                        type="submit"
                        className="btn-save-settings"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check2-circle"></i>
                                Simpan Pengaturan Log
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
