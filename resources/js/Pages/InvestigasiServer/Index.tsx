import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import axios from 'axios';
import { toast } from '@/Components/DynamicToast';
import PageHeader from '@/Components/PageHeader';
import InvestigationHeader from './Partials/InvestigationHeader';
import FileScanTab from './Partials/FileScanTab';
import RemediationTab from './Partials/RemediationTab';
import LogForensicsTab from './Partials/LogForensicsTab';
import ResourceMonitoringTab from './Partials/ResourceMonitoringTab';
import NoSshEmptyState from './Partials/NoSshEmptyState';

interface InvestigationPageProps extends PageProps {
    sites: any[];
    selectedSiteId: string | null;
    selectedSite: any | null;
    initialServerHealth: any | null;
    initialResourceUsage?: any | null;
    latestScan?: any | null;
}

export default function Index({
    sites = [],
    selectedSiteId,
    selectedSite,
    initialServerHealth,
    initialResourceUsage,
    latestScan,
}: InvestigationPageProps) {
    const [activeTab, setActiveTab] = useState<'scan' | 'remediation' | 'forensics' | 'resource'>('scan');
    const [serverHealth, setServerHealth] = useState<any>(initialServerHealth);
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);

    const handleRefreshHealth = async () => {
        if (!selectedSite) return;
        setIsCheckingHealth(true);
        try {
            const res = await axios.get(route('server-investigations.check-health', selectedSite.id));
            if (res.data?.success) {
                setServerHealth(res.data.data);
                toast.success('SSH Terhubung', `Koneksi SSH ke ${selectedSite.name} aktif dan terverifikasi.`);
            } else {
                toast.error('Gagal Cek SSH', res.data?.message || 'Koneksi SSH tidak merespon.');
            }
        } catch (err: any) {
            toast.error('Gagal', err.response?.data?.message || 'Gagal menghubungi server SSH.');
        } finally {
            setIsCheckingHealth(false);
        }
    };

    const isConnected = serverHealth?.success;

    const breadcrumbs = [
        { label: 'Dashboard', href: route('dashboard'), icon: 'bi-grid-fill' },
        { label: 'Deteksi', icon: 'bi-shield-check' },
        { label: 'Investigasi Server', active: true, icon: 'bi-terminal-split' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Investigasi & Pertahanan Server" />

            {/* Standard Sovereign Sentinel Page Header with Breadcrumbs & Status */}
            <PageHeader
                title="Investigasi & Pertahanan Server"
                subtitle="Pemeriksaan mendalam kode sumber, isolasi webshell seketika, dan analisis log forensik server."
                icon="bi-terminal-split"
                iconGradient="linear-gradient(135deg, var(--teal-1, #0ea5a3), var(--blue-1, #0284c7))"
                breadcrumbs={breadcrumbs}
                status={selectedSite ? {
                    label: 'Status SSH Server',
                    value: isConnected ? `Terhubung (${serverHealth?.latency_ms || 24} ms)` : 'SSH Terputus',
                    icon: isConnected ? 'bi-hdd-network-fill' : 'bi-exclamation-triangle-fill',
                    type: isConnected ? 'optimal' : 'danger',
                } : undefined}
            />

            {sites.length === 0 ? (
                <NoSshEmptyState />
            ) : (
                <>
                    {/* Site Selector Toolbar & Server Telemetry Strip */}
                    <InvestigationHeader
                        sites={sites}
                        selectedSite={selectedSite}
                        serverHealth={serverHealth}
                        isCheckingHealth={isCheckingHealth}
                        onRefreshHealth={handleRefreshHealth}
                    />

                    {/* Main 3 Tabs Navigation Bar */}
                    <div 
                        className="glass-card mb-4 overflow-hidden position-relative"
                        style={{
                            zIndex: 1,
                            background: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(226, 232, 240, 0.9)',
                            boxShadow: '0 8px 30px rgba(15, 42, 63, 0.04)',
                        }}
                    >
                        <div className="px-4 pt-3 pb-0 border-bottom d-flex align-items-center gap-3 overflow-x-auto">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none py-2.5 px-2 d-inline-flex align-items-center gap-2 transition-all text-nowrap"
                                style={{
                                    fontWeight: activeTab === 'scan' ? 700 : 500,
                                    fontSize: '0.88rem',
                                    color: activeTab === 'scan' ? 'var(--teal-1, #0ea5a3)' : '#64748b',
                                    borderBottom: activeTab === 'scan' ? '2.5px solid var(--teal-1, #0ea5a3)' : '2.5px solid transparent',
                                    borderRadius: 0,
                                }}
                                onClick={() => setActiveTab('scan')}
                            >
                                <i className="bi bi-bug-fill"></i>
                                <span>Pindai Berkas & Webshell</span>
                            </button>

                            <button
                                type="button"
                                className="btn btn-link text-decoration-none py-2.5 px-2 d-inline-flex align-items-center gap-2 transition-all text-nowrap"
                                style={{
                                    fontWeight: activeTab === 'remediation' ? 700 : 500,
                                    fontSize: '0.88rem',
                                    color: activeTab === 'remediation' ? 'var(--teal-1, #0ea5a3)' : '#64748b',
                                    borderBottom: activeTab === 'remediation' ? '2.5px solid var(--teal-1, #0ea5a3)' : '2.5px solid transparent',
                                    borderRadius: 0,
                                }}
                                onClick={() => setActiveTab('remediation')}
                            >
                                <i className="bi bi-arrow-counterclockwise"></i>
                                <span>Remediasi & Rollback Cepat</span>
                            </button>

                            <button
                                type="button"
                                className="btn btn-link text-decoration-none py-2.5 px-2 d-inline-flex align-items-center gap-2 transition-all text-nowrap"
                                style={{
                                    fontWeight: activeTab === 'forensics' ? 700 : 500,
                                    fontSize: '0.88rem',
                                    color: activeTab === 'forensics' ? 'var(--teal-1, #0ea5a3)' : '#64748b',
                                    borderBottom: activeTab === 'forensics' ? '2.5px solid var(--teal-1, #0ea5a3)' : '2.5px solid transparent',
                                    borderRadius: 0,
                                }}
                                onClick={() => setActiveTab('forensics')}
                            >
                                <i className="bi bi-file-earmark-medical-fill"></i>
                                <span>Forensik & Analisis Log</span>
                            </button>

                            <button
                                type="button"
                                className="btn btn-link text-decoration-none py-2.5 px-2 d-inline-flex align-items-center gap-2 transition-all text-nowrap"
                                style={{
                                    fontWeight: activeTab === 'resource' ? 700 : 500,
                                    fontSize: '0.88rem',
                                    color: activeTab === 'resource' ? 'var(--teal-1, #0ea5a3)' : '#64748b',
                                    borderBottom: activeTab === 'resource' ? '2.5px solid var(--teal-1, #0ea5a3)' : '2.5px solid transparent',
                                    borderRadius: 0,
                                }}
                                onClick={() => setActiveTab('resource')}
                            >
                                <i className="bi bi-speedometer2"></i>
                                <span>Utilisasi Resource Server</span>
                            </button>
                        </div>

                        {/* Active Tab Body */}
                        <div className="p-4" style={{ minHeight: '360px' }}>
                            {selectedSite ? (
                                <>
                                    {activeTab === 'scan' && (
                                        <FileScanTab
                                            siteId={selectedSite.id}
                                            siteName={selectedSite.name}
                                            initialScanResult={latestScan}
                                        />
                                    )}

                                    {activeTab === 'remediation' && (
                                        <RemediationTab
                                            siteId={selectedSite.id}
                                            siteName={selectedSite.name}
                                            isGitRepo={serverHealth?.is_git_repo}
                                        />
                                    )}

                                    {activeTab === 'forensics' && (
                                        <LogForensicsTab
                                            siteId={selectedSite.id}
                                            siteName={selectedSite.name}
                                        />
                                    )}

                                    {activeTab === 'resource' && (
                                        <ResourceMonitoringTab
                                            siteId={selectedSite.id}
                                            siteName={selectedSite.name}
                                            initialData={initialResourceUsage}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    Pilih situs dari daftar untuk memulai investigasi.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </AuthenticatedLayout>
    );
}
