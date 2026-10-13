import React, { useState } from 'react';
import axios from 'axios';
import { toast } from '@/Components/DynamicToast';

interface FileScanTabProps {
    siteId: string;
    siteName: string;
}

export default function FileScanTab({ siteId, siteName }: FileScanTabProps) {
    const [scanMode, setScanMode] = useState<'quick' | 'deep' | 'git'>('deep');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [quarantiningFile, setQuarantiningFile] = useState<string | null>(null);
    const [selectedSnippet, setSelectedSnippet] = useState<{ path: string; snippet: string } | null>(null);

    const handleRunScan = async () => {
        setIsScanning(true);
        try {
            const response = await axios.post(route('server-investigations.scan-files', siteId), {
                mode: scanMode,
            });

            if (response.data?.success) {
                setScanResult(response.data.data);
                toast.success('Pemindaian Selesai', `Berhasil memindai berkas server situs ${siteName}.`);
            } else {
                toast.error('Gagal', response.data?.message || 'Terjadi kesalahan saat memindai berkas.');
            }
        } catch (err: any) {
            toast.error('Gagal', err.response?.data?.message || 'Gagal terhubung ke server SSH untuk pemindaian.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleQuarantine = async (filePath: string) => {
        if (!confirm(`Apakah Anda yakin ingin mengisolasi berkas:\n\n${filePath}\n\nBerkas akan dipindahkan ke folder .sigap_quarantine dengan izin non-eksekusi (chmod 000)?`)) {
            return;
        }

        setQuarantiningFile(filePath);
        try {
            const response = await axios.post(route('server-investigations.quarantine-file', siteId), {
                file_path: filePath,
            });

            if (response.data?.success) {
                toast.success('Berkas Diisolasi', response.data.message);
                // Remove or update the file from findings
                if (scanResult && scanResult.findings) {
                    setScanResult({
                        ...scanResult,
                        findings: scanResult.findings.filter((f: any) => f.path !== filePath),
                        total_findings: Math.max(0, scanResult.total_findings - 1),
                    });
                }
            } else {
                toast.error('Gagal Karantina', response.data?.message || 'Gagal memindahkan berkas.');
            }
        } catch (err: any) {
            toast.error('Gagal Karantina', err.response?.data?.message || 'Terjadi kesalahan saat memindahkan berkas.');
        } finally {
            setQuarantiningFile(null);
        }
    };

    return (
        <div className="tab-pane-content">
            {/* Top Controls: Scan Mode & Trigger */}
            <div 
                className="card border-0 rounded-4 p-4 mb-4 shadow-sm"
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                }}
            >
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                    <div>
                        <h5 className="fw-bold m-0" style={{ color: 'var(--ink, #0f2a3f)' }}>
                            <i className="bi bi-radar text-teal me-2" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                            Pindai Berkas Proyek & Pemburu Webshell (White-Box)
                        </h5>
                        <p className="text-muted m-0 mt-1" style={{ fontSize: '0.84rem' }}>
                            Pilih cakupan pemindaian berkas untuk mendeteksi backdoor terselubung, file PHP di folder upload, atau perubahan ilegal.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn text-white d-inline-flex align-items-center gap-2 shadow-sm px-4 py-2.5"
                        style={{
                            background: 'linear-gradient(135deg, var(--teal-1, #0ea5a3), var(--blue-1, #0284c7))',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            border: 'none',
                        }}
                        onClick={handleRunScan}
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <span>Memindai Berkas Server...</span>
                            </>
                        ) : (
                            <>
                                <i className="bi bi-shield-shaded"></i>
                                <span>Mulai Pindai Sekarang</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Mode Selector Radio Pills */}
                <div className="row g-2.5">
                    <div className="col-12 col-md-4">
                        <div 
                            className={`p-3 rounded-3 border transition-all cursor-pointer h-100 ${scanMode === 'deep' ? 'border-primary' : ''}`}
                            style={{
                                background: scanMode === 'deep' ? 'rgba(14, 165, 163, 0.06)' : '#f8fafc',
                                borderColor: scanMode === 'deep' ? 'var(--teal-1, #0ea5a3)' : '#e2e8f0',
                                cursor: 'pointer',
                            }}
                            onClick={() => setScanMode('deep')}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                                <span className="fw-bold" style={{ fontSize: '0.88rem', color: scanMode === 'deep' ? 'var(--teal-1, #0ea5a3)' : '#1e293b' }}>
                                    <i className="bi bi-bug-fill me-1.5 text-danger"></i>
                                    Pindai Mendalam (Deep Scan)
                                </span>
                                <input 
                                    type="radio" 
                                    name="scanMode" 
                                    checked={scanMode === 'deep'} 
                                    onChange={() => setScanMode('deep')} 
                                    className="form-check-input"
                                />
                            </div>
                            <p className="text-secondary mb-0" style={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                                Heuristik regex pencari fungsi berbahaya (<code>eval</code>, <code>base64_decode</code>, <code>shell_exec</code>) dan PHP liar di folder publik/upload.
                            </p>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div 
                            className={`p-3 rounded-3 border transition-all cursor-pointer h-100 ${scanMode === 'quick' ? 'border-primary' : ''}`}
                            style={{
                                background: scanMode === 'quick' ? 'rgba(14, 165, 163, 0.06)' : '#f8fafc',
                                borderColor: scanMode === 'quick' ? 'var(--teal-1, #0ea5a3)' : '#e2e8f0',
                                cursor: 'pointer',
                            }}
                            onClick={() => setScanMode('quick')}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                                <span className="fw-bold" style={{ fontSize: '0.88rem', color: scanMode === 'quick' ? 'var(--teal-1, #0ea5a3)' : '#1e293b' }}>
                                    <i className="bi bi-clock-history me-1.5 text-warning"></i>
                                    Pindai Cepat (48 Jam Terakhir)
                                </span>
                                <input 
                                    type="radio" 
                                    name="scanMode" 
                                    checked={scanMode === 'quick'} 
                                    onChange={() => setScanMode('quick')} 
                                    className="form-check-input"
                                />
                            </div>
                            <p className="text-secondary mb-0" style={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                                Memindai berkas skrip PHP, HTML, dan .htaccess yang baru dibuat atau diubah dalam kurun waktu 2 hari terakhir.
                            </p>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div 
                            className={`p-3 rounded-3 border transition-all cursor-pointer h-100 ${scanMode === 'git' ? 'border-primary' : ''}`}
                            style={{
                                background: scanMode === 'git' ? 'rgba(14, 165, 163, 0.06)' : '#f8fafc',
                                borderColor: scanMode === 'git' ? 'var(--teal-1, #0ea5a3)' : '#e2e8f0',
                                cursor: 'pointer',
                            }}
                            onClick={() => setScanMode('git')}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                                <span className="fw-bold" style={{ fontSize: '0.88rem', color: scanMode === 'git' ? 'var(--teal-1, #0ea5a3)' : '#1e293b' }}>
                                    <i className="bi bi-git me-1.5 text-primary"></i>
                                    Integritas Git (FIM Scan)
                                </span>
                                <input 
                                    type="radio" 
                                    name="scanMode" 
                                    checked={scanMode === 'git'} 
                                    onChange={() => setScanMode('git')} 
                                    className="form-check-input"
                                />
                            </div>
                            <p className="text-secondary mb-0" style={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                                Memeriksa status repositori Git untuk mendeteksi berkas asing tak terdaftar (untracked) dan berkas yang dimodifikasi tanpa komit resmi.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scan Results Section */}
            {scanResult ? (
                <div>
                    {/* Summary Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>STATUS RISIKO</div>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                    <span className={`badge rounded-pill ${scanResult.total_findings === 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-2.5 py-1`} style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                        {scanResult.risk_summary}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>TEMUAN MENCURIGAKAN</div>
                                <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: scanResult.total_findings > 0 ? '#dc2626' : '#10b981' }}>
                                    {scanResult.total_findings} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>berkas</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>TOTAL DIPERIKSA</div>
                                <div className="fw-bold mt-1 text-dark" style={{ fontSize: '1.4rem' }}>
                                    {scanResult.total_scanned} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>berkas</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>WAKTU PEMINDAIAN</div>
                                <div className="fw-semibold text-secondary mt-1 text-truncate" style={{ fontSize: '0.88rem' }}>
                                    {scanResult.scanned_at}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Findings Table */}
                    <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden border">
                        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <h6 className="fw-bold m-0 text-dark">
                                Daftar Berkas Terindikasi ({scanResult.findings?.length || 0})
                            </h6>
                            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                Jalur Aplikasi: <code>{scanResult.app_path}</code>
                            </span>
                        </div>

                        {scanResult.findings && scanResult.findings.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
                                    <thead className="bg-light text-muted" style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        <tr>
                                            <th className="ps-4">Berkas Terindikasi</th>
                                            <th>Klasifikasi Ancaman</th>
                                            <th>Tingkat Bahaya</th>
                                            <th>Waktu Modifikasi</th>
                                            <th className="pe-4 text-end">Tindakan Cepat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scanResult.findings.map((finding: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="ps-4">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-file-earmark-code text-teal" style={{ fontSize: '1.1rem' }}></i>
                                                        <div>
                                                            <div className="fw-semibold text-dark text-break">
                                                                {finding.path}
                                                            </div>
                                                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                                Ukuran: {finding.size}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="fw-semibold text-dark" style={{ fontSize: '0.82rem' }}>
                                                        {finding.threat_type}
                                                    </div>
                                                    {finding.snippet && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-link p-0 text-decoration-none text-primary"
                                                            style={{ fontSize: '0.72rem' }}
                                                            onClick={() => setSelectedSnippet({ path: finding.path, snippet: finding.snippet })}
                                                        >
                                                            <i className="bi bi-code-slash me-1"></i>Lihat Baris Kode Terindikasi
                                                        </button>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill ${
                                                        finding.severity === 'critical' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                                                        finding.severity === 'high' ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' :
                                                        'bg-secondary-subtle text-muted border'
                                                    } px-2.5 py-1`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                                        {finding.severity.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                    {finding.modified_at}
                                                </td>
                                                <td className="pe-4 text-end">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-2 shadow-sm"
                                                        style={{ fontSize: '0.78rem', fontWeight: 600 }}
                                                        onClick={() => handleQuarantine(finding.path)}
                                                        disabled={quarantiningFile === finding.path}
                                                        title="Pindahkan ke .sigap_quarantine dan set permission 000"
                                                    >
                                                        {quarantiningFile === finding.path ? (
                                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                        ) : (
                                                            <i className="bi bi-shield-x"></i>
                                                        )}
                                                        <span>Karantina Berkas</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <div 
                                    className="d-inline-flex align-items-center justify-content-center mb-3"
                                    style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', fontSize: '2rem' }}
                                >
                                    <i className="bi bi-check-circle-fill"></i>
                                </div>
                                <h6 className="fw-bold text-dark mb-1">Tidak Ditemukan Berkas Mencurigakan</h6>
                                <p className="text-muted mx-auto mb-0" style={{ maxWidth: '420px', fontSize: '0.84rem' }}>
                                    Seluruh berkas proyek dalam direktori aplikasi berada dalam batas parameter keamanan bersih.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Empty state before running scan */
                <div className="card border-0 rounded-4 p-5 text-center bg-white shadow-sm border">
                    <div 
                        className="d-inline-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'rgba(14, 165, 163, 0.1)', color: 'var(--teal-1, #0ea5a3)', fontSize: '2rem' }}
                    >
                        <i className="bi bi-radar"></i>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Siap Menjalankan Pemindaian Berkas</h5>
                    <p className="text-muted mx-auto mb-4" style={{ maxWidth: '480px', fontSize: '0.86rem' }}>
                        Klik tombol <strong>"Mulai Pindai Sekarang"</strong> di atas untuk memindai struktur proyek situs <strong>{siteName}</strong> via SSH.
                    </p>
                </div>
            )}

            {/* Snippet Preview Modal */}
            {selectedSnippet && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
                    style={{ background: 'rgba(15, 42, 63, 0.65)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
                    onClick={() => setSelectedSnippet(null)}
                >
                    <div 
                        className="card border-0 rounded-4 shadow-lg w-100 p-0 overflow-hidden"
                        style={{ maxWidth: '640px', background: '#ffffff' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light">
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-code-square text-teal"></i>
                                <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                                    Pratinjau Baris Kode Terindikasi
                                </span>
                            </div>
                            <button type="button" className="btn-close" onClick={() => setSelectedSnippet(null)}></button>
                        </div>
                        <div className="p-4">
                            <div className="mb-2 text-muted" style={{ fontSize: '0.78rem' }}>
                                Berkas: <code>{selectedSnippet.path}</code>
                            </div>
                            <pre 
                                className="p-3 rounded-3 mb-0"
                                style={{ background: '#0f172a', color: '#f8fafc', fontSize: '0.78rem', maxHeight: '240px', overflowY: 'auto' }}
                            >
                                <code>{selectedSnippet.snippet}</code>
                            </pre>
                        </div>
                        <div className="px-4 py-3 bg-light border-top text-end">
                            <button 
                                type="button" 
                                className="btn btn-secondary btn-sm rounded-2 px-3" 
                                onClick={() => setSelectedSnippet(null)}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
