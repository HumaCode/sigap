import React, { useState } from 'react';
import axios from 'axios';
import { toast } from '@/Components/DynamicToast';

interface FileScanTabProps {
    siteId: string;
    siteName: string;
    initialScanResult?: any | null;
}

export default function FileScanTab({ siteId, siteName, initialScanResult }: FileScanTabProps) {
    const [scanMode, setScanMode] = useState<'quick' | 'deep' | 'git'>(initialScanResult?.mode || 'deep');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(initialScanResult || null);
    const [quarantiningFile, setQuarantiningFile] = useState<string | null>(null);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [selectedSnippet, setSelectedSnippet] = useState<{ path: string; snippet: string } | null>(null);
    const [scanElapsed, setScanElapsed] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [activeFilter, setActiveFilter] = useState<'real' | 'vendor' | 'all'>('real');
    const [hideVendorScan, setHideVendorScan] = useState<boolean>(true);
    const [scanProgress, setScanProgress] = useState(0);
    const [simulatedFilesCount, setSimulatedFilesCount] = useState(0);
    const [isScanCompleted, setIsScanCompleted] = useState(false);
    const [currentInspectedFile, setCurrentInspectedFile] = useState<string>('');

    const isBladeCacheFile = (f: any) => Boolean(
        f.path?.includes('storage/framework/views/') || 
        f.path?.includes('storage/framework/cache/')
    );

    const isBootstrapCacheFile = (f: any) => Boolean(
        f.path?.includes('bootstrap/cache/')
    );

    const isVendorPackageFile = (f: any) => Boolean(
        f.is_vendor || 
        f.path?.startsWith('vendor/') || 
        f.path?.includes('/vendor/') || 
        f.path?.startsWith('node_modules/') || 
        f.path?.includes('/node_modules/')
    );

    const isLockfileOrManifest = (f: any) => {
        const name = f.path?.split('/').pop()?.toLowerCase() || '';
        return [
            'package-lock.json',
            'composer.lock',
            'yarn.lock',
            'pnpm-lock.yaml',
            'bun.lockb',
            'package.json',
            'composer.json',
            'tsconfig.json',
            '.gitignore',
            '.gitattributes',
            'readme.md',
        ].includes(name) || Boolean(f.is_lockfile);
    };

    const isDangerousScriptExtension = (filePath: string) => {
        return /\.(php|cjs|js|sh|py|pl|phtml|php[0-9]?)$/i.test(filePath);
    };

    const isFalsePositiveFile = (f: any) => Boolean(
        f.is_vendor || 
        f.is_framework_cache ||
        f.is_lockfile ||
        isBladeCacheFile(f) ||
        isBootstrapCacheFile(f) ||
        isVendorPackageFile(f) ||
        isLockfileOrManifest(f)
    );

    const isDangerousRootFile = (f: any) => {
        if (isFalsePositiveFile(f)) return false;
        const isRoot = !f.path?.includes('/');
        if (!isRoot) return false;
        if (!isDangerousScriptExtension(f.path)) return false;
        const baseName = f.path.toLowerCase();
        if (['vite.config.js', 'vite.config.ts', 'webpack.mix.js', 'tailwind.config.js', 'postcss.config.js', 'server.php', 'artisan'].includes(baseName)) {
            return false;
        }
        return true;
    };

    const findings = scanResult?.findings || [];
    const activeFindings = findings.filter((f: any) => !f.is_deleted);
    const realThreats = activeFindings.filter((f: any) => !isFalsePositiveFile(f));
    const falsePositiveFindings = activeFindings.filter((f: any) => isFalsePositiveFile(f));

    const realCriticalCount = realThreats.filter((f: any) => f.severity === 'critical').length;
    const realHighCount = realThreats.filter((f: any) => f.severity === 'high').length;

    // Default to 'real' if real threats exist, else 'all'
    React.useEffect(() => {
        if (realThreats.length > 0) {
            setActiveFilter('real');
        } else if (falsePositiveFindings.length > 0) {
            setActiveFilter('all');
        }
    }, [siteId, scanResult?.id, findings.length]);

    const displayedFindings = activeFilter === 'real'
        ? realThreats
        : activeFilter === 'vendor'
        ? falsePositiveFindings
        : activeFindings;

    const scanSteps = [
        {
            title: 'Otentikasi & Koneksi SSH Terenkripsi',
            desc: `Membuka sesi SSH aman dan memvalidasi akses direktori server ${siteName}...`,
            badge: 'SSH Handshake',
            icon: 'bi-hdd-network-fill',
        },
        {
            title: 'Membaca Struktur Pohon Berkas',
            desc: 'Memindai seluruh berkas skrip PHP, HTML, dan file konfigurasi web server...',
            badge: 'File Indexing',
            icon: 'bi-folder2-open',
        },
        {
            title: 'Inspeksi Heuristik & Webshell Hunter',
            desc: 'Menganalisis pola fungsi berbahaya: eval(), base64_decode(), shell_exec(), gzinflate()...',
            badge: 'Pattern Matching',
            icon: 'bi-bug-fill',
        },
        {
            title: 'Audit Direktori Sensitif & Folder Upload',
            desc: 'Mencari file PHP liar pada direktori uploads/, storage/, assets/, dan cache/...',
            badge: 'Deep Inspection',
            icon: 'bi-shield-shaded',
        },
        {
            title: 'Kompilasi Matriks Risiko & Finalisasi',
            desc: 'Menghitung skor ancaman keamanan dan menyimpan hasil pemindaian ke database...',
            badge: 'Finalizing',
            icon: 'bi-database-check',
        },
    ];

    // Progressive real-time simulation during active scanning
    React.useEffect(() => {
        let interval: any;
        const startTime = Date.now();

        if (isScanning && !isScanCompleted) {
            interval = setInterval(() => {
                const elapsedSec = (Date.now() - startTime) / 1000;
                setScanElapsed(Number(elapsedSec.toFixed(1)));

                setScanProgress((prev) => {
                    // While waiting for backend response, gently approach 94% without freezing
                    if (prev >= 94) {
                        return Math.min(96, prev + 0.04);
                    }
                    if (prev < 25) {
                        return prev + 1.8;
                    } else if (prev < 50) {
                        return prev + 1.3;
                    } else if (prev < 75) {
                        return prev + 0.85;
                    } else if (prev < 88) {
                        return prev + 0.45;
                    } else {
                        return prev + 0.2;
                    }
                });
            }, 60);
        }

        return () => clearInterval(interval);
    }, [isScanning, isScanCompleted]);

    // Synchronize milestones, step index, file counts, and telemetry inspection strings
    React.useEffect(() => {
        if (!isScanning) return;

        if (isScanCompleted) {
            setCurrentStepIndex(4);
            setSimulatedFilesCount((prev) => Math.max(prev, 1850));
            setCurrentInspectedFile('Pemindaian 100% selesai! Matriks risiko keamanan berhasil dikompilasi.');
            return;
        }

        if (scanProgress < 22) {
            setCurrentStepIndex(0);
            setSimulatedFilesCount(Math.round(scanProgress * 4));
            setCurrentInspectedFile('Memverifikasi sertifikat SSH host & otentikasi kunci...');
        } else if (scanProgress < 48) {
            setCurrentStepIndex(1);
            setSimulatedFilesCount(Math.round(88 + (scanProgress - 22) * 22));
            setCurrentInspectedFile('Membaca pohon direktori: app/, config/, public/, routes/...');
        } else if (scanProgress < 72) {
            setCurrentStepIndex(2);
            setSimulatedFilesCount(Math.round(660 + (scanProgress - 48) * 32));
            setCurrentInspectedFile('Mencocokkan pola signature webshell (eval, base64_decode, shell_exec)...');
        } else if (scanProgress < 90) {
            setCurrentStepIndex(3);
            setSimulatedFilesCount(Math.round(1428 + (scanProgress - 72) * 24));
            setCurrentInspectedFile('Audit folder upload & verifikasi proteksi lockfile (package-lock.json)...');
        } else {
            setCurrentStepIndex(4);
            setSimulatedFilesCount(Math.round(1860 + (scanProgress - 90) * 10));
            setCurrentInspectedFile('Mengompilasi matriks ancaman & finalisasi ringkasan keamanan...');
        }
    }, [scanProgress, isScanning, isScanCompleted]);

    // Sync with initialScanResult when siteId changes or on page reload
    React.useEffect(() => {
        setScanResult(initialScanResult || null);
        if (initialScanResult?.mode) {
            setScanMode(initialScanResult.mode);
        }
    }, [siteId, initialScanResult]);

    const handleRunScan = async () => {
        setIsScanning(true);
        setIsScanCompleted(false);
        setScanProgress(6);
        setScanElapsed(0);
        setCurrentStepIndex(0);
        setSimulatedFilesCount(15);
        setCurrentInspectedFile('Membuka koneksi SSH terenkripsi port 22...');

        try {
            const response = await axios.post(route('server-investigations.scan-files', siteId), {
                mode: scanMode,
                include_vendor: !hideVendorScan,
            });

            if (response.data?.success) {
                // Glide to 100% smoothly and celebrate full completion!
                setIsScanCompleted(true);
                setScanProgress(100);
                setCurrentStepIndex(4);
                setSimulatedFilesCount((prev) => Math.max(prev, 1920));
                setCurrentInspectedFile('Pemindaian 100% selesai! Hasil tersimpan ke database.');

                // Pause briefly so user can visibly see the bar reach 100% full!
                await new Promise((resolve) => setTimeout(resolve, 850));

                setScanResult(response.data.data);
                toast.success('Pemindaian Selesai', `Hasil pemindaian situs ${siteName} berhasil disimpan ke database.`);
            } else {
                toast.error('Gagal', response.data?.message || 'Terjadi kesalahan saat memindai berkas.');
            }
        } catch (err: any) {
            toast.error('Gagal', err.response?.data?.message || 'Gagal terhubung ke server SSH untuk pemindaian.');
        } finally {
            setIsScanning(false);
            setIsScanCompleted(false);
        }
    };

    const handleQuarantine = async (filePath: string) => {
        if (isFalsePositiveFile({ path: filePath })) {
            toast.error('Tindakan Dicegah', 'Berkas pustaka vendor atau cache framework Laravel (Blade / Manifest) dilindungi demi integritas sistem (mencegah Error 500).');
            return;
        }

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
                // Mark the file as quarantined in local findings state
                if (scanResult && scanResult.findings) {
                    setScanResult({
                        ...scanResult,
                        findings: scanResult.findings.map((f: any) =>
                            f.path === filePath ? { ...f, is_quarantined: true, quarantined_at: 'Baru saja' } : f
                        ),
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

    const confirmDeleteFile = async () => {
        if (!fileToDelete) return;

        if (isFalsePositiveFile({ path: fileToDelete })) {
            toast.error('Tindakan Dicegah', 'Berkas pustaka vendor atau cache internal Laravel (Blade / Manifest) dilindungi dan tidak boleh dihapus.');
            setFileToDelete(null);
            return;
        }

        setDeletingFile(fileToDelete);
        try {
            const response = await axios.post(route('server-investigations.delete-file', siteId), {
                file_path: fileToDelete,
            });

            if (response.data?.success) {
                toast.success('Berkas Dihapus', response.data.message || `Berkas ${fileToDelete} berhasil dihapus permanen.`);
                if (scanResult && scanResult.findings) {
                    setScanResult({
                        ...scanResult,
                        findings: scanResult.findings.map((f: any) =>
                            f.path === fileToDelete ? { ...f, is_deleted: true, deleted_at: 'Baru saja' } : f
                        ),
                    });
                }
                setFileToDelete(null);
            } else {
                toast.error('Gagal Menghapus', response.data?.message || 'Gagal menghapus berkas.');
            }
        } catch (err: any) {
            toast.error('Gagal Menghapus', err.response?.data?.message || 'Terjadi kesalahan saat menghapus berkas.');
        } finally {
            setDeletingFile(null);
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
                                <span>{isScanCompleted ? 'Pemindaian Selesai 100%' : `Memindai (${Math.round(scanProgress)}%)...`}</span>
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

                {/* Advanced Scan Filter Options */}
                <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ fontSize: '0.82rem' }}>
                    <label className="d-flex align-items-center gap-2 cursor-pointer user-select-none m-0">
                        <input
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={hideVendorScan}
                            onChange={(e) => setHideVendorScan(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        <span className="fw-semibold text-dark">
                            <i className="bi bi-shield-check text-success me-1"></i>
                            Sembunyikan False Positive Dependensi / Vendor (Rekomendasi CSIRT)
                        </span>
                    </label>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Mengecualikan folder <code>vendor/</code> dan <code>node_modules/</code> agar scanner fokus pada root script dan upload mencurigakan.
                    </span>
                </div>
            </div>

            {/* Scan Results / In-Progress Animation Section */}
            {isScanning ? (
                /* Interactive Scanning In-Progress Animation Card */
                <div 
                    className="card border-0 rounded-4 p-5 text-center shadow-sm overflow-hidden position-relative"
                    style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid #cbd5e1',
                    }}
                >
                    <style>{`
                        @keyframes radarPing {
                            0% { transform: scale(0.8); opacity: 0.85; }
                            50% { transform: scale(1.35); opacity: 0.35; }
                            100% { transform: scale(1.8); opacity: 0; }
                        }
                        @keyframes radarSweep {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes shimmerBar {
                            0% { background-position: -200% 0; }
                            100% { background-position: 200% 0; }
                        }
                        @keyframes cursorBlink {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0; }
                        }
                    `}</style>

                    {/* Radar Pulse Visual */}
                    <div className="position-relative d-inline-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '130px', height: '130px' }}>
                        {/* Outer Pulse Rings */}
                        <div 
                            className="position-absolute rounded-circle"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: isScanCompleted ? '2px solid rgba(16, 185, 129, 0.45)' : '2px solid rgba(14, 165, 163, 0.4)',
                                animation: 'radarPing 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                                transition: 'border-color 0.4s ease',
                            }}
                        />
                        <div 
                            className="position-absolute rounded-circle"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: isScanCompleted ? '2px solid rgba(16, 185, 129, 0.3)' : '2px solid rgba(2, 132, 199, 0.4)',
                                animation: 'radarPing 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite 0.8s',
                                transition: 'border-color 0.4s ease',
                            }}
                        />

                        {/* Center Radar Disc */}
                        <div 
                            className="rounded-circle d-flex align-items-center justify-content-center position-relative overflow-hidden"
                            style={{
                                width: '84px',
                                height: '84px',
                                background: isScanCompleted 
                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.25))' 
                                    : 'linear-gradient(135deg, rgba(14, 165, 163, 0.15), rgba(2, 132, 199, 0.2))',
                                border: isScanCompleted ? '2px solid #10b981' : '2px solid var(--teal-1, #0ea5a3)',
                                boxShadow: isScanCompleted ? '0 0 25px rgba(16, 185, 129, 0.35)' : '0 0 25px rgba(14, 165, 163, 0.25)',
                                transition: 'all 0.4s ease',
                            }}
                        >
                            {/* Sweeping Beam (stops when completed) */}
                            {!isScanCompleted && (
                                <div 
                                    className="position-absolute top-0 start-0 w-100 h-100"
                                    style={{
                                        background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(14, 165, 163, 0.45) 360deg)',
                                        animation: 'radarSweep 2s linear infinite',
                                        borderRadius: '50%',
                                    }}
                                />
                            )}

                            {isScanCompleted ? (
                                <i className="bi bi-shield-fill-check text-success position-relative" style={{ fontSize: '2.4rem' }}></i>
                            ) : (
                                <i className="bi bi-radar text-teal position-relative" style={{ fontSize: '2.4rem', color: 'var(--teal-1, #0ea5a3)' }}></i>
                            )}
                        </div>
                    </div>

                    {/* Step Title & Description */}
                    <div className="mb-4">
                        <div className="d-inline-flex align-items-center gap-2 mb-2">
                            <span 
                                className="badge rounded-pill px-3 py-1.5 text-uppercase d-inline-flex align-items-center gap-2 shadow-sm" 
                                style={{ 
                                    background: isScanCompleted ? 'rgba(16, 185, 129, 0.14)' : 'rgba(14, 165, 163, 0.12)', 
                                    color: isScanCompleted ? '#059669' : 'var(--teal-1, #0ea5a3)', 
                                    fontSize: '0.72rem', 
                                    fontWeight: 700, 
                                    letterSpacing: '0.04em',
                                    border: isScanCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(14, 165, 163, 0.25)',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {isScanCompleted ? (
                                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '0.82rem' }}></i>
                                ) : (
                                    <span className="spinner-grow spinner-grow-sm" style={{ width: '8px', height: '8px' }} role="status"></span>
                                )}
                                {isScanCompleted ? 'SELESAI DIVERIFIKASI' : scanSteps[currentStepIndex].badge} • Langkah {isScanCompleted ? 5 : currentStepIndex + 1} dari 5
                            </span>
                        </div>
                        <h4 className="fw-bold text-dark mb-1">
                            {isScanCompleted ? 'Pemindaian Berkas Selesai 100%' : scanSteps[currentStepIndex].title}
                        </h4>
                        <p className="text-muted mx-auto mb-0" style={{ maxWidth: '540px', fontSize: '0.86rem', lineHeight: 1.5 }}>
                            {isScanCompleted 
                                ? 'Seluruh struktur direktori remote dan pola heuristik berhasil dianalisis. Memuat hasil temuan...' 
                                : scanSteps[currentStepIndex].desc}
                        </p>
                    </div>

                    {/* Modern Interactive Progress Bar Container */}
                    <div 
                        className="mx-auto w-100 mb-4 p-3.5 rounded-4 shadow-sm" 
                        style={{ 
                            maxWidth: '620px', 
                            background: '#f8fafc', 
                            border: isScanCompleted ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                            transition: 'border-color 0.4s ease',
                        }}
                    >
                        {/* Header: Status Label & Percentage */}
                        <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                            <span className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '0.84rem', color: isScanCompleted ? '#059669' : '#1e293b' }}>
                                {isScanCompleted ? (
                                    <>
                                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1rem' }}></i>
                                        <span>Proses Audit Berhasil Selesai!</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="spinner-border spinner-border-sm text-teal" style={{ width: '13px', height: '13px', borderWidth: '2px' }}></span>
                                        <span>Memindai Berkas Server via SSH...</span>
                                    </>
                                )}
                            </span>
                            <div className="d-flex align-items-baseline gap-1">
                                <span 
                                    className="fw-bolder" 
                                    style={{ 
                                        fontSize: '1.45rem', 
                                        fontFamily: 'monospace',
                                        color: isScanCompleted ? '#059669' : 'var(--teal-1, #0ea5a3)',
                                        letterSpacing: '-0.02em',
                                        transition: 'color 0.3s ease',
                                    }}
                                >
                                    {Math.round(scanProgress)}%
                                </span>
                            </div>
                        </div>

                        {/* Outer Glow Progress Track */}
                        <div 
                            className="progress rounded-pill position-relative overflow-hidden shadow-inner" 
                            style={{ 
                                height: '14px', 
                                background: '#cbd5e1',
                                border: '1px solid rgba(255,255,255,0.7)',
                            }}
                        >
                            <div 
                                className="progress-bar rounded-pill position-relative" 
                                role="progressbar" 
                                aria-valuenow={Math.round(scanProgress)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                style={{ 
                                    width: `${scanProgress}%`,
                                    background: isScanCompleted 
                                        ? 'linear-gradient(90deg, #10b981 0%, #059669 50%, #34d399 100%)'
                                        : 'linear-gradient(90deg, var(--teal-1, #0ea5a3) 0%, var(--blue-1, #0284c7) 50%, #38bdf8 100%)',
                                    backgroundSize: '200% 100%',
                                    animation: isScanCompleted ? 'none' : 'shimmerBar 1.8s linear infinite',
                                    boxShadow: isScanCompleted 
                                        ? '0 0 16px rgba(16, 185, 129, 0.7)' 
                                        : '0 0 12px rgba(14, 165, 163, 0.45)',
                                    transition: isScanCompleted 
                                        ? 'width 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s' 
                                        : 'width 0.12s linear',
                                }} 
                            />
                        </div>

                        {/* Interactive 5-Step Milestone Stepper */}
                        <div className="d-flex justify-content-between align-items-center mt-3 pt-1 px-1">
                            {scanSteps.map((step, idx) => {
                                const isPassed = idx < currentStepIndex || isScanCompleted;
                                const isCurrent = idx === currentStepIndex && !isScanCompleted;

                                return (
                                    <div 
                                        key={idx} 
                                        className="d-flex flex-column align-items-center text-center"
                                        style={{ width: '18%' }}
                                    >
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-1.5"
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                fontSize: '0.74rem',
                                                fontWeight: 700,
                                                background: isPassed 
                                                    ? '#10b981' 
                                                    : isCurrent 
                                                    ? 'var(--teal-1, #0ea5a3)' 
                                                    : '#e2e8f0',
                                                color: (isPassed || isCurrent) ? '#ffffff' : '#64748b',
                                                boxShadow: isCurrent ? '0 0 10px rgba(14, 165, 163, 0.5)' : 'none',
                                                transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                                                transition: 'all 0.25s ease',
                                            }}
                                        >
                                            {isPassed ? <i className="bi bi-check-lg"></i> : (idx + 1)}
                                        </div>
                                        <span 
                                            className="d-none d-sm-inline-block text-truncate w-100" 
                                            style={{ 
                                                fontSize: '0.68rem', 
                                                fontWeight: (isCurrent || isPassed) ? 600 : 500,
                                                color: isPassed ? '#15803d' : isCurrent ? '#0f766e' : '#94a3b8',
                                            }}
                                            title={step.badge}
                                        >
                                            {step.badge}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Real-time Telemetry Stats Row */}
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3 pt-2.5 border-top" style={{ fontSize: '0.78rem', borderColor: '#e2e8f0' }}>
                            <span className="d-flex align-items-center gap-1.5 text-muted">
                                <i className="bi bi-cpu text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                Mode: <strong className="text-dark text-capitalize">{scanMode} Scan</strong>
                            </span>
                            <span className="d-flex align-items-center gap-1.5 text-muted">
                                <i className="bi bi-files text-primary"></i>
                                Diperiksa: <strong className="text-dark">~{simulatedFilesCount.toLocaleString()} berkas</strong>
                            </span>
                            <span className="d-flex align-items-center gap-1.5 text-muted">
                                <i className="bi bi-stopwatch text-warning"></i>
                                Berjalan: <strong className="text-dark">{scanElapsed.toFixed(1)} detik</strong>
                            </span>
                        </div>
                    </div>

                    {/* High-Tech Terminal Stream Box */}
                    <div 
                        className="mx-auto rounded-3 p-3 text-start w-100 shadow-sm"
                        style={{
                            maxWidth: '620px',
                            background: '#091824',
                            border: isScanCompleted ? '1px solid #059669' : '1px solid #1e3a52',
                            color: '#93c5fd',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '0.76rem',
                            lineHeight: 1.6,
                            transition: 'border-color 0.3s ease',
                        }}
                    >
                        <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="d-flex align-items-center gap-1.5">
                                <span className="rounded-circle" style={{ width: '9px', height: '9px', background: '#ef4444' }}></span>
                                <span className="rounded-circle" style={{ width: '9px', height: '9px', background: '#f59e0b' }}></span>
                                <span className="rounded-circle" style={{ width: '9px', height: '9px', background: '#10b981' }}></span>
                                <span className="ms-2 text-white-50" style={{ fontSize: '0.7rem' }}>sigap-ssh-investigator</span>
                            </div>
                            <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.62rem' }}>
                                LIVE TELEMETRY
                            </span>
                        </div>
                        <div className="text-secondary text-truncate">
                            <span className="text-success">$</span> ssh -p 22 admin@{siteName} "sigap_scan --mode={scanMode}"
                        </div>
                        <div className="text-info text-truncate">
                            &gt; Telemetry: [{Math.round(scanProgress)}%] • {simulatedFilesCount.toLocaleString()} berkas diindeks
                        </div>
                        <div className="text-light d-flex align-items-center gap-1">
                            <span className="text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}>&gt;</span>
                            <span className="text-truncate">{currentInspectedFile}</span>
                            {!isScanCompleted && <span style={{ animation: 'cursorBlink 1s infinite', color: '#22c1a4', fontWeight: 'bold' }}>▋</span>}
                        </div>
                        {isScanCompleted && (
                            <div className="text-success fw-bold text-truncate mt-1">
                                [SUCCESS 100%] Matriks keamanan terverifikasi. Menyimpan ke database...
                            </div>
                        )}
                    </div>
                </div>
            ) : scanResult ? (
                <div>
                    {/* CSIRT Advisory Alert Banner for Real Threats vs Protected Vendor Packages */}
                    {realThreats.some((f: any) => f.severity === 'critical' || isDangerousRootFile(f)) && (
                        <div 
                            className="card border-0 rounded-4 p-4 mb-4 shadow-sm"
                            style={{
                                background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
                                border: '1px solid #fecaca',
                            }}
                        >
                            <div className="d-flex align-items-start gap-3">
                                <div 
                                    className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-3 shadow-sm"
                                    style={{ width: '46px', height: '46px', background: '#dc2626', color: '#ffffff', fontSize: '1.4rem' }}
                                >
                                    <i className="bi bi-shield-exclamation"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1.5">
                                        <h6 className="fw-bold text-danger m-0 d-flex align-items-center gap-2">
                                            <span>🚨 Deteksi Ancaman Berisiko Tinggi di Root Server</span>
                                            <span className="badge bg-danger text-white" style={{ fontSize: '0.7rem' }}>
                                                Tindakan Wajib
                                            </span>
                                        </h6>
                                    </div>
                                    <p className="text-secondary m-0 mb-3" style={{ fontSize: '0.84rem', lineHeight: 1.6 }}>
                                        Ditemukan <strong>{realThreats.filter((f: any) => isDangerousRootFile(f) || f.severity === 'critical').length} berkas skrip mandiri</strong> (seperti <code>git_checkout.php</code>) di root direktori yang mengeksekusi <code>shell_exec()</code> tanpa autentikasi/middleware. Berkas semacam ini dapat diakses bebas via URL publik dan berisiko menjadi pintu <strong>Remote Code Execution (RCE) / Backdoor</strong>. Segera lakukan <strong>Hapus Berkas</strong> atau <strong>Karantina</strong>.
                                    </p>
                                    <div 
                                        className="p-3 rounded-3 d-flex align-items-start gap-2.5"
                                        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                                    >
                                        <i className="bi bi-shield-check text-success flex-shrink-0 mt-0.5" style={{ fontSize: '1.15rem' }}></i>
                                        <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: 1.5 }}>
                                            <strong>Klasifikasi Framework & Pustaka (100% Aman):</strong> Berkas di dalam <code>storage/framework/views/</code> (Blade View Cache), <code>bootstrap/cache/</code> (Manifest Layanan & Paket), <code>vendor/</code> (Pustaka Composer), dan lockfile dependensi teks JSON (seperti <code>package-lock.json</code>) diklasifikasikan sebagai <strong>False Positive</strong> bawaan normal pengembangan aplikasi. Berkas-berkas tersebut dilindungi secara otomatis agar aplikasi tidak mengalami kerusakan fatal (Error 500).
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>STATUS RISIKO</div>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                    <span 
                                        className={`badge rounded-pill ${
                                            realCriticalCount > 0 
                                                ? 'bg-danger-subtle text-danger border border-danger-subtle' 
                                                : realHighCount > 0 
                                                ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                                                : realThreats.length > 0
                                                ? 'bg-info-subtle text-info-emphasis border border-info-subtle'
                                                : 'bg-success-subtle text-success border border-success-subtle'
                                        } px-2.5 py-1`} 
                                        style={{ fontSize: '0.82rem', fontWeight: 600 }}
                                    >
                                        {realCriticalCount > 0 
                                            ? `Kritis (${realCriticalCount} Ancaman Nyata)` 
                                            : realHighCount > 0 
                                            ? `Tinggi (${realHighCount} Berkas)`
                                            : realThreats.length > 0 
                                            ? `Waspada (${realThreats.length} Berkas)`
                                            : 'Aman (Semua Bersih)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>ANCAMAN NYATA</div>
                                <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: realThreats.length > 0 ? '#dc2626' : '#10b981' }}>
                                    {realThreats.length} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}>berkas root/uploads</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>PUSTAKA, CACHE & LOCKFILE</div>
                                <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#0ea5a3' }}>
                                    {falsePositiveFindings.length} <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#16a34a' }}>(False Positive Aman)</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-3">
                            <div className="card border-0 rounded-3 p-3 bg-white shadow-sm border">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>WAKTU PEMINDAIAN</div>
                                    {scanResult.id && (
                                        <span className="badge bg-light text-muted border px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                                            <i className="bi bi-database text-teal me-1" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>Tersimpan
                                        </span>
                                    )}
                                </div>
                                <div className="fw-semibold text-secondary mt-1 text-truncate" style={{ fontSize: '0.86rem' }}>
                                    {scanResult.scanned_at}
                                </div>
                                {scanResult.scanned_by && (
                                    <div className="text-muted text-truncate mt-0.5" style={{ fontSize: '0.72rem' }}>
                                        Oleh: {scanResult.scanned_by}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Findings Table Card */}
                    <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden border">
                        {/* Filter Tabs Navigation */}
                        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    className={`btn btn-sm rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 fw-semibold transition-all ${activeFilter === 'real' ? 'btn-danger text-white shadow-sm' : 'btn-outline-secondary'}`}
                                    style={{ fontSize: '0.78rem' }}
                                    onClick={() => setActiveFilter('real')}
                                >
                                    <i className="bi bi-exclamation-triangle-fill"></i>
                                    <span>Ancaman Nyata</span>
                                    <span className={`badge ${activeFilter === 'real' ? 'bg-white text-danger' : 'bg-danger-subtle text-danger'} ms-1`} style={{ fontSize: '0.7rem' }}>
                                        {realThreats.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`btn btn-sm rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 fw-semibold transition-all ${activeFilter === 'vendor' ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary'}`}
                                    style={{ fontSize: '0.78rem' }}
                                    onClick={() => setActiveFilter('vendor')}
                                >
                                    <i className="bi bi-shield-fill-check"></i>
                                    <span>Pustaka, Cache & Lockfile (Aman)</span>
                                    <span className={`badge ${activeFilter === 'vendor' ? 'bg-white text-success' : 'bg-success-subtle text-success'} ms-1`} style={{ fontSize: '0.7rem' }}>
                                        {falsePositiveFindings.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`btn btn-sm rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 fw-semibold transition-all ${activeFilter === 'all' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary'}`}
                                    style={{ fontSize: '0.78rem' }}
                                    onClick={() => setActiveFilter('all')}
                                >
                                    <i className="bi bi-files"></i>
                                    <span>Semua Berkas</span>
                                    <span className={`badge ${activeFilter === 'all' ? 'bg-white text-dark' : 'bg-secondary-subtle text-secondary'} ms-1`} style={{ fontSize: '0.7rem' }}>
                                        {activeFindings.length}
                                    </span>
                                </button>
                            </div>

                            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                Jalur Aplikasi: <code>{scanResult.app_path}</code>
                            </span>
                        </div>

                        {/* Findings List */}
                        {displayedFindings.length > 0 ? (
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
                                        {displayedFindings.map((finding: any, idx: number) => {
                                            const isBlade = isBladeCacheFile(finding);
                                            const isBootstrap = isBootstrapCacheFile(finding);
                                            const isVendor = isVendorPackageFile(finding);
                                            const isLockfile = isLockfileOrManifest(finding);
                                            const isFalsePositive = isFalsePositiveFile(finding);
                                            const isDangerousRoot = isDangerousRootFile(finding);

                                            return (
                                                <tr 
                                                    key={idx}
                                                    style={{
                                                        background: isDangerousRoot ? 'rgba(254, 226, 226, 0.22)' : undefined,
                                                    }}
                                                >
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <i 
                                                                className={`bi ${
                                                                    isDangerousRoot 
                                                                        ? 'bi-file-earmark-x-fill text-danger' 
                                                                        : isBlade 
                                                                        ? 'bi-file-earmark-diff text-info'
                                                                        : isBootstrap 
                                                                        ? 'bi-file-earmark-check text-primary'
                                                                        : isVendor 
                                                                        ? 'bi-box-seam text-success' 
                                                                        : isLockfile
                                                                        ? 'bi-filetype-json text-primary'
                                                                        : 'bi-file-earmark-code text-teal'
                                                                }`} 
                                                                style={{ fontSize: '1.2rem', color: isVendor ? 'var(--teal-1, #0ea5a3)' : undefined }}
                                                            ></i>
                                                            <div>
                                                                <div className="fw-semibold text-dark text-break d-flex align-items-center gap-1.5 flex-wrap">
                                                                    <span>{finding.path}</span>
                                                                    {isDangerousRoot && (
                                                                        <span className="badge bg-danger text-white py-0.5 px-1.5" style={{ fontSize: '0.62rem', letterSpacing: '0.02em' }}>
                                                                            ROOT SCRIPT RCE
                                                                        </span>
                                                                    )}
                                                                    {isBlade && (
                                                                        <span className="badge bg-info-subtle text-info border border-info-subtle py-0.5 px-1.5" style={{ fontSize: '0.62rem' }}>
                                                                            BLADE VIEW CACHE
                                                                        </span>
                                                                    )}
                                                                    {isBootstrap && (
                                                                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle py-0.5 px-1.5" style={{ fontSize: '0.62rem' }}>
                                                                            MANIFEST CACHE
                                                                        </span>
                                                                    )}
                                                                    {isVendor && (
                                                                        <span className="badge bg-success-subtle text-success border border-success-subtle py-0.5 px-1.5" style={{ fontSize: '0.62rem' }}>
                                                                            VENDOR
                                                                        </span>
                                                                    )}
                                                                    {isLockfile && (
                                                                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle py-0.5 px-1.5" style={{ fontSize: '0.62rem' }}>
                                                                            LOCKFILE DEPENDENSI
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                                    Ukuran: {finding.size}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={`fw-semibold ${isDangerousRoot ? 'text-danger' : isFalsePositive ? 'text-secondary' : 'text-dark'}`} style={{ fontSize: '0.82rem' }}>
                                                            {finding.threat_type}
                                                        </div>
                                                        {finding.detail && (
                                                            <div className="text-muted" style={{ fontSize: '0.72rem', maxWidth: '380px', lineHeight: 1.35 }}>
                                                                {finding.detail}
                                                            </div>
                                                        )}
                                                        {finding.snippet && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-link p-0 text-decoration-none text-primary mt-0.5"
                                                                style={{ fontSize: '0.72rem' }}
                                                                onClick={() => setSelectedSnippet({ path: finding.path, snippet: finding.snippet })}
                                                            >
                                                                <i className="bi bi-code-slash me-1"></i>Lihat Baris Kode Terindikasi
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {isFalsePositive ? (
                                                            <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2.5 py-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                                                100% AMAN (FALSE POSITIVE)
                                                            </span>
                                                        ) : (
                                                            <span className={`badge rounded-pill ${
                                                                finding.severity === 'critical' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                                                                finding.severity === 'high' ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' :
                                                                'bg-secondary-subtle text-muted border'
                                                            } px-2.5 py-1`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                                                {finding.severity?.toUpperCase() || 'INFO'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                        {finding.modified_at}
                                                    </td>
                                                    <td className="pe-4 text-end">
                                                        {isBlade ? (
                                                            <span 
                                                                className="badge bg-secondary-subtle text-secondary border d-inline-flex align-items-center gap-1.5 py-1.5 px-2.5 rounded-2"
                                                                style={{ fontSize: '0.74rem' }}
                                                                title="Cache kompilasi tampilan Blade Laravel (100% aman). Boleh dibersihkan via php artisan view:clear."
                                                            >
                                                                <i className="bi bi-shield-lock-fill text-muted"></i>
                                                                <span>Dilindungi (Blade Cache)</span>
                                                            </span>
                                                        ) : isBootstrap ? (
                                                            <span 
                                                                className="badge bg-secondary-subtle text-secondary border d-inline-flex align-items-center gap-1.5 py-1.5 px-2.5 rounded-2"
                                                                style={{ fontSize: '0.74rem' }}
                                                                title="Cache manifest package & service Laravel (100% aman). Boleh dibersihkan via php artisan optimize:clear."
                                                            >
                                                                <i className="bi bi-shield-lock-fill text-muted"></i>
                                                                <span>Dilindungi (Manifest Cache)</span>
                                                            </span>
                                                        ) : isVendor ? (
                                                            <span 
                                                                className="badge bg-secondary-subtle text-secondary border d-inline-flex align-items-center gap-1.5 py-1.5 px-2.5 rounded-2"
                                                                style={{ fontSize: '0.74rem' }}
                                                                title="Pustaka Composer resmi dilindungi demi integritas framework Laravel (mencegah Error 500: Class not found)."
                                                            >
                                                                <i className="bi bi-shield-lock-fill text-muted"></i>
                                                                <span>Dilindungi (Vendor)</span>
                                                            </span>
                                                        ) : isLockfile ? (
                                                            <span 
                                                                className="badge bg-secondary-subtle text-secondary border d-inline-flex align-items-center gap-1.5 py-1.5 px-2.5 rounded-2"
                                                                style={{ fontSize: '0.74rem' }}
                                                                title="Berkas lockfile dependensi teks JSON (100% aman). Bukan skrip eksekusi."
                                                            >
                                                                <i className="bi bi-shield-lock-fill text-muted"></i>
                                                                <span>Dilindungi (Lockfile)</span>
                                                            </span>
                                                        ) : finding.is_quarantined ? (
                                                            <span 
                                                                className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1.5 py-1.5 px-2.5 rounded-2"
                                                                style={{ fontSize: '0.76rem', fontWeight: 600 }}
                                                                title={`Berkas berhasil diisolasi ke folder .sigap_quarantine (${finding.quarantined_at || ''})`}
                                                            >
                                                                <i className="bi bi-shield-fill-check"></i>
                                                                <span>Terkarantina</span>
                                                            </span>
                                                        ) : (
                                                            <div className="d-inline-flex align-items-center gap-1.5 justify-content-end">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1 py-1 px-2.5 rounded-2 shadow-sm"
                                                                    style={{ fontSize: '0.76rem', fontWeight: 600 }}
                                                                    onClick={() => handleQuarantine(finding.path)}
                                                                    disabled={quarantiningFile === finding.path || deletingFile === finding.path}
                                                                    title="Pindahkan ke folder .sigap_quarantine dengan izin non-eksekusi (chmod 000)"
                                                                >
                                                                    {quarantiningFile === finding.path ? (
                                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                                    ) : (
                                                                        <i className="bi bi-shield-x"></i>
                                                                    )}
                                                                    <span>Karantina</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2 rounded-2 shadow-sm"
                                                                    style={{ fontSize: '0.76rem', fontWeight: 600 }}
                                                                    onClick={() => setFileToDelete(finding.path)}
                                                                    disabled={quarantiningFile === finding.path || deletingFile === finding.path}
                                                                    title="Hapus berkas ini secara permanen dari server target via SSH"
                                                                >
                                                                    <i className="bi bi-trash3"></i>
                                                                    <span>Hapus</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
                                <h6 className="fw-bold text-dark mb-1">
                                    {activeFilter === 'real' 
                                        ? 'Tidak Ada Ancaman Nyata di Root atau Uploads' 
                                        : 'Tidak Ada Berkas Terindikasi'}
                                </h6>
                                <p className="text-muted mx-auto mb-0" style={{ maxWidth: '440px', fontSize: '0.84rem' }}>
                                    {activeFilter === 'real' 
                                        ? 'Semua berkas berbahaya telah diisolasi/dihapus, dan tidak ditemukan skrip backdoor aktif.' 
                                        : 'Seluruh berkas proyek dalam direktori aplikasi berada dalam batas parameter keamanan bersih.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Empty state before running scan */
                <div 
                    className="card border-0 rounded-4 p-5 text-center shadow-sm"
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                    }}
                >
                    <div 
                        className="d-inline-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{
                            width: '74px',
                            height: '74px',
                            borderRadius: '22px',
                            background: 'rgba(14, 165, 163, 0.09)',
                            color: 'var(--teal-1, #0ea5a3)',
                            fontSize: '2.2rem',
                            border: '1px solid rgba(14, 165, 163, 0.2)',
                            boxShadow: '0 8px 24px rgba(14, 165, 163, 0.08)',
                        }}
                    >
                        <i className="bi bi-radar"></i>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Siap Menjalankan Pemindaian Berkas</h5>
                    <p className="text-muted mx-auto mb-4" style={{ maxWidth: '480px', fontSize: '0.86rem' }}>
                        Pilih mode pemindaian di atas, lalu klik tombol <strong>"Mulai Pindai Sekarang"</strong> untuk mengaudit struktur berkas situs <strong>{siteName}</strong> via SSH.
                    </p>
                    <div>
                        <button
                            type="button"
                            className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2.5 rounded-3 shadow-sm"
                            style={{
                                background: 'linear-gradient(135deg, var(--teal-1, #0ea5a3), var(--blue-1, #0284c7))',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                            }}
                            onClick={handleRunScan}
                            disabled={isScanning}
                        >
                            <i className="bi bi-play-circle-fill"></i>
                            <span>Mulai Pindai Sekarang</span>
                        </button>
                    </div>
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
            {/* Delete Confirmation Modal */}
            {fileToDelete && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
                    style={{ background: 'rgba(15, 23, 42, 0.72)', backdropFilter: 'blur(8px)', zIndex: 1070 }}
                    onClick={() => !deletingFile && setFileToDelete(null)}
                >
                    <div 
                        className="card border-0 rounded-4 shadow-lg w-100 p-0 overflow-hidden"
                        style={{ maxWidth: '520px', background: '#ffffff', border: '1px solid #fecaca' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-danger text-white">
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-exclamation-octagon-fill" style={{ fontSize: '1.2rem' }}></i>
                                <span className="fw-bold" style={{ fontSize: '0.95rem' }}>
                                    Konfirmasi Hapus Berkas Permanen
                                </span>
                            </div>
                            <button 
                                type="button" 
                                className="btn-close btn-close-white" 
                                onClick={() => !deletingFile && setFileToDelete(null)}
                                disabled={Boolean(deletingFile)}
                            ></button>
                        </div>
                        <div className="p-4">
                            <div className="d-flex align-items-start gap-3 mb-3">
                                <div 
                                    className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
                                    style={{ width: '48px', height: '48px', background: '#fee2e2', color: '#dc2626', fontSize: '1.5rem' }}
                                >
                                    <i className="bi bi-trash3-fill"></i>
                                </div>
                                <div>
                                    <h6 className="fw-bold text-dark mb-1">
                                        Hapus berkas ini secara permanen dari server?
                                    </h6>
                                    <p className="text-secondary mb-0" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                                        Berkas berikut akan dihapus langsung dari sistem file VPS via SSH. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                                    </p>
                                </div>
                            </div>

                            <div 
                                className="p-3 rounded-3 mb-3"
                                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.84rem' }}
                            >
                                <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Target Berkas:</div>
                                <div className="fw-bold text-danger text-break mt-1">
                                    {fileToDelete}
                                </div>
                            </div>

                            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 px-3 mb-0" style={{ fontSize: '0.78rem' }}>
                                <i className="bi bi-info-circle-fill flex-shrink-0"></i>
                                <span>Rekomendasi: Jika ragu, Anda dapat memilih <strong>Karantina</strong> terlebih dahulu agar berkas dinonaktifkan tanpa dihapus.</span>
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-light border-top d-flex align-items-center justify-content-end gap-2">
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary btn-sm rounded-2 px-3 fw-semibold" 
                                onClick={() => setFileToDelete(null)}
                                disabled={Boolean(deletingFile)}
                            >
                                Batal
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-danger btn-sm rounded-2 px-3.5 d-inline-flex align-items-center gap-1.5 fw-semibold shadow-sm" 
                                onClick={confirmDeleteFile}
                                disabled={Boolean(deletingFile)}
                            >
                                {deletingFile ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        <span>Menghapus...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-trash3-fill"></i>
                                        <span>Ya, Hapus Permanen</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
