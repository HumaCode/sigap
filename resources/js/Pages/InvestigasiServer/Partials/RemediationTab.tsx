import React, { useState } from 'react';
import axios from 'axios';
import { toast } from '@/Components/DynamicToast';

interface RemediationTabProps {
    siteId: string;
    siteName: string;
    isGitRepo?: boolean;
}

export default function RemediationTab({ siteId, siteName, isGitRepo }: RemediationTabProps) {
    const [targetFile, setTargetFile] = useState('index.php');
    const [isRollingBack, setIsRollingBack] = useState(false);
    const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
    const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
    const [lastActionLog, setLastActionLog] = useState<string | null>(null);

    const handleRollback = async () => {
        if (!confirm(`Tindakan Tanggap Darurat:\n\nApakah Anda yakin ingin memulihkan berkas "${targetFile}" di server ${siteName} dari komit Git baseline / snapshot cadangan?`)) {
            return;
        }

        setIsRollingBack(true);
        try {
            const response = await axios.post(route('server-investigations.rollback-file', siteId), {
                file_path: targetFile,
            });

            if (response.data?.success) {
                toast.success('Rollback Berhasil', response.data.message);
                setLastActionLog(`[${new Date().toLocaleTimeString()}] Rollback sukses: ${response.data.message}`);
            } else {
                toast.error('Gagal Rollback', response.data?.message || 'Terjadi kesalahan.');
            }
        } catch (err: any) {
            toast.error('Gagal Rollback', err.response?.data?.message || 'Gagal mengeksekusi rollback di server.');
        } finally {
            setIsRollingBack(false);
        }
    };

    const handleToggleMaintenance = async (enable: boolean) => {
        const actionText = enable ? 'mengunci situs ke Mode Darurat (Maintenance Mode)' : 'menormalkan kembali situs';
        if (!confirm(`Konfirmasi Tindakan:\n\nApakah Anda yakin ingin ${actionText} untuk situs ${siteName}?`)) {
            return;
        }

        setIsTogglingMaintenance(true);
        try {
            const response = await axios.post(route('server-investigations.toggle-maintenance', siteId), {
                enable,
            });

            if (response.data?.success) {
                setIsMaintenanceActive(enable);
                toast.success(enable ? 'Mode Darurat Aktif' : 'Situs Dinormalkan', response.data.message);
                setLastActionLog(`[${new Date().toLocaleTimeString()}] ${response.data.message}`);
            } else {
                toast.error('Gagal', response.data?.message || 'Terjadi kesalahan.');
            }
        } catch (err: any) {
            toast.error('Gagal', err.response?.data?.message || 'Gagal mengubah status pemeliharaan situs.');
        } finally {
            setIsTogglingMaintenance(false);
        }
    };

    return (
        <div className="tab-pane-content">
            {/* Header info */}
            <div 
                className="card border-0 rounded-4 p-4 mb-4 shadow-sm"
                style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            >
                <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-shield-check text-success" style={{ fontSize: '1.2rem' }}></i>
                    <h5 className="fw-bold m-0" style={{ color: 'var(--ink, #0f2a3f)' }}>
                        Remediasi Cepat & Pemulihan Insiden (*Self-Healing*)
                    </h5>
                </div>
                <p className="text-muted m-0" style={{ fontSize: '0.84rem' }}>
                    Alat tanggap insiden seketika via SSH untuk memulihkan halaman yang terkena defacement atau mengisolasi situs saat serangan aktif berlangsung.
                </p>
            </div>

            <div className="row g-4">
                {/* Action Card 1: Instant File Rollback */}
                <div className="col-12 col-lg-6">
                    <div 
                        className="card border-0 rounded-4 p-4 h-100 shadow-sm"
                        style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
                    >
                        <div className="d-flex align-items-center gap-2.5 mb-3">
                            <div 
                                style={{
                                    width: '42px', height: '42px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.2rem', flexShrink: 0,
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                                }}
                            >
                                <i className="bi bi-arrow-counterclockwise"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold m-0 text-dark">Rollback Berkas Inti Seketika</h6>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                    Memulihkan file rusak / deface dari commit baseline atau snapshot
                                </span>
                            </div>
                        </div>

                        <p className="text-secondary mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                            Saat peretas mengganti berkas seperti <code>index.php</code> atau <code>.htaccess</code>, fitur ini akan mengeksekusi pemulihan instan ke versi asli yang bersih via SSH.
                        </p>

                        <div className="mb-3">
                            <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>
                                Nama / Jalur Berkas Target:
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-light text-muted border-end-0">
                                    <i className="bi bi-file-earmark-code"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={targetFile}
                                    onChange={(e) => setTargetFile(e.target.value)}
                                    placeholder="misal: index.php atau .htaccess"
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </div>
                            <div className="form-text" style={{ fontSize: '0.72rem' }}>
                                {isGitRepo ? (
                                    <span className="text-success"><i className="bi bi-check-circle me-1"></i>Repositori Git aktif. Rollback menggunakan <code>git checkout HEAD</code>.</span>
                                ) : (
                                    <span className="text-muted"><i className="bi bi-info-circle me-1"></i>Sistem akan mencari snapshot cadangan (.bak) di server.</span>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn text-white w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2.5 rounded-3 shadow-sm"
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                fontWeight: 600,
                                fontSize: '0.86rem',
                                border: 'none',
                            }}
                            onClick={handleRollback}
                            disabled={isRollingBack || !targetFile.trim()}
                        >
                            {isRollingBack ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    <span>Mengeksekusi Pemulihan di Server...</span>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-arrow-repeat"></i>
                                    <span>Pulihkan Berkas ({targetFile}) Sekarang</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Action Card 2: Emergency Lockdown / Maintenance */}
                <div className="col-12 col-lg-6">
                    <div 
                        className="card border-0 rounded-4 p-4 h-100 shadow-sm"
                        style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
                    >
                        <div className="d-flex align-items-center gap-2.5 mb-3">
                            <div 
                                style={{
                                    width: '42px', height: '42px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.2rem', flexShrink: 0,
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
                                }}
                            >
                                <i className="bi bi-cone-striped"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold m-0 text-dark">Isolasi Darurat (Maintenance Lockdown)</h6>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                    Cegah publik melihat halaman deface selama investigasi aktif
                                </span>
                            </div>
                        </div>

                        <p className="text-secondary mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                            Jika serangan defacement atau ransomware sedang aktif, kunci akses situs seketika ke halaman pemeliharaan sementara agar reputasi instansi terlindungi saat proses penanganan berlangsung.
                        </p>

                        <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="text-muted">Status Isolasi Saat Ini:</span>
                                <span className={`badge rounded-pill ${isMaintenanceActive ? 'bg-warning text-dark' : 'bg-success-subtle text-success border border-success-subtle'} px-2.5 py-1`}>
                                    {isMaintenanceActive ? 'Terkunci (Mode Darurat)' : 'Operasional Normal'}
                                </span>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-warning flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 py-2.5 rounded-3"
                                style={{ fontWeight: 600, fontSize: '0.85rem' }}
                                onClick={() => handleToggleMaintenance(true)}
                                disabled={isTogglingMaintenance || isMaintenanceActive}
                            >
                                <i className="bi bi-lock-fill"></i>
                                <span>Aktifkan Mode Darurat</span>
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-success flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 py-2.5 rounded-3"
                                style={{ fontWeight: 600, fontSize: '0.85rem' }}
                                onClick={() => handleToggleMaintenance(false)}
                                disabled={isTogglingMaintenance || !isMaintenanceActive}
                            >
                                <i className="bi bi-unlock-fill"></i>
                                <span>Normalkan Situs</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* SOP CSIRT Guide Card */}
                <div className="col-12">
                    <div 
                        className="card border-0 rounded-4 p-4 shadow-sm"
                        style={{ background: 'linear-gradient(135deg, rgba(15, 42, 63, 0.04), rgba(14, 165, 163, 0.05))', border: '1px solid rgba(14, 165, 163, 0.2)' }}
                    >
                        <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                            <i className="bi bi-card-checklist text-teal"></i>
                            Standar Alur Tanggap Darurat CSIRT (BSSN):
                        </h6>
                        <div className="row g-3" style={{ fontSize: '0.8rem', color: '#475569' }}>
                            <div className="col-12 col-md-3">
                                <div className="p-2.5 bg-white rounded-3 border h-100">
                                    <div className="fw-bold text-dark mb-1">1. Isolasi Cepat</div>
                                    Aktifkan Mode Darurat untuk memutus akses peretas dan mencegah paparan publik.
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="p-2.5 bg-white rounded-3 border h-100">
                                    <div className="fw-bold text-dark mb-1">2. Karantina Backdoor</div>
                                    Gunakan Tab "Pindai Berkas" untuk mengisolasi file webshell ke folder <code>.sigap_quarantine</code>.
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="p-2.5 bg-white rounded-3 border h-100">
                                    <div className="fw-bold text-dark mb-1">3. Rollback Berkas</div>
                                    Pulihkan file <code>index.php</code> ke versi komit Git baseline yang bersih.
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="p-2.5 bg-white rounded-3 border h-100">
                                    <div className="fw-bold text-dark mb-1">4. Verifikasi & Buka</div>
                                    Normalkan kembali situs dan pantau log akses di Tab "Forensik Log".
                                </div>
                            </div>
                        </div>

                        {lastActionLog && (
                            <div className="mt-3 pt-3 border-top text-muted font-monospace" style={{ fontSize: '0.76rem' }}>
                                Log Aktivitas Terakhir: <strong className="text-dark">{lastActionLog}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
