import axios from 'axios';
import React, { useState } from 'react';
import { toast } from '@/Components/DynamicToast';

interface NineRouterModelItem {
    id: string;
    name: string;
    owned_by?: string;
    context_length?: number | null;
    has_vision?: boolean;
    has_reasoning?: boolean;
}

interface NineRouterTabProps {
    data: {
        endpoint: string;
        api_key: string;
        model: string;
        available_models: NineRouterModelItem[];
        has_api_key?: boolean;
    };
    onSave: (settings: Record<string, any>) => void;
    isSaving: boolean;
}

export default function NineRouterTab({ data, onSave, isSaving }: NineRouterTabProps) {
    const [endpoint, setEndpoint] = useState(data.endpoint || 'https://9router.humacode.my.id/v1');
    const [apiKey, setApiKey] = useState(data.api_key || '');
    const [selectedModel, setSelectedModel] = useState(data.model || 'combo-maut');
    const [availableModels, setAvailableModels] = useState<NineRouterModelItem[]>(data.available_models || []);
    const [showApiKey, setShowApiKey] = useState(false);

    // Test connection state
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
    const [modelSearch, setModelSearch] = useState('');

    const handleTestConnection = async () => {
        if (!endpoint.trim()) {
            toast.error('Perhatian', 'URL Endpoint 9Router wajib diisi.');

            return;
        }

        if (!apiKey.trim()) {
            toast.error('Perhatian', 'API Key 9Router wajib diisi.');

            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const res = await axios.post(route('settings.ninerouter.test'), {
                endpoint: endpoint.trim(),
                api_key: apiKey.trim(),
            });

            if (res.data.success) {
                setTestResult({
                    success: true,
                    message: res.data.message || 'Koneksi berhasil dan model dimuat.',
                    count: res.data.count,
                });

                if (Array.isArray(res.data.models) && res.data.models.length > 0) {
                    setAvailableModels(res.data.models);
                    // If current selectedModel is not in list, pick the first one or keep if default
                    const exists = res.data.models.some((m: NineRouterModelItem) => m.id === selectedModel);

                    if (!exists && res.data.models[0]?.id) {
                        setSelectedModel(res.data.models[0].id);
                    }
                }

                toast.success('Koneksi Berhasil & Pengaturan Tersinkron', `Berhasil memuat ${res.data.count || res.data.models?.length} model dari 9Router. Konfigurasi endpoint & API Key otomatis disinkronkan ke sistem.`);
            } else {
                setTestResult({
                    success: false,
                    message: res.data.message || 'Gagal terhubung ke 9Router API.',
                });
                toast.error('Koneksi Gagal', res.data.message || 'Periksa kembali endpoint dan API Key.');
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat menguji koneksi.';
            setTestResult({
                success: false,
                message: errMsg,
            });
            toast.error('Gagal', errMsg);
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            endpoint: endpoint.trim(),
            api_key: apiKey.trim(),
            model: selectedModel,
            available_models: availableModels,
        });
    };

    const filteredModels = availableModels.filter(m =>
        m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
        (m.owned_by && m.owned_by.toLowerCase().includes(modelSearch.toLowerCase()))
    );

    return (
        <form onSubmit={handleSubmit}>
            <div className="settings-card">
                <div className="settings-card-header">
                    <div>
                        <h4 className="settings-card-title">
                            <i className="bi bi-cpu text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                            Integrasi 9Router AI Gateway
                        </h4>
                        <p className="settings-card-subtitle">
                            Konfigurasikan gateway AI terpadu untuk asisten remediasi insiden cyber security dan analisis otomatis
                        </p>
                    </div>
                    <div>
                        <span className="badge rounded-pill" style={{
                            background: data.has_api_key ? '#ecfdf5' : '#fef2f2',
                            color: data.has_api_key ? '#059669' : '#dc2626',
                            border: `1px solid ${data.has_api_key ? '#a7f3d0' : '#fecaca'}`,
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                        }}>
                            <i className={`bi ${data.has_api_key ? 'bi-shield-check' : 'bi-shield-slash'} me-1`}></i>
                            {data.has_api_key ? 'API Key Terenkripsi Aktif' : 'Belum Dikonfigurasi'}
                        </span>
                    </div>
                </div>

                {/* Test Result Banner */}
                {testResult && (
                    <div className={`connection-banner ${testResult.success ? 'success' : 'error'}`}>
                        <i className={`bi ${testResult.success ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`} style={{ fontSize: '1.25rem' }}></i>
                        <div className="flex-grow-1">
                            <strong>{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal!'}</strong>
                            <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>{testResult.message}</div>
                        </div>
                    </div>
                )}

                <div className="row g-4 mb-4">
                    {/* Endpoint URL */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">
                            API Endpoint URL <span className="text-danger">*</span>
                        </label>
                        <div className="settings-input-group">
                            <input
                                type="url"
                                className="settings-input"
                                placeholder="https://9router.humacode.my.id/v1"
                                value={endpoint}
                                onChange={(e) => setEndpoint(e.target.value)}
                                required
                            />
                        </div>
                        <div className="settings-hint">
                            Endpoint 9Router kompatibel OpenAI API (misal: <code>https://9router.humacode.my.id/v1</code>)
                        </div>
                    </div>

                    {/* API Key */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">
                            API Secret Key <span className="text-danger">*</span>
                        </label>
                        <div className="settings-input-group">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                className="settings-input"
                                placeholder={data.has_api_key ? '•••••••••••••••• (Tersimpan Terenkripsi)' : 'sk-xxxxxxxxxxxxxxxx'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <button
                                type="button"
                                className="settings-input-btn"
                                onClick={() => setShowApiKey(!showApiKey)}
                                title={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
                            >
                                <i className={`bi ${showApiKey ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>
                        <div className="settings-hint">
                            <i className="bi bi-lock-fill text-muted me-1"></i>
                            Kunci API disimpan dengan enkripsi <code>AES-256-CBC</code> di database. Kosongkan jika tidak ingin mengubah.
                        </div>
                    </div>
                </div>

                {/* Actions: Cek Koneksi */}
                <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-4" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-arrow-repeat text-teal" style={{ color: 'var(--teal-1, #0ea5a3)', fontSize: '1.2rem' }}></i>
                        <div>
                            <div className="fw-semibold" style={{ fontSize: '0.88rem', color: 'var(--ink, #0f2a3f)' }}>
                                Uji Koneksi & Sinkronisasi Model
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                Hubungi server 9Router untuk memvalidasi kredensial dan menarik daftar model terbaru
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn-test-connection"
                        onClick={handleTestConnection}
                        disabled={isTesting}
                    >
                        {isTesting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                Memeriksa...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-broadcast"></i>
                                Cek & Muat Model
                            </>
                        )}
                    </button>
                </div>

                {/* Model Selection Section */}
                <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                        <div>
                            <label className="settings-label m-0">
                                Pilihan Model AI Default <span className="text-danger">*</span>
                            </label>
                            <div className="settings-hint mt-0">
                                Model utama yang akan digunakan otomatis saat asisten remediasi insiden dipanggil
                            </div>
                        </div>
                        {availableModels.length > 0 && (
                            <div style={{ width: '220px' }}>
                                <input
                                    type="text"
                                    className="settings-input py-1 px-2"
                                    style={{ fontSize: '0.8rem' }}
                                    placeholder="Cari model..."
                                    value={modelSearch}
                                    onChange={(e) => setModelSearch(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {availableModels.length > 0 ? (
                        <div className="models-grid">
                            {filteredModels.map((m) => {
                                const isSelected = selectedModel === m.id;

                                return (
                                    <div
                                        key={m.id}
                                        className={`model-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => setSelectedModel(m.id)}
                                    >
                                        <div>
                                            <div className="d-flex align-items-start justify-content-between gap-1">
                                                <span className="model-title">{m.id}</span>
                                                {isSelected && (
                                                    <i className="bi bi-check-circle-fill text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                                                )}
                                            </div>
                                        </div>
                                        <div className="model-meta">
                                            {isSelected && <span className="model-badge selected-pill">Aktif Default</span>}
                                            {m.owned_by && <span className="model-badge">{m.owned_by}</span>}
                                            {m.has_vision && <span className="model-badge vision">Vision</span>}
                                            {m.has_reasoning && <span className="model-badge reasoning">Reasoning</span>}
                                            {m.context_length && (
                                                <span className="model-badge">
                                                    {Math.round(m.context_length / 1024)}k ctx
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-4 text-center rounded-3" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                            <i className="bi bi-cpu text-muted mb-2 d-block" style={{ fontSize: '2rem' }}></i>
                            <div className="fw-semibold text-muted" style={{ fontSize: '0.88rem' }}>
                                Belum ada daftar model yang tersinkronisasi
                            </div>
                            <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                                Klik tombol <strong>"Cek & Muat Model"</strong> di atas untuk mengambil daftar model yang tersedia dari 9Router.
                            </p>
                            <div className="col-12 col-md-6 mx-auto">
                                <input
                                    type="text"
                                    className="settings-input text-center"
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    placeholder="ag/gemini-3.8-flash"
                                />
                            </div>
                        </div>
                    )}
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
                                Simpan Pengaturan 9Router
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
