import React from 'react';
import { router } from '@inertiajs/react';

interface SiteItem {
    id: string;
    name: string;
    url: string;
    status: string;
    ssh_host?: string;
    ssh_port?: number;
    ssh_username?: string;
    ssh_app_path?: string;
}

interface InvestigationHeaderProps {
    sites: SiteItem[];
    selectedSite: SiteItem | null;
    serverHealth: any;
    isCheckingHealth: boolean;
    onRefreshHealth: () => void;
}

export default function InvestigationHeader({
    sites,
    selectedSite,
    serverHealth,
    isCheckingHealth,
    onRefreshHealth,
}: InvestigationHeaderProps) {
    const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const siteId = e.target.value;
        router.get(route('server-investigations.index'), { site_id: siteId }, { preserveState: false });
    };

    const isConnected = serverHealth?.success;

    return (
        <div className="mb-4">
            {/* Top Bar: Title & Site Selector */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span 
                            className="badge rounded-pill px-2.5 py-1 text-white d-inline-flex align-items-center gap-1.5 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)', fontSize: '0.74rem', fontWeight: 600 }}
                        >
                            <i className="bi bi-shield-lock-fill"></i> CSIRT White-Box Sentinel
                        </span>
                        <span className="badge bg-light text-muted border rounded-pill" style={{ fontSize: '0.72rem' }}>
                            {sites.length} Situs Ber-SSH Terhubung
                        </span>
                    </div>
                    <h2 className="fw-bold m-0" style={{ color: 'var(--ink, #0f2a3f)', letterSpacing: '-0.02em', fontSize: '1.5rem' }}>
                        Investigasi & Pertahanan Server
                    </h2>
                    <p className="text-muted m-0 mt-0.5" style={{ fontSize: '0.84rem' }}>
                        Pemeriksaan mendalam kode sumber, isolasi webshell seketika, dan analisis log forensik server.
                    </p>
                </div>

                {/* Site Selector Dropdown */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <div className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-3 border shadow-sm" style={{ minWidth: '280px' }}>
                        <i className="bi bi-hdd-network text-teal" style={{ fontSize: '1.1rem', color: 'var(--teal-1, #0ea5a3)' }}></i>
                        <div className="flex-grow-1">
                            <label className="d-block text-muted text-uppercase mb-0" style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                                Target Situs (SSH Aktif)
                            </label>
                            <select
                                className="form-select form-select-sm border-0 p-0 shadow-none fw-bold text-dark"
                                style={{ background: 'transparent', cursor: 'pointer', fontSize: '0.88rem' }}
                                value={selectedSite?.id || ''}
                                onChange={handleSiteChange}
                            >
                                {sites.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.ssh_host})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5 py-2 px-3 rounded-3 shadow-sm"
                        style={{ fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
                        onClick={onRefreshHealth}
                        disabled={isCheckingHealth || !selectedSite}
                        title="Tes ulang koneksi SSH & spesifikasi server"
                    >
                        <i className={`bi bi-arrow-clockwise ${isCheckingHealth ? 'spin-slow' : ''}`}></i>
                        <span>{isCheckingHealth ? 'Memeriksa...' : 'Cek Status SSH'}</span>
                    </button>
                </div>
            </div>

            {/* Server Spec & Health Banner */}
            {selectedSite && (
                <div 
                    className="p-3.5 rounded-3 border transition-all"
                    style={{
                        background: isConnected ? 'linear-gradient(135deg, rgba(240, 253, 250, 0.9), rgba(255, 255, 255, 0.95))' : 'linear-gradient(135deg, rgba(254, 242, 242, 0.9), rgba(255, 255, 255, 0.95))',
                        borderColor: isConnected ? '#99f6e4' : '#fecaca',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                    }}
                >
                    <div className="row g-3 align-items-center">
                        <div className="col-12 col-md-4">
                            <div className="d-flex align-items-center gap-2.5">
                                <div 
                                    style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: isConnected ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem', flexShrink: 0,
                                        boxShadow: isConnected ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    <i className={isConnected ? "bi bi-check-circle-fill" : "bi bi-exclamation-triangle-fill"}></i>
                                </div>
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="fw-bold" style={{ fontSize: '0.92rem', color: 'var(--ink, #0f2a3f)' }}>
                                            {selectedSite.name}
                                        </span>
                                        <span className={`badge rounded-pill ${isConnected ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-2 py-0.5`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                            {isConnected ? `SSH Terhubung (${serverHealth?.latency_ms || 24} ms)` : 'SSH Terputus / Error'}
                                        </span>
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.76rem' }}>
                                        <code>{selectedSite.ssh_username}@{selectedSite.ssh_host}:{selectedSite.ssh_port || 22}</code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4 border-start-md">
                            <div style={{ fontSize: '0.78rem' }}>
                                <div className="text-muted d-flex align-items-center gap-1.5 mb-1">
                                    <i className="bi bi-folder-symlink text-teal"></i>
                                    <span>Path Aplikasi di Server:</span>
                                </div>
                                <div className="fw-semibold text-dark text-truncate" title={selectedSite.ssh_app_path}>
                                    <code>{selectedSite.ssh_app_path || '/var/www/html'}</code>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4 border-start-md">
                            <div className="row g-2 text-muted" style={{ fontSize: '0.75rem' }}>
                                <div className="col-6">
                                    <i className="bi bi-hdd-fill me-1 text-teal"></i> Disk: <strong className="text-dark">{serverHealth?.disk_usage || '-'}</strong>
                                </div>
                                <div className="col-6">
                                    <i className="bi bi-filetype-php me-1 text-teal"></i> PHP: <strong className="text-dark">{serverHealth?.php_version || '-'}</strong>
                                </div>
                                <div className="col-6">
                                    <i className="bi bi-git me-1 text-teal"></i> Git Repo: <strong className="text-dark">{serverHealth?.is_git_repo ? 'Aktif' : 'Non-Git'}</strong>
                                </div>
                                <div className="col-6">
                                    <i className="bi bi-globe2 me-1 text-teal"></i> Server: <strong className="text-dark">{serverHealth?.web_server || 'Web Server'}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
