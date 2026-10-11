import React, { useState } from 'react';

interface SeoTabProps {
    data: {
        meta_title: string;
        meta_description: string;
        meta_keywords: string;
        author: string;
        robots_index: boolean;
        google_verification: string;
    };
    onSave: (settings: Record<string, any>) => void;
    isSaving: boolean;
}

export default function SeoTab({ data, onSave, isSaving }: SeoTabProps) {
    const [metaTitle, setMetaTitle] = useState(data.meta_title || '');
    const [metaDescription, setMetaDescription] = useState(data.meta_description || '');
    const [metaKeywords, setMetaKeywords] = useState(data.meta_keywords || '');
    const [author, setAuthor] = useState(data.author || '');
    const [robotsIndex, setRobotsIndex] = useState(Boolean(data.robots_index));
    const [googleVerification, setGoogleVerification] = useState(data.google_verification || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            meta_title: metaTitle,
            meta_description: metaDescription,
            meta_keywords: metaKeywords,
            author,
            robots_index: robotsIndex,
            google_verification: googleVerification,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="settings-card">
                <div className="settings-card-header">
                    <div>
                        <h4 className="settings-card-title">
                            <i className="bi bi-search text-teal" style={{ color: 'var(--teal-1, #0ea5a3)' }}></i>
                            Pengaturan Meta & Optimasi SEO
                        </h4>
                        <p className="settings-card-subtitle">
                            Konfigurasikan metadata pencarian, indeks mesin pencari, dan verifikasi webmaster
                        </p>
                    </div>
                </div>

                {/* Live Google Search Preview */}
                <div className="p-3 mb-4 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex align-items-center gap-2 mb-2 text-muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        <i className="bi bi-google"></i>
                        <span>PRATINJAU HASIL PENCARIAN GOOGLE (SERP PREVIEW)</span>
                    </div>
                    <div style={{ maxWidth: '600px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#202124' }}>
                            https://sigap.pekalongankota.go.id
                        </div>
                        <div style={{ fontSize: '1.05rem', color: '#1a0dab', fontWeight: 500, lineHeight: 1.3, cursor: 'pointer' }}>
                            {metaTitle || 'SIGAP Web - Sistem Informasi Gawat & Antisipasi Pengamanan Website'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#4d5156', marginTop: '2px', lineHeight: 1.4 }}>
                            {metaDescription || 'Platform monitoring keamanan, defacement detection, uptime ketersediaan, dan postur keamanan aset digital pemerintah secara real-time.'}
                        </div>
                    </div>
                </div>

                <div className="row g-4 mb-4">
                    {/* Meta Title */}
                    <div className="col-12">
                        <label className="settings-label">
                            Meta Title Halaman <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="settings-input"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            maxLength={70}
                            required
                        />
                        <div className="d-flex justify-content-between settings-hint">
                            <span>Direkomendasikan 50 - 60 karakter agar tidak terpotong di Google.</span>
                            <span>{metaTitle.length} / 70 karakter</span>
                        </div>
                    </div>

                    {/* Meta Description */}
                    <div className="col-12">
                        <label className="settings-label">
                            Meta Description <span className="text-danger">*</span>
                        </label>
                        <textarea
                            className="settings-input"
                            rows={3}
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            maxLength={160}
                            required
                        ></textarea>
                        <div className="d-flex justify-content-between settings-hint">
                            <span>Ringkasan singkat isi platform untuk cuplikan pencarian.</span>
                            <span>{metaDescription.length} / 160 karakter</span>
                        </div>
                    </div>

                    {/* Meta Keywords */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">Kata Kunci Meta (Keywords)</label>
                        <input
                            type="text"
                            className="settings-input"
                            value={metaKeywords}
                            onChange={(e) => setMetaKeywords(e.target.value)}
                            placeholder="monitoring, security, uptime, deface"
                        />
                        <div className="settings-hint">Pisahkan setiap kata kunci dengan tanda koma (<code>,</code>)</div>
                    </div>

                    {/* Author / Instansi */}
                    <div className="col-12 col-md-6">
                        <label className="settings-label">Instansi / Penulis (Author)</label>
                        <input
                            type="text"
                            className="settings-input"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Dinas Komunikasi dan Informatika"
                        />
                        <div className="settings-hint">Nama OPD atau pengelola resmi sistem</div>
                    </div>

                    {/* Google Verification */}
                    <div className="col-12 col-md-8">
                        <label className="settings-label">Google Site Verification Code</label>
                        <input
                            type="text"
                            className="settings-input"
                            value={googleVerification}
                            onChange={(e) => setGoogleVerification(e.target.value)}
                            placeholder="google-site-verification=xxxxxxxxxxxxxxxxxx"
                        />
                        <div className="settings-hint">Kode meta tag untuk verifikasi Google Search Console</div>
                    </div>

                    {/* Robots Index Switch */}
                    <div className="col-12 col-md-4">
                        <label className="settings-label">Pengindeksan Mesin Pencari</label>
                        <div className="form-check form-switch pt-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="robotsIndexSwitch"
                                checked={robotsIndex}
                                onChange={(e) => setRobotsIndex(e.target.checked)}
                                style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                            />
                            <label className="form-check-label ms-2" htmlFor="robotsIndexSwitch" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                                {robotsIndex ? 'Izinkan Index (index, follow)' : 'Blokir Index (noindex, nofollow)'}
                            </label>
                        </div>
                        <div className="settings-hint">
                            Aktifkan agar platform dapat ditemukan di mesin pencari
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
                                Simpan Pengaturan SEO
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
