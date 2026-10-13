import React, { useState } from 'react';
import axios from 'axios';
import { toast } from '@/Components/DynamicToast';

interface GeneralTabProps {
    data: {
        app_name: string;
        pic_contact_email: string;
        pic_contact_wa: string;
        telegram_bot_token: string;
        telegram_chat_id: string;
        has_telegram_token?: boolean;
    };
    onSave: (settings: Record<string, any>) => void;
    isSaving: boolean;
}

export default function GeneralTab({ data, onSave, isSaving }: GeneralTabProps) {
    const [appName, setAppName] = useState(data.app_name || 'SIGAP Web');
    const [picEmail, setPicEmail] = useState(data.pic_contact_email || '');
    const [picWa, setPicWa] = useState(data.pic_contact_wa || '');
    const [telegramToken, setTelegramToken] = useState(data.telegram_bot_token || '');
    const [telegramChatId, setTelegramChatId] = useState(data.telegram_chat_id || '');
    const [showToken, setShowToken] = useState(false);

    // Telegram connection test state
    const [isTestingTelegram, setIsTestingTelegram] = useState(false);
    const [telegramTestResult, setTelegramTestResult] = useState<{
        success: boolean;
        message: string;
        bot?: { username: string; name: string };
    } | null>(null);

    const handleTestTelegram = async () => {
        if (!telegramChatId.trim()) {
            toast.error('Perhatian', 'Telegram Chat ID / Group ID wajib diisi sebelum melakukan pengujian.');
            return;
        }

        if (!telegramToken.trim() && !data.has_telegram_token) {
            toast.error('Perhatian', 'Telegram Bot Token wajib diisi sebelum melakukan pengujian.');
            return;
        }

        setIsTestingTelegram(true);
        setTelegramTestResult(null);

        try {
            const res = await axios.post(route('settings.telegram.test'), {
                telegram_bot_token: telegramToken.trim(),
                telegram_chat_id: telegramChatId.trim(),
            });

            if (res.data.success) {
                setTelegramTestResult({
                    success: true,
                    message: res.data.message || 'Koneksi ke bot Telegram berhasil!',
                    bot: res.data.bot,
                });
                toast.success('Koneksi Telegram Berhasil', res.data.message || 'Pesan uji berhasil terkirim ke Telegram.');
            } else {
                setTelegramTestResult({
                    success: false,
                    message: res.data.message || 'Gagal terhubung ke Telegram.',
                    bot: res.data.bot,
                });
                toast.error('Koneksi Telegram Gagal', res.data.message || 'Periksa kembali token atau chat ID Telegram.');
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat menguji bot Telegram.';
            setTelegramTestResult({
                success: false,
                message: errMsg,
            });
            toast.error('Gagal Menguji Telegram', errMsg);
        } finally {
            setIsTestingTelegram(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            app_name: appName,
            pic_contact_email: picEmail,
            pic_contact_wa: picWa,
            telegram_bot_token: telegramToken,
            telegram_chat_id: telegramChatId,
        });
    };

    const isTelegramConfigured = Boolean((telegramToken || data.has_telegram_token) && telegramChatId);

    return (
        <form onSubmit={handleSubmit}>
            <div className="settings-card">
                <div className="settings-card-header">
                    <div>
                        <h4 className="settings-card-title">
                            <i className="bi bi-sliders text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                            Preferensi Umum & Notifikasi
                        </h4>
                        <p className="settings-card-subtitle">
                            Informasi identitas platform, saluran darurat, dan integrasi bot notifikasi Telegram
                        </p>
                    </div>
                    <div>
                        <span className="badge rounded-pill" style={{
                            background: isTelegramConfigured ? '#ecfdf5' : '#f8fafc',
                            color: isTelegramConfigured ? '#059669' : '#64748b',
                            border: `1px solid ${isTelegramConfigured ? '#a7f3d0' : '#e2e8f0'}`,
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                        }}>
                            <i className={`bi ${isTelegramConfigured ? 'bi-telegram' : 'bi-exclamation-circle'} me-1`}></i>
                            {isTelegramConfigured ? 'Bot Siaga Terkonfigurasi' : 'Kredensial Belum Lengkap'}
                        </span>
                    </div>
                </div>

                {/* Test Result Banner */}
                {telegramTestResult && (
                    <div className={`connection-banner ${telegramTestResult.success ? 'success' : 'error'} mb-4`}>
                        <i className={`bi ${telegramTestResult.success ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`} style={{ fontSize: '1.25rem' }}></i>
                        <div className="flex-grow-1">
                            <strong>{telegramTestResult.success ? 'Koneksi Telegram Berhasil!' : 'Koneksi Telegram Gagal!'}</strong>
                            <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>{telegramTestResult.message}</div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-muted ms-2"
                            onClick={() => setTelegramTestResult(null)}
                            title="Tutup pemberitahuan"
                            style={{ textDecoration: 'none' }}
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                )}

                <div className="row g-4 mb-4">
                    {/* App Name */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">Nama Aplikasi / Platform</label>
                        <input
                            type="text"
                            className="settings-input"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            required
                        />
                        <div className="settings-hint">Nama sistem yang ditampilkan pada header dan email</div>
                    </div>

                    {/* PIC Email */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">Email Penanggung Jawab</label>
                        <input
                            type="email"
                            className="settings-input"
                            value={picEmail}
                            onChange={(e) => setPicEmail(e.target.value)}
                            placeholder="admin@domain.id"
                        />
                        <div className="settings-hint">Email penerima laporan insiden kritis dan rekap ketersediaan</div>
                    </div>

                    {/* PIC WhatsApp */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">Nomor WhatsApp Siaga (Hotline)</label>
                        <input
                            type="text"
                            className="settings-input"
                            value={picWa}
                            onChange={(e) => setPicWa(e.target.value)}
                            placeholder="Contoh: 081234567890"
                        />
                        <div className="settings-hint">Nomor kontak darurat teknis tim penanganan insiden</div>
                    </div>

                    {/* Telegram Chat ID */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">Telegram Chat ID / Group ID</label>
                        <input
                            type="text"
                            className="settings-input"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            placeholder="Contoh: -100xxxxxxxxxx"
                        />
                        <div className="settings-hint">ID Grup atau Channel Telegram untuk siaran alert otomatis</div>
                    </div>

                    {/* Telegram Bot Token */}
                    <div className="col-12">
                        <label className="settings-label">Telegram Bot Token</label>
                        <div className="settings-input-group">
                            <input
                                type={showToken ? 'text' : 'password'}
                                className="settings-input"
                                value={telegramToken}
                                onChange={(e) => setTelegramToken(e.target.value)}
                                placeholder={data.has_telegram_token ? '•••••••••••••••• (Tersimpan Terenkripsi)' : '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ'}
                            />
                            <button
                                type="button"
                                className="settings-input-btn"
                                onClick={() => setShowToken(!showToken)}
                                title={showToken ? 'Sembunyikan' : 'Tampilkan'}
                            >
                                <i className={`bi ${showToken ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>
                        <div className="settings-hint">
                            <i className="bi bi-shield-lock-fill text-muted me-1"></i>
                            Token bot Telegram disimpan terenkripsi di database untuk keamanan kredensial webhook.
                        </div>
                    </div>
                </div>

                {/* Actions: Uji Koneksi Telegram */}
                <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center gap-2.5">
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'rgba(14, 165, 163, 0.12)',
                            color: 'var(--teal-1, #0ea5a3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            flexShrink: 0
                        }}>
                            <i className="bi bi-telegram"></i>
                        </div>
                        <div>
                            <div className="fw-semibold" style={{ fontSize: '0.88rem', color: 'var(--ink, #0f2a3f)' }}>
                                Uji Koneksi Bot Telegram
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                Kirim pesan uji siaga langsung ke Chat ID untuk memastikan bot aktif dan dapat mengirim alert insiden
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn-test-connection"
                        onClick={handleTestTelegram}
                        disabled={isTestingTelegram}
                    >
                        {isTestingTelegram ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                Menguji...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-send-check me-1"></i>
                                Uji Bot Telegram
                            </>
                        )}
                    </button>
                </div>

                <div className="d-flex justify-content-end pt-3 border-top">
                    <button
                        type="submit"
                        className="btn-save-settings"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check2-circle"></i>
                                Simpan Preferensi Umum
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
