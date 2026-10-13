import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import axios from 'axios';
import { toast } from '@/Components/DynamicToast';
import InvestigationHeader from './Partials/InvestigationHeader';
import FileScanTab from './Partials/FileScanTab';
import RemediationTab from './Partials/RemediationTab';
import LogForensicsTab from './Partials/LogForensicsTab';
import NoSshEmptyState from './Partials/NoSshEmptyState';

interface InvestigationPageProps extends PageProps {
    sites: any[];
    selectedSiteId: string | null;
    selectedSite: any | null;
    initialServerHealth: any | null;
}

export default function Index({
    sites = [],
    selectedSiteId,
    selectedSite,
    initialServerHealth,
}: InvestigationPageProps) {
    const [activeTab, setActiveTab] = useState<'scan' | 'remediation' | 'forensics'>('scan');
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

    return (
        <AuthenticatedLayout header="Investigasi Server">
            <Head title="Investigasi & Pertahanan Server" />

            <div className="py-4">
                <div className="container-fluid px-3 px-md-4">
                    {sites.length === 0 ? (
                        <NoSshEmptyState />
                    ) : (
                        <>
                            {/* Header Section: Site Selector & SSH Status */}
                            <InvestigationHeader
                                sites={sites}
                                selectedSite={selectedSite}
                                serverHealth={serverHealth}
                                isCheckingHealth={isCheckingHealth}
                                onRefreshHealth={handleRefreshHealth}
                            />

                            {/* Main 3 Tabs Navigation Bar */}
                            <div 
                                className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden"
                                style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
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
                                </div>

                                {/* Active Tab Body */}
                                <div className="p-4" style={{ minHeight: '360px' }}>
                                    {selectedSite ? (
                                        <>
                                            {activeTab === 'scan' && (
                                                <FileScanTab
                                                    siteId={selectedSite.id}
                                                    siteName={selectedSite.name}
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
