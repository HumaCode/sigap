import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import SearchableSelect, { SelectOption } from '@/Components/SearchableSelect';
import PopupLoader from '@/Components/PopupLoader';

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
    const [isChangingSite, setIsChangingSite] = useState(false);
    const [targetSiteName, setTargetSiteName] = useState('');
    const [targetSiteHost, setTargetSiteHost] = useState('');

    const siteOptions: SelectOption[] = sites.map((s) => ({
        value: s.id,
        label: s.name,
        subLabel: `${s.ssh_username || 'admin'}@${s.ssh_host || 'localhost'}:${s.ssh_port || 22} • ${s.ssh_app_path || '/var/www/html'}`,
        badge: s.ssh_host,
        icon: 'bi bi-hdd-network',
    }));

    const handleSiteChange = (siteId: string) => {
        if (!siteId || siteId === selectedSite?.id) return;
        const target = sites.find((s) => s.id === siteId);
        setTargetSiteName(target?.name || 'Target Situs');
        setTargetSiteHost(
            target?.ssh_host
                ? `${target.ssh_username || 'admin'}@${target.ssh_host}:${target.ssh_port || 22}`
                : target?.url || 'server'
        );
        setIsChangingSite(true);

        router.get(
            route('server-investigations.index'),
            { site_id: siteId },
            {
                preserveState: false,
                preserveScroll: true,
                onFinish: () => {
                    setIsChangingSite(false);
                },
                onError: () => {
                    setIsChangingSite(false);
                },
            }
        );
    };

    const isConnected = serverHealth?.success;

    return (
        <div className="mb-4 position-relative" style={{ zIndex: 40 }}>
            {/* Toolbar: Site Selector & Actions */}
            <div 
                className="position-relative d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 rounded-4 mb-3"
                style={{
                    zIndex: 35,
                    background: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(226, 232, 240, 0.85)',
                    boxShadow: '0 4px 18px rgba(15, 42, 63, 0.03)',
                }}
            >
                {/* Left: Site Selector Dropdown (Select2 / SearchableSelect) & Refresh */}
                <div className="d-flex align-items-center gap-2.5 flex-wrap flex-grow-1 position-relative" style={{ zIndex: 30 }}>
                    <div style={{ minWidth: '320px', maxWidth: '440px', flex: 1, position: 'relative' }}>
                        <SearchableSelect
                            options={siteOptions}
                            value={selectedSite?.id || ''}
                            onChange={handleSiteChange}
                            insideLabel={isChangingSite ? 'Menghubungkan Situs...' : 'Target Situs (SSH Aktif)'}
                            leadingIcon={isChangingSite ? 'spinner-border spinner-border-sm text-teal' : 'bi bi-hdd-network'}
                            placeholder="Pilih situs target investigasi..."
                            searchPlaceholder="Ketik nama situs, domain, atau IP..."
                            disabled={isChangingSite}
                        />
                    </div>

                    <button
                        type="button"
                        className="btn btn-light d-inline-flex align-items-center gap-1.5 px-3 rounded-3 shadow-sm"
                        style={{
                            height: '48px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: 'var(--ink, #0f2a3f)',
                        }}
                        onClick={onRefreshHealth}
                        disabled={isCheckingHealth || !selectedSite}
                        title="Tes ulang koneksi SSH & perbarui telemetri server"
                    >
                        <i className={`bi bi-arrow-clockwise ${isCheckingHealth ? 'spin-icon' : ''}`} style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                        <span>{isCheckingHealth ? 'Memeriksa...' : 'Cek Status SSH'}</span>
                    </button>
                </div>

                {/* Right: Info Badge & Site URL */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span 
                        className="badge rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5"
                        style={{
                            background: 'rgba(14, 165, 163, 0.08)',
                            color: 'var(--teal-1, #0ea5a3)',
                            border: '1px solid rgba(14, 165, 163, 0.2)',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                        }}
                    >
                        <i className="bi bi-shield-lock-fill"></i>
                        <span>{sites.length} Situs Ber-SSH Terdaftar</span>
                    </span>

                    {selectedSite?.url && (
                        <a
                            href={selectedSite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-link text-decoration-none text-muted d-inline-flex align-items-center gap-1 px-2"
                            style={{ fontSize: '0.78rem' }}
                            title="Buka URL situs di tab baru"
                        >
                            <span>Kunjungi Situs</span>
                            <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.7rem' }}></i>
                        </a>
                    )}
                </div>
            </div>

            {/* Server Spec & Telemetry Strip */}
            {selectedSite && (
                <div 
                    className="position-relative p-3.5 rounded-4 border transition-all"
                    style={{
                        zIndex: 1,
                        background: isConnected 
                            ? 'linear-gradient(135deg, rgba(240, 253, 250, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%)' 
                            : 'linear-gradient(135deg, rgba(254, 242, 242, 0.85) 0%, rgba(255, 255, 255, 0.95) 100%)',
                        borderColor: isConnected ? 'rgba(153, 246, 228, 0.8)' : 'rgba(254, 202, 202, 0.8)',
                        boxShadow: '0 4px 18px rgba(15, 42, 63, 0.02)',
                    }}
                >
                    <div className="row g-3 align-items-center">
                        {/* Server Host & Status */}
                        <div className="col-12 col-md-4">
                            <div className="d-flex align-items-center gap-2.5">
                                <div 
                                    style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: isConnected 
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem', flexShrink: 0,
                                        boxShadow: isConnected 
                                            ? '0 4px 12px rgba(16, 185, 129, 0.25)' 
                                            : '0 4px 12px rgba(239, 68, 68, 0.25)'
                                    }}
                                >
                                    <i className={isConnected ? "bi bi-check-circle-fill" : "bi bi-exclamation-triangle-fill"}></i>
                                </div>
                                <div>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <span className="fw-bold" style={{ fontSize: '0.92rem', color: 'var(--ink, #0f2a3f)' }}>
                                            {selectedSite.name}
                                        </span>
                                        <span 
                                            className={`badge rounded-pill ${isConnected ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-2 py-0.5`} 
                                            style={{ fontSize: '0.68rem', fontWeight: 600 }}
                                        >
                                            {isConnected ? `SSH Terhubung (${serverHealth?.latency_ms || 24} ms)` : 'SSH Terputus / Error'}
                                        </span>
                                    </div>
                                    <div className="text-muted mt-0.5" style={{ fontSize: '0.76rem' }}>
                                        <code>{selectedSite.ssh_username}@{selectedSite.ssh_host}:{selectedSite.ssh_port || 22}</code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Application Path */}
                        <div className="col-12 col-md-4 border-start-md">
                            <div style={{ fontSize: '0.78rem' }}>
                                <div className="text-muted d-flex align-items-center justify-content-between mb-1">
                                    <span className="d-flex align-items-center gap-1.5">
                                        <i className="bi bi-folder-symlink text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                        <span>Path Aplikasi di Server:</span>
                                    </span>
                                    {isConnected ? (
                                        <span className={`badge ${serverHealth?.app_path_valid ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`} style={{ fontSize: '0.65rem' }}>
                                            {serverHealth?.app_path_valid ? 'Ditemukan' : 'Folder Tidak Ada'}
                                        </span>
                                    ) : (
                                        <span className="badge bg-secondary-subtle text-muted" style={{ fontSize: '0.65rem' }}>
                                            Belum Terverifikasi
                                        </span>
                                    )}
                                </div>
                                <div className="fw-semibold text-dark text-truncate" title={selectedSite.ssh_app_path}>
                                    <code style={{ background: 'rgba(15, 42, 63, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                        {selectedSite.ssh_app_path || '/var/www/html'}
                                    </code>
                                </div>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="col-12 col-md-4 border-start-md">
                            <div className="row g-2 text-muted" style={{ fontSize: '0.75rem' }}>
                                <div className="col-6">
                                    <i className={`bi bi-hdd-fill me-1 ${isConnected ? 'text-teal' : 'text-danger'}`} style={{ color: isConnected ? 'var(--teal-1, #0ea5a3)' : undefined }}></i> Disk: <strong className={isConnected ? "text-dark" : "text-danger"}>{isConnected ? (serverHealth?.disk_usage || '-') : 'Terputus'}</strong>
                                </div>
                                <div className="col-6">
                                    <i className={`bi bi-filetype-php me-1 ${isConnected ? 'text-teal' : 'text-danger'}`} style={{ color: isConnected ? 'var(--teal-1, #0ea5a3)' : undefined }}></i> PHP: <strong className={isConnected ? "text-dark" : "text-danger"}>{isConnected ? (serverHealth?.php_version || '-') : 'Terputus'}</strong>
                                </div>
                                <div className="col-6">
                                    <i className={`bi bi-git me-1 ${isConnected ? 'text-teal' : 'text-danger'}`} style={{ color: isConnected ? 'var(--teal-1, #0ea5a3)' : undefined }}></i> Git Repo: <strong className={isConnected ? "text-dark" : "text-danger"}>{isConnected ? (serverHealth?.is_git_repo ? 'Aktif' : 'Non-Git') : 'Terputus'}</strong>
                                </div>
                                <div className="col-6">
                                    <i className={`bi bi-globe2 me-1 ${isConnected ? 'text-teal' : 'text-danger'}`} style={{ color: isConnected ? 'var(--teal-1, #0ea5a3)' : undefined }}></i> Server: <strong className={isConnected ? "text-dark" : "text-danger"}>{isConnected ? (serverHealth?.web_server || 'Web Server') : 'Terputus'}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notice if disconnected */}
                    {!isConnected && serverHealth?.error && (
                        <div className="mt-2.5 pt-2 border-top text-danger d-flex align-items-start gap-2" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-exclamation-octagon-fill fs-6 flex-shrink-0 text-danger"></i>
                            <div>
                                <strong>Kendala Koneksi SSH:</strong> {serverHealth.error}. Periksa kembali IP Host, Port, atau Kredensial SSH pada konfigurasi situs.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Interactive 3D Popup Loader When Switching Sites */}
            <PopupLoader
                isOpen={isChangingSite}
                status="loading"
                title={`Beralih ke Situs: ${targetSiteName}`}
                message={`Membuka sesi koneksi SSH terenkripsi (${targetSiteHost}) dan memuat telemetri investigasi keamanan situs...`}
                badgeText="KONEKSI SSH TARGET"
                icon={<i className="bi bi-hdd-network-fill" style={{ fontSize: '2rem', color: '#0ea5a3' }} />}
                maxWidth="540px"
            />
        </div>
    );
}
