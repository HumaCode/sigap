import React, { useState } from 'react';

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
                            Informasi identitas instansi, saluran darurat, dan integrasi bot notifikasi Telegram
                        </p>
                    </div>
                </div>

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
                        <label className="settings-label">Email Penanggung Jawab (CSIRT)</label>
                        <input
                            type="email"
                            className="settings-input"
                            value={picEmail}
                            onChange={(e) => setPicEmail(e.target.value)}
                            placeholder="csirt@pekalongankota.go.id"
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
                            placeholder="081234567890"
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
                            placeholder="-100xxxxxxxxxx"
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
