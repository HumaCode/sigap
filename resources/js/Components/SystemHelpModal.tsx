import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '@/Components/DynamicToast';

interface SystemHelpModalProps {
    show: boolean;
    onClose: () => void;
    appName?: string;
}

export default function SystemHelpModal({
    show,
    onClose,
    appName = 'SIGAP'
}: SystemHelpModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isRendered, setIsRendered] = useState(show);
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'guide' | 'faq' | 'about'>('guide');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
    const [currentTime, setCurrentTime] = useState<string>('');

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle smooth fade-in and fade-out transition lifecycle
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (show) {
            setIsRendered(true);
            const raf1 = requestAnimationFrame(() => {
                const raf2 = requestAnimationFrame(() => {
                    setIsVisible(true);
                });
                return () => cancelAnimationFrame(raf2);
            });
            return () => cancelAnimationFrame(raf1);
        } else {
            setIsVisible(false);
            timer = setTimeout(() => {
                setIsRendered(false);
            }, 260);
            return () => clearTimeout(timer);
        }
    }, [show]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 240);
    };

    // Update real-time server / local clock in Tab 3
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const timeString = new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Jakarta',
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(now);
            setCurrentTime(`${timeString} WIB`);
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Lock body scroll while modal is rendered
    useEffect(() => {
        if (isRendered) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isRendered]);

    // Close on Escape with smooth fade-out
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isRendered) {
                handleClose();
            }
        };

        if (isRendered) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isRendered]);

    const copyToClipboard = (text: string, label: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            toast.success('Disalin', `${label} berhasil disalin ke papan klip.`);
        }
    };

    const faqs = [
        {
            q: 'Bagaimana cara menambahkan situs baru untuk dipantau oleh SIGAP?',
            a: 'Buka menu "Data Situs Web" pada bilah navigasi kiri, kemudian klik tombol "+ Tambah Situs". Isi nama situs, URL lengkap (misalnya https://example.com), serta pilih kategori kluster layanan. Sistem akan secara otomatis memulai siklus monitoring uptime dan sertifikat SSL.'
        },
        {
            q: 'Apa yang harus dilakukan jika sertifikat SSL terdeteksi kadaluwarsa / invalid?',
            a: 'Sistem akan segera menaikkan status situs ke "Waspada" atau "Kritis". Lakukan pembaruan (renew) sertifikat SSL/TLS di web server atau panel hosting Anda (misalnya melalui Certbot atau Let\'s Encrypt). Sistem SIGAP akan otomatis mendeteksi sertifikat baru pada pemeriksaan berkala berikutnya.'
        },
        {
            q: 'Bagaimana cara mengaktifkan notifikasi insiden via bot Telegram?',
            a: 'Buka menu "Pengaturan" lalu pilih tab "Preferensi Umum". Masukkan Token Bot Telegram dan ID Chat tujuan (dapat berupa grup atau channel). Klik tombol "Uji Bot" untuk memastikan pesan terkirim dengan baik sebelum menyimpan pengaturan.'
        },
        {
            q: 'Bagaimana cara membersihkan cache sistem setelah konfigurasi diperbarui?',
            a: 'Anda tidak perlu membuka terminal! Setiap kali tombol "Simpan" ditekan pada tab mana saja di menu Pengaturan, cache sistem (config, route, views, aplikasi) otomatis dibersihkan. Anda juga dapat menggunakan tombol cepat "Bersihkan Cache Sistem" di bagian kanan atas halaman Pengaturan.'
        },
        {
            q: 'Bagaimana alur kerja fitur AI Remediasi 9Router pada insiden?',
            a: 'Saat insiden terjadi, asisten AI 9Router akan menganalisis riwayat galat (error log), mengidentifikasi baris kode rentan, dan merekomendasikan skrip perbaikan (patching) otomatis untuk mengembalikan keandalan dan keamanan sistem Anda.'
        }
    ];

    if (!isRendered || !mounted || typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: isVisible ? 'rgba(15, 23, 42, 0.68)' : 'rgba(15, 23, 42, 0)',
                backdropFilter: isVisible ? 'blur(10px)' : 'blur(0px)',
                WebkitBackdropFilter: isVisible ? 'blur(10px)' : 'blur(0px)',
                zIndex: 99999,
                overflowY: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, backdrop-filter 0.25s ease',
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                className="modal-dialog modal-dialog-centered w-100 my-auto"
                style={{
                    maxWidth: '1160px',
                    width: '95%',
                    margin: 'auto',
                    transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-14px)',
                    opacity: isVisible ? 1 : 0,
                    transition: 'transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                <div
                    className="modal-content shadow-2xl border-0 overflow-hidden"
                    style={{
                        borderRadius: '26px',
                        background: '#ffffff',
                        border: '1.5px solid rgba(15, 42, 63, 0.08)',
                        boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.4)'
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-4 py-3.5 px-md-5 py-md-4 d-flex align-items-center justify-content-between position-relative"
                        style={{
                            background: 'linear-gradient(135deg, rgba(14, 165, 163, 0.08) 0%, rgba(2, 132, 199, 0.05) 100%)',
                            borderBottom: '1.5px solid rgba(15, 42, 63, 0.08)'
                        }}
                    >
                        <div className="d-flex align-items-center gap-3">
                            <div
                                style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #0ea5a3 0%, #0284c7 100%)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    boxShadow: '0 8px 24px rgba(14, 165, 163, 0.32)'
                                }}
                            >
                                <i className="bi bi-question-diamond-fill"></i>
                            </div>
                            <div>
                                <h5 className="mb-0" style={{ fontWeight: 800, color: '#0f2a3f', fontSize: '1.35rem' }}>
                                    Pusat Bantuan & Panduan Sistem
                                </h5>
                                <p className="mb-0 text-muted" style={{ fontSize: '0.86rem' }}>
                                    Panduan fitur operasional, indikator mutu, FAQ teknis, dan informasi platform {appName}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn p-0 d-flex align-items-center justify-content-center"
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(15, 42, 63, 0.06)',
                                color: 'var(--ink-soft)',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                                e.currentTarget.style.color = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(15, 42, 63, 0.06)';
                                e.currentTarget.style.color = 'var(--ink-soft)';
                            }}
                            title="Tutup panduan (ESC)"
                        >
                            <i className="bi bi-x-lg" style={{ fontSize: '1.05rem' }}></i>
                        </button>
                    </div>

                    {/* Nav Pills Switcher */}
                    <div className="px-4 py-2.5 px-md-5" style={{ background: '#f8fafc', borderBottom: '1px solid rgba(15, 42, 63, 0.06)' }}>
                        <div className="d-flex align-items-center gap-2 p-1.5 rounded-3" style={{ background: 'rgba(15, 42, 63, 0.05)', width: 'fit-content' }}>
                            <button
                                type="button"
                                onClick={() => setActiveTab('guide')}
                                className="btn btn-sm d-flex align-items-center gap-2 px-3.5 py-2"
                                style={{
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '0.88rem',
                                    border: 'none',
                                    background: activeTab === 'guide' ? '#ffffff' : 'transparent',
                                    color: activeTab === 'guide' ? 'var(--teal-1, #0ea5a3)' : 'var(--ink-soft)',
                                    boxShadow: activeTab === 'guide' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <i className="bi bi-compass-fill"></i>
                                <span>Panduan Cepat & Status</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('faq')}
                                className="btn btn-sm d-flex align-items-center gap-2 px-3.5 py-2"
                                style={{
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '0.88rem',
                                    border: 'none',
                                    background: activeTab === 'faq' ? '#ffffff' : 'transparent',
                                    color: activeTab === 'faq' ? 'var(--teal-1, #0ea5a3)' : 'var(--ink-soft)',
                                    boxShadow: activeTab === 'faq' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <i className="bi bi-patch-question-fill"></i>
                                <span>FAQ & Bantuan Darurat</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('about')}
                                className="btn btn-sm d-flex align-items-center gap-2 px-3.5 py-2"
                                style={{
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '0.88rem',
                                    border: 'none',
                                    background: activeTab === 'about' ? '#ffffff' : 'transparent',
                                    color: activeTab === 'about' ? 'var(--teal-1, #0ea5a3)' : 'var(--ink-soft)',
                                    boxShadow: activeTab === 'about' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <i className="bi bi-cpu-fill"></i>
                                <span>Tentang Platform & Telemetri</span>
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div
                        className="modal-body p-4 p-md-5 scroll-slim"
                        style={{
                            maxHeight: '74vh',
                            overflowY: 'auto'
                        }}
                    >
                        {/* TAB 1: PANDUAN CEPAT & INDIKATOR */}
                        {activeTab === 'guide' && (
                            <div className="d-flex flex-column gap-4 animate__animated animate__fadeIn">
                                {/* 4 Pillars Grid */}
                                <div>
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0f2a3f', fontSize: '0.92rem' }}>
                                        <i className="bi bi-shield-check text-teal" style={{ color: 'var(--teal-1)' }}></i>
                                        4 Pilar Utama Pemantauan {appName}
                                    </h6>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <div className="p-3 rounded-4 h-100" style={{ background: '#f8fafc', border: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
                                                <div className="d-flex align-items-center gap-2.5 mb-2">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(14, 165, 163, 0.12)', color: 'var(--teal-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="bi bi-activity"></i>
                                                    </div>
                                                    <strong style={{ fontSize: '0.88rem', color: '#0f2a3f' }}>1. Pemantauan Uptime 24/7</strong>
                                                </div>
                                                <p className="text-muted mb-0" style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                                                    Pengecekan HTTP/HTTPS berkala setiap menit untuk mengukur latensi milidetik, mendeteksi downtime, dan menghitung persentase ketersediaan SLA 30 hari.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <div className="p-3 rounded-4 h-100" style={{ background: '#f8fafc', border: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
                                                <div className="d-flex align-items-center gap-2.5 mb-2">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="bi bi-shield-lock-fill"></i>
                                                    </div>
                                                    <strong style={{ fontSize: '0.88rem', color: '#0f2a3f' }}>2. Inspeksi SSL & Postur Port</strong>
                                                </div>
                                                <p className="text-muted mb-0" style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                                                    Audit kriptografi sertifikat SSL/TLS, verifikasi sisa masa aktif, serta pemindaian port terbuka berisiko tinggi (SSH, FTP, Database) dan berkas sensitif (.env/git).
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <div className="p-3 rounded-4 h-100" style={{ background: '#f8fafc', border: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
                                                <div className="d-flex align-items-center gap-2.5 mb-2">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="bi bi-eye-fill"></i>
                                                    </div>
                                                    <strong style={{ fontSize: '0.88rem', color: '#0f2a3f' }}>3. Deteksi Defacement Visual</strong>
                                                </div>
                                                <p className="text-muted mb-0" style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                                                    Analisis perbandingan struktur DOM dan visual layout secara otomatis untuk mendeteksi peretasan halaman muka (website defacement) secara cepat.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <div className="p-3 rounded-4 h-100" style={{ background: '#f8fafc', border: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
                                                <div className="d-flex align-items-center gap-2.5 mb-2">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="bi bi-robot"></i>
                                                    </div>
                                                    <strong style={{ fontSize: '0.88rem', color: '#0f2a3f' }}>4. AI Remediasi 9Router</strong>
                                                </div>
                                                <p className="text-muted mb-0" style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                                                    Asisten keamanan cerdas bertenaga LLM untuk menelaah log insiden, memberikan rekomendasi perbaikan kode, dan panduan mitigasi kerentanan web.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Indicators & Scorecard Legend */}
                                <div>
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0f2a3f', fontSize: '0.92rem' }}>
                                        <i className="bi bi-palette-fill text-primary"></i>
                                        Arti Indikator Status & Standar Mutu
                                    </h6>
                                    <div className="p-3.5 rounded-4" style={{ background: '#f8fafc', border: '1.5px solid rgba(15, 42, 63, 0.08)' }}>
                                        <div className="row g-3 align-items-center mb-3">
                                            <div className="col-12 col-md-4">
                                                <div className="d-flex align-items-center gap-2.5">
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 rounded-3 fw-bold">
                                                        <i className="bi bi-check-circle-fill me-1"></i> NORMAL (UP)
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', color: '#475569' }}>Layanan aktif & responsif</span>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-4">
                                                <div className="d-flex align-items-center gap-2.5">
                                                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1.5 rounded-3 fw-bold">
                                                        <i className="bi bi-exclamation-triangle-fill me-1"></i> WASPADA
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', color: '#475569' }}>Respon lambat / SSL &lt;14 hari</span>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-4">
                                                <div className="d-flex align-items-center gap-2.5">
                                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1.5 rounded-3 fw-bold">
                                                        <i className="bi bi-x-circle-fill me-1"></i> KRITIS (DOWN)
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', color: '#475569' }}>Situs tidak dapat dijangkau</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-top" style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                                            <strong>Formula Rapor Mutu (Scorecard):</strong> Skor total 0-100 poin dihitung dari bobot <strong>40% Ketersediaan Uptime 30 Hari</strong> + <strong>30% Kepatuhan Kriptografi SSL & Port</strong> + <strong>30% Riwayat Bebas Insiden Siber</strong>.
                                        </div>
                                    </div>
                                </div>

                                {/* Keyboard Shortcuts */}
                                <div>
                                    <h6 className="fw-bold mb-2.5 d-flex align-items-center gap-2" style={{ color: '#0f2a3f', fontSize: '0.92rem' }}>
                                        <i className="bi bi-keyboard-fill text-muted"></i>
                                        Pintasan Keyboard Cepat (Keyboard Shortcuts)
                                    </h6>
                                    <div className="d-flex flex-wrap gap-2.5">
                                        <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 bg-white border shadow-xs" style={{ fontSize: '0.8rem' }}>
                                            <kbd className="px-1.5 py-0.5 rounded bg-dark text-white border-0" style={{ fontSize: '0.75rem' }}>Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-dark text-white border-0" style={{ fontSize: '0.75rem' }}>K</kbd>
                                            <span className="text-muted">Pencarian Topbar</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 bg-white border shadow-xs" style={{ fontSize: '0.8rem' }}>
                                            <kbd className="px-1.5 py-0.5 rounded bg-dark text-white border-0" style={{ fontSize: '0.75rem' }}>Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-dark text-white border-0" style={{ fontSize: '0.75rem' }}>?</kbd>
                                            <span className="text-muted">Buka Pusat Bantuan</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 bg-white border shadow-xs" style={{ fontSize: '0.8rem' }}>
                                            <kbd className="px-1.5 py-0.5 rounded bg-dark text-white border-0" style={{ fontSize: '0.75rem' }}>ESC</kbd>
                                            <span className="text-muted">Tutup Modal / Dialog</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: FAQ & BANTUAN DARURAT */}
                        {activeTab === 'faq' && (
                            <div className="d-flex flex-column gap-4 animate__animated animate__fadeIn">
                                {/* FAQ Accordion */}
                                <div>
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0f2a3f', fontSize: '0.92rem' }}>
                                        <i className="bi bi-question-circle-fill text-teal" style={{ color: 'var(--teal-1)' }}></i>
                                        Tanya Jawab Kendala Umum (FAQ)
                                    </h6>
                                    <div className="d-flex flex-column gap-2.5">
                                        {faqs.map((faq, idx) => {
                                            const isOpen = openFaqIndex === idx;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="rounded-4 overflow-hidden transition-all"
                                                    style={{
                                                        background: isOpen ? '#ffffff' : '#f8fafc',
                                                        border: isOpen ? '1.5px solid var(--teal-1, #0ea5a3)' : '1px solid rgba(15, 42, 63, 0.08)',
                                                        boxShadow: isOpen ? '0 4px 16px rgba(14, 165, 163, 0.08)' : 'none'
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                                        className="w-100 p-3 text-start d-flex align-items-center justify-content-between border-0 bg-transparent"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isOpen ? 'var(--teal-1, #0ea5a3)' : '#0f2a3f' }}>
                                                            {faq.q}
                                                        </span>
                                                        <i
                                                            className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-muted ms-2`}
                                                            style={{ fontSize: '0.85rem' }}
                                                        ></i>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="px-3 pb-3 pt-1" style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
                                                            {faq.a}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Emergency Contact Box */}
                                <div
                                    className="p-3.5 rounded-4 position-relative overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)',
                                        border: '1.5px solid rgba(245, 158, 11, 0.3)'
                                    }}
                                >
                                    <div className="d-flex align-items-start gap-3">
                                        <div
                                            style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '12px',
                                                background: 'rgba(245, 158, 11, 0.15)',
                                                color: '#b45309',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.25rem',
                                                flexShrink: 0
                                            }}
                                        >
                                            <i className="bi bi-headset"></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <strong style={{ fontSize: '0.92rem', color: '#78350f', display: 'block' }}>
                                                Eskalasi Darurat & Kontak Narahubung Teknis
                                            </strong>
                                            <p className="mb-2.5 text-muted" style={{ fontSize: '0.78rem' }}>
                                                Jika terjadi insiden keamanan siber kritis atau kegagalan sistem pemantauan yang membutuhkan penanganan segera:
                                            </p>
                                            <div className="d-flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard('admin@sigap.id', 'Email Narahubung')}
                                                    className="btn btn-sm btn-white border d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-xs"
                                                    style={{ borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, color: '#0f2a3f' }}
                                                >
                                                    <i className="bi bi-envelope-fill text-primary"></i>
                                                    <span>admin@sigap.id</span>
                                                    <i className="bi bi-clipboard text-muted ms-1" style={{ fontSize: '0.7rem' }}></i>
                                                </button>

                                                <a
                                                    href="https://wa.me/6281234567890"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn btn-sm btn-success d-inline-flex align-items-center gap-1.5 px-3 py-1.5 shadow-xs"
                                                    style={{ borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600 }}
                                                >
                                                    <i className="bi bi-whatsapp"></i>
                                                    <span>Siaga WhatsApp IT</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: TENTANG PLATFORM & TELEMETRI */}
                        {activeTab === 'about' && (
                            <div className="d-flex flex-column gap-4 animate__animated animate__fadeIn">
                                {/* Platform Brand Hero */}
                                <div
                                    className="p-4 rounded-4 text-center position-relative overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(14, 165, 163, 0.1) 0%, rgba(59, 130, 246, 0.08) 100%)',
                                        border: '1.5px solid rgba(14, 165, 163, 0.2)'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '20px',
                                            background: 'linear-gradient(135deg, #0ea5a3 0%, #22c1a4 100%)',
                                            color: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '2rem',
                                            margin: '0 auto 1rem auto',
                                            boxShadow: '0 10px 25px rgba(14, 165, 163, 0.35)'
                                        }}
                                    >
                                        <i className="bi bi-shield-shaded"></i>
                                    </div>
                                    <h5 className="fw-bold mb-1" style={{ color: '#0f2a3f', fontSize: '1.3rem' }}>
                                        {appName} Web Guardian Platform
                                    </h5>
                                    <div className="badge bg-dark px-3 py-1 rounded-pill mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                                        VERSION 2.4.0 &bull; ENTERPRISE RESILIENCE EDITION
                                    </div>
                                    <p className="text-muted mx-auto mb-0" style={{ maxWidth: '560px', fontSize: '0.82rem', lineHeight: 1.5 }}>
                                        Sistem terpadu pemantauan kesehatan website, uptime ketersediaan 24/7, audit kriptografi SSL, dan manajemen mitigasi insiden siber.
                                    </p>
                                </div>

                                {/* System Telemetry Stats */}
                                <div>
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0f2a3f', fontSize: '0.92rem' }}>
                                        <i className="bi bi-cpu-fill text-teal" style={{ color: 'var(--teal-1)' }}></i>
                                        Status Telemetri & Mesin Backend
                                    </h6>
                                    <div className="row g-3">
                                        <div className="col-12 col-sm-6">
                                            <div className="p-3 rounded-4 bg-light border h-100">
                                                <div className="text-muted mb-1" style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                                    AI Gateway Engine
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="live-dot" style={{ width: '8px', height: '8px', background: '#10b981' }}></span>
                                                    <strong style={{ fontSize: '0.9rem', color: '#0f2a3f' }}>9Router Neural Gateway</strong>
                                                </div>
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Terhubung & Siap Remediasi</span>
                                            </div>
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <div className="p-3 rounded-4 bg-light border h-100">
                                                <div className="text-muted mb-1" style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                                    Background Scheduler
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="live-dot" style={{ width: '8px', height: '8px', background: '#10b981' }}></span>
                                                    <strong style={{ fontSize: '0.9rem', color: '#0f2a3f' }}>Laravel Uptime Worker</strong>
                                                </div>
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Interval Siklus Pemeriksaan 1 Menit</span>
                                            </div>
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <div className="p-3 rounded-4 bg-light border h-100">
                                                <div className="text-muted mb-1" style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                                    Waktu Server Aktif
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-clock-history text-primary"></i>
                                                    <strong style={{ fontSize: '0.86rem', color: '#0f2a3f' }}>{currentTime || 'Memuat...'}</strong>
                                                </div>
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Zona Waktu Asia/Jakarta (WIB)</span>
                                            </div>
                                        </div>

                                        <div className="col-12 col-sm-6">
                                            <div className="p-3 rounded-4 bg-light border h-100">
                                                <div className="text-muted mb-1" style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                                    Teknologi Stack
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-stack text-teal" style={{ color: 'var(--teal-1)' }}></i>
                                                    <strong style={{ fontSize: '0.86rem', color: '#0f2a3f' }}>Laravel 11 &bull; Inertia &bull; React</strong>
                                                </div>
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>TypeScript & Bootstrap UI</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className="px-4 py-3.5 px-md-5 py-md-3.5 bg-light d-flex align-items-center justify-content-between"
                        style={{ borderTop: '1px solid rgba(15, 42, 63, 0.08)' }}
                    >
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            {appName} Platform &bull; Dokumentasi & Panduan Operasional
                        </span>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-dark px-4 py-2 rounded-pill fw-semibold shadow-xs"
                            style={{ fontSize: '0.86rem' }}
                        >
                            Tutup Panduan
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
