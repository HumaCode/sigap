import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';
import SearchableSelect from '@/Components/SearchableSelect';

interface CreateBackupModalProps {
    show: boolean;
    onClose: () => void;
    sshSites: Array<{ id: string; name: string; url: string; ssh_app_path?: string; ssh_host?: string }>;
}

export default function CreateBackupModal({ show, onClose, sshSites }: CreateBackupModalProps) {
    const [selectedSiteId, setSelectedSiteId] = useState(sshSites[0]?.id || '');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [progressStage, setProgressStage] = useState('Inisialisasi...');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [processedSize, setProcessedSize] = useState('0 MB');

    const selectedSite = sshSites.find(s => s.id === selectedSiteId) || sshSites[0];

    const siteOptions = sshSites.map((s) => ({
        value: s.id,
        label: s.name,
        subLabel: s.url,
        badge: s.ssh_host || 'SSH',
        icon: 'bi bi-globe2',
    }));

    // Realistic progressive timer while archiving on server
    React.useEffect(() => {
        let timer: any;
        if (show && isSubmitting) {
            setProgressPercent(10);
            setProgressStage('1/4: Menghubungkan ke SSH Server...');
            setProcessedSize('0 MB');
            setElapsedSeconds(0);

            timer = setInterval(() => {
                setElapsedSeconds((sec) => {
                    const nextSec = sec + 1;
                    
                    // Simulate progress and phase updates based on elapsed time
                    if (nextSec < 3) {
                        setProgressPercent(20 + nextSec * 5);
                        setProgressStage('2/4: Membaca direktori & daftar berkas...');
                        setProcessedSize('0.5 MB');
                    } else if (nextSec < 8) {
                        const pct = Math.min(65, 35 + (nextSec - 2) * 5);
                        setProgressPercent(pct);
                        setProgressStage('3/4: Mengompresi berkas web (.tar.gz)...');
                        setProcessedSize(((nextSec - 2) * 1.4).toFixed(1) + ' MB');
                    } else if (nextSec < 20) {
                        const pct = Math.min(88, 65 + (nextSec - 7) * 2);
                        setProgressPercent(pct);
                        setProgressStage('3/4: Mengompresi berkas web (.tar.gz)...');
                        setProcessedSize(((nextSec - 2) * 1.6).toFixed(1) + ' MB');
                    } else {
                        const pct = Math.min(96, 88 + (nextSec - 19) * 0.5);
                        setProgressPercent(pct);
                        setProgressStage('4/4: Menyelesaikan penulisan arsip...');
                        setProcessedSize(((nextSec - 2) * 1.7).toFixed(1) + ' MB');
                    }
                    return nextSec;
                });
            }, 1000);
        } else {
            setProgressPercent(0);
            setElapsedSeconds(0);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [show, isSubmitting]);

    const formatTimer = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSiteId) {
            toast.error('Pilih Situs', 'Silakan pilih situs yang ingin dicadangkan.');
            return;
        }

        setIsSubmitting(true);
        router.post(route('backups.store'), {
            site_id: selectedSiteId,
            notes: notes,
        }, {
            onSuccess: () => {
                setProgressPercent(100);
                setProgressStage('Selesai! Arsip tersimpan di server.');
                setTimeout(() => {
                    toast.success('Cadangan Berhasil', 'Arsip backup situs berhasil dibuat via SSH.');
                    setIsSubmitting(false);
                    setNotes('');
                    onClose();
                }, 1000);
            },
            onError: (errors) => {
                const msg = Object.values(errors)[0] as string || 'Gagal membuat cadangan.';
                toast.error('Gagal Membuat Cadangan', msg);
                setIsSubmitting(false);
            },
            onFinish: () => {
                // Keep submitting state until timeout callback clears it
            }
        });
    };

    if (!show) return null;

    return (
        <div 
            className="modal fade show d-block" 
            tabIndex={-1} 
            style={{ backgroundColor: 'rgba(15,42,63,0.6)', backdropFilter: 'blur(5px)', zIndex: 1060 }}
        >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
                <div 
                    className="modal-content border-0 shadow-lg"
                    style={{ borderRadius: '20px', overflow: 'hidden' }}
                >
                    {/* Header */}
                    <div 
                        className="modal-header text-white border-0 p-4"
                        style={{ background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)' }}
                    >
                        <div className="d-flex align-items-center gap-2.5">
                            <div 
                                className="rounded-3 d-flex align-items-center justify-content-center text-white"
                                style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.15)', fontSize: '1.25rem' }}
                            >
                                <i className="bi bi-archive-fill"></i>
                            </div>
                            <div>
                                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.15rem' }}>Buat Cadangan Baru</h5>
                                <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>Snapshot file proyek via SSH</span>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                        ></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            {/* Explanatory Info Card */}
                            <div 
                                className="p-3 rounded-3 mb-3.5 d-flex gap-2.5"
                                style={{ background: 'rgba(14,165,163,0.08)', border: '1px solid rgba(14,165,163,0.2)', color: '#0f766e', fontSize: '0.82rem', lineHeight: 1.5 }}
                            >
                                <i className="bi bi-info-circle-fill fs-5 flex-shrink-0" style={{ color: '#0ea5a3' }}></i>
                                <div>
                                    SIGAP akan terhubung via SSH ke server hosting target, mengompresi seluruh file kode web menjadi arsip <code>.tar.gz</code> (tanpa cache/node_modules), dan mencatatnya ke sistem.
                                </div>
                            </div>

                            {/* Select Site (Select2 / SearchableSelect) */}
                            <div className="mb-3.5">
                                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                                    Pilih Situs Target <span className="text-danger">*</span>
                                </label>
                                {sshSites.length > 0 ? (
                                    <SearchableSelect
                                        options={siteOptions}
                                        value={selectedSiteId}
                                        onChange={(val) => setSelectedSiteId(val)}
                                        placeholder="Pilih atau cari situs target..."
                                        searchPlaceholder="Ketik nama situs, domain, atau IP server..."
                                        disabled={isSubmitting}
                                    />
                                ) : (
                                    <div className="alert alert-warning border-0 p-3" style={{ borderRadius: '12px', fontSize: '0.82rem' }}>
                                        <i className="bi bi-exclamation-triangle me-1.5"></i>
                                        Belum ada situs yang terhubung SSH. Silakan lengkapi tab <strong>Koneksi SSH</strong> pada menu <em>Daftar Situs</em> terlebih dahulu.
                                    </div>
                                )}
                            </div>

                            {/* Target Remote Path Preview */}
                            {selectedSite && selectedSite.ssh_app_path && (
                                <div 
                                    className="p-3 rounded-3 mb-3.5"
                                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                                >
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">Host Server:</span>
                                        <span className="fw-semibold text-dark">{selectedSite.ssh_host}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Folder Aplikasi:</span>
                                        <code className="text-dark fw-bold" style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                                            {selectedSite.ssh_app_path}
                                        </code>
                                    </div>
                                </div>
                            )}

                            {/* Notes / Description */}
                            <div className="mb-0">
                                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                                    Catatan Cadangan <span className="text-muted fw-normal">(Opsional)</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={2}
                                    style={{ borderRadius: '12px', padding: '0.65rem 1rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                    placeholder="Contoh: Backup sebelum update versi aplikasi / sebelum perbaikan"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={isSubmitting}
                                ></textarea>
                            </div>

                            {/* Realtime Compression Progress Card */}
                            {isSubmitting && (
                                <div 
                                    className="p-3.5 rounded-3 mt-3.5"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(14,165,163,0.06), rgba(15,42,63,0.08))',
                                        border: '1px solid rgba(14,165,163,0.25)',
                                        boxShadow: '0 4px 16px rgba(14,165,163,0.08)',
                                    }}
                                >
                                    {/* Header & Percentage */}
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <span 
                                                className="spinner-grow spinner-grow-sm" 
                                                role="status"
                                                style={{ color: '#0ea5a3', width: '0.85rem', height: '0.85rem' }}
                                            ></span>
                                            <span className="fw-bold" style={{ fontSize: '0.83rem', color: '#0f2a3f' }}>
                                                {progressStage}
                                            </span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge" style={{ background: progressPercent >= 100 ? '#10b981' : '#0ea5a3', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700 }}>
                                                {progressPercent}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar with animated gradient */}
                                    <div className="mb-2">
                                        <div 
                                            className="progress" 
                                            style={{ height: '10px', borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden' }}
                                        >
                                            <div 
                                                className="progress-bar progress-bar-striped progress-bar-animated"
                                                role="progressbar"
                                                style={{
                                                    width: `${progressPercent}%`,
                                                    background: progressPercent >= 100 
                                                        ? 'linear-gradient(90deg, #10b981, #059669)'
                                                        : 'linear-gradient(90deg, #0ea5a3, #2563eb)',
                                                    transition: 'width 0.4s ease',
                                                }}
                                                aria-valuenow={progressPercent}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Sub-info: Processed Size & Timer */}
                                    <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        <span>
                                            <i className="bi bi-file-earmark-zip me-1" style={{ color: '#0ea5a3' }}></i>
                                            Estimasi arsip: <strong className="text-dark">{processedSize}</strong>
                                        </span>
                                        <span>
                                            <i className="bi bi-stopwatch me-1"></i>
                                            Waktu: <strong className="text-dark">{formatTimer(elapsedSeconds)}</strong>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="modal-footer border-0 p-3.5 bg-light d-flex justify-content-between">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 1.25rem' }}
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="btn text-white d-inline-flex align-items-center gap-2"
                                style={{
                                    background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    padding: '0.5rem 1.5rem',
                                    border: 'none',
                                }}
                                disabled={isSubmitting || sshSites.length === 0}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        Mengompresi & Menyimpan via SSH...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-cloud-arrow-up-fill"></i> Mulai Proses Cadangkan
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
