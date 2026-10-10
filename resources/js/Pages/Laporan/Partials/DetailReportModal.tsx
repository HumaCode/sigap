import React from 'react';
import BaseModal from '@/Components/BaseModal';
import OfficialPrintDocument from './OfficialPrintDocument';

interface DetailReportModalProps {
    show: boolean;
    onClose: () => void;
    site: any;
}

export default function DetailReportModal({ show, onClose, site }: DetailReportModalProps) {
    if (!show || !site) return null;

    const isMetSla = (site.uptime ?? 99.9) >= 99.5;
    const isDown = site.status === 'down';
    const isWarn = site.status === 'warn';
    const isPaused = site.status === 'paused';

    const getStatusGradient = () => {
        if (isDown) return 'linear-gradient(135deg, #ef4444, #991b1b)';
        if (isWarn) return 'linear-gradient(135deg, #f59e0b, #b45309)';
        if (isPaused) return 'linear-gradient(135deg, #64748b, #334155)';
        return 'linear-gradient(135deg, #0ea5a3, #0f2a3f)';
    };

    const getStatusIcon = () => {
        if (isDown) return 'bi bi-x-octagon-fill';
        if (isWarn) return 'bi bi-exclamation-triangle-fill';
        if (isPaused) return 'bi bi-pause-circle-fill';
        return 'bi bi-shield-check';
    };

    const getStatusText = () => {
        if (isDown) return 'Situs Mengalami Gangguan (Down)';
        if (isWarn) return 'Performa Lambat (High Load)';
        if (isPaused) return 'Pemantauan Dijeda';
        return 'Performa Ketersediaan Optimal';
    };

    const handlePrint = () => {
        if (typeof document !== 'undefined') {
            document.querySelectorAll('.sigap-print-document').forEach(el => el.classList.remove('sigap-print-active'));
            const target = document.getElementById('print-single-site');
            if (target) {
                target.classList.add('sigap-print-active');
            }
        }
        window.print();
    };

    const modalFooter = (
        <div className="w-100 d-flex align-items-center justify-content-between">
            <button 
                type="button" 
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 py-2" 
                style={{ borderRadius: '12px', fontWeight: 600 }}
                onClick={handlePrint}
            >
                <i className="bi bi-printer-fill"></i>
                <span>Cetak Laporan Situs Ini</span>
            </button>
            <button 
                type="button" 
                className="btn btn-light btn-sm px-4 py-2" 
                style={{ borderRadius: '12px', fontWeight: 600, color: '#64748b' }} 
                onClick={onClose}
            >
                Tutup
            </button>
        </div>
    );

    return (
        <>
            <BaseModal
            show={show}
            onClose={onClose}
            title={site.name}
            subtitle={
                <span className="d-flex align-items-center gap-2 mt-1">
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff' }}></span>
                    <span>{getStatusText()} • {site.category || 'Portal'}</span>
                    <span className="opacity-75 ms-1">• {site.url}</span>
                </span>
            }
            icon={getStatusIcon()}
            headerGradient={getStatusGradient()}
            size="lg"
            maxWidth="880px"
            footer={modalFooter}
        >
            {/* Top SLA Badge Banner */}
            <div className="d-flex align-items-center justify-content-between p-3 rounded-4 mb-4 bg-white border" style={{ borderColor: 'rgba(15,42,63,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div className="d-flex align-items-center gap-3">
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isMetSla ? 'rgba(14,165,163,0.1)' : 'rgba(239,68,68,0.1)', color: isMetSla ? 'var(--teal-1)' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                        <i className={`bi ${isMetSla ? 'bi-patch-check-fill' : 'bi-exclamation-circle-fill'}`}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluasi Target SLA</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ink)' }}>
                            {isMetSla ? 'Target Ketersediaan Tercapai (≥ 99.5%)' : 'Ketersediaan Di Bawah Standar SLA'}
                        </div>
                    </div>
                </div>
                <div>
                    {isMetSla ? (
                        <span className="badge px-3 py-2 text-white" style={{ background: 'linear-gradient(135deg, #0ea5a3, #0284c7)', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}>
                            <i className="bi bi-check-circle-fill me-1"></i> SLA TERCAPAI
                        </span>
                    ) : (
                        <span className="badge px-3 py-2 text-white" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}>
                            <i className="bi bi-x-circle-fill me-1"></i> DI BAWAH SLA
                        </span>
                    )}
                </div>
            </div>

            {/* Metrics 4-Grid Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-sm-3">
                    <div className="bg-white p-3 rounded-4 border h-100" style={{ borderColor: 'rgba(15,42,63,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 600, marginBottom: '0.25rem' }}>Uptime 30 Hari</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' }}>{site.uptime}%</div>
                        <div style={{ fontSize: '0.72rem', color: isMetSla ? 'var(--teal-1)' : '#ef4444', fontWeight: 700, marginTop: '0.2rem' }}>
                            {isMetSla ? '✓ Di atas target' : '⚠ Butuh optimasi'}
                        </div>
                    </div>
                </div>
                <div className="col-6 col-sm-3">
                    <div className="bg-white p-3 rounded-4 border h-100" style={{ borderColor: 'rgba(15,42,63,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 600, marginBottom: '0.25rem' }}>Est. Latensi</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' }}>{isDown ? 'Timeout' : (isWarn ? '1.4s' : '142ms')}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', fontWeight: 600, marginTop: '0.2rem' }}>Kecepatan respon</div>
                    </div>
                </div>
                <div className="col-6 col-sm-3">
                    <div className="bg-white p-3 rounded-4 border h-100" style={{ borderColor: 'rgba(15,42,63,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 600, marginBottom: '0.25rem' }}>Interval Cek</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' }}>{site.check_interval} <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', fontWeight: 600 }}>mnt</span></div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', fontWeight: 600, marginTop: '0.2rem' }}>Frekuensi monitor</div>
                    </div>
                </div>
                <div className="col-6 col-sm-3">
                    <div className="bg-white p-3 rounded-4 border h-100" style={{ borderColor: 'rgba(15,42,63,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 600, marginBottom: '0.25rem' }}>Penanggung Jawab</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{site.pic_name || '-'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', fontWeight: 600, marginTop: '0.2rem' }}>{site.pic_contact || 'No contact'}</div>
                    </div>
                </div>
            </div>

            {/* Recent Health Status Log */}
            <div className="bg-white p-4 rounded-4 border" style={{ borderColor: 'rgba(15,42,63,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                        <i className="bi bi-clock-history me-1" style={{ color: 'var(--teal-1)' }}></i> Riwayat Pemeriksaan Terakhir
                    </h6>
                    <span className="badge rounded-pill" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
                        Live Inspection Logs
                    </span>
                </div>
                <div className="d-flex flex-column gap-2">
                    {Array.isArray(site.recent_logs) && site.recent_logs.length > 0 ? (
                        site.recent_logs.map((log: any, index: number) => {
                            const isDangerLog = log.is_danger || log.status === 'down';
                            const isWarningLog = log.status === 'warn' || log.category === 'hidden';
                            const dotColor = isDangerLog ? '#ef4444' : (isWarningLog ? '#f59e0b' : '#22c55e');

                            return (
                                <div key={log.id || index} className="d-flex justify-content-between align-items-center p-3 rounded-3" style={{ background: '#f8fafc', fontSize: '0.86rem', border: '1px solid rgba(15,42,63,0.04)' }}>
                                    <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                                        <span style={{ width: '8px', height: '8px', minWidth: '8px', borderRadius: '50%', background: dotColor }}></span>
                                        <div className="text-truncate">
                                            <strong>{log.source || 'Scanner Engine'}</strong> — <span className={isDangerLog ? 'text-danger fw-semibold' : ''}>{log.title}</span>
                                        </div>
                                    </div>
                                    <span className="text-muted text-nowrap" style={{ fontSize: '0.78rem' }}>{log.time_ago || 'Baru saja'}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                            Belum ada riwayat log audit untuk situs ini.
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
        <OfficialPrintDocument type="single" site={site} />
        </>
    );
}
