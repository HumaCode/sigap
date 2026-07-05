import { useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';

interface KeywordModalProps {
    show: boolean;
    onClose: () => void;
    keyword: any | null;
}

export default function KeywordModal({ show, onClose, keyword }: KeywordModalProps) {
    const isEdit = !!keyword;

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        keyword: '',
        category: 'judol',
        type: 'plain',
        is_active: true,
    });

    useEffect(() => {
        if (show) {
            if (isEdit) {
                setData({
                    keyword: keyword.keyword,
                    category: keyword.category,
                    type: keyword.type,
                    is_active: keyword.is_active,
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [show, keyword]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const options = {
            onSuccess: () => {
                onClose();
                reset();
            },
        };

        if (isEdit) {
            patch(route('keywords.update', keyword.id), options);
        } else {
            post(route('keywords.store'), options);
        }
    };

    if (!show) return null;

    const headerGradient = isEdit ? 'linear-gradient(135deg, #3b82f6, #8b7bf0)' : 'linear-gradient(135deg, #0ea5a3, #3b82f6)';
    const headerIcon = isEdit ? 'bi-pencil-square' : 'bi-journal-plus';

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(15,42,63,0.5)', zIndex: 1060, backdropFilter: 'blur(8px)' }} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', background: '#fff' }}>
                    
                    {/* Header Section */}
                    <div style={{ background: headerGradient, padding: '2rem 2.5rem', position: 'relative', color: 'white' }}>
                        <button type="button" className="btn-close btn-close-white" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.8, boxShadow: 'none' }} onClick={onClose} aria-label="Close"></button>
                        
                        <div className="d-flex align-items-center gap-4">
                            <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', backdropFilter: 'blur(10px)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}>
                                <i className={`bi ${headerIcon}`}></i>
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 800, fontSize: '1.45rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    {isEdit ? 'Ubah Kata Kunci' : 'Tambah Kata Kunci'}
                                </h4>
                                <div style={{ opacity: 0.9, fontSize: '0.85rem', marginTop: '0.3rem', fontWeight: 500 }}>
                                    {isEdit ? 'Perbarui kriteria deteksi kata kunci atau pola regex.' : 'Daftarkan kata kunci atau pola regex baru untuk scanner pemindai.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="p-4 p-md-5" style={{ background: '#f8fafc' }}>
                        <div className="mb-4">
                            <label className="form-label-custom" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem', display: 'block' }}>
                                Kata Kunci / Pola <span className="text-danger">*</span>
                            </label>
                            <input 
                                type="text" 
                                className={`form-control ${errors.keyword ? 'is-invalid' : ''}`}
                                style={{ background: 'white', borderRadius: '12px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontFamily: data.type === 'regex' ? 'monospace' : 'inherit' }}
                                placeholder={data.type === 'regex' ? 'Cth: /phising-.*\\.com/i' : 'Cth: slot gacor, judi online'} 
                                value={data.keyword}
                                onChange={e => setData('keyword', e.target.value)}
                                required
                            />
                            {errors.keyword && <div className="invalid-feedback mt-1" style={{ fontSize: '0.8rem' }}>{errors.keyword}</div>}
                        </div>

                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <label className="form-label-custom" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem', display: 'block' }}>Kategori</label>
                                <select 
                                    className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                    style={{ background: 'white', borderRadius: '12px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                >
                                    <option value="judol">Judi Online</option>
                                    <option value="obat">Obat Terlarang</option>
                                    <option value="phising">Phising</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                                {errors.category && <div className="invalid-feedback mt-1" style={{ fontSize: '0.8rem' }}>{errors.category}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label-custom" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem', display: 'block' }}>Tipe Deteksi</label>
                                <select 
                                    className={`form-select ${errors.type ? 'is-invalid' : ''}`}
                                    style={{ background: 'white', borderRadius: '12px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value)}
                                >
                                    <option value="plain">Teks Biasa</option>
                                    <option value="regex">Pola Regex</option>
                                </select>
                                {errors.type && <div className="invalid-feedback mt-1" style={{ fontSize: '0.8rem' }}>{errors.type}</div>}
                            </div>
                        </div>

                        <div className="mb-5 p-3" style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <label className="form-label-custom mb-0" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)' }}>Status Pemantauan</label>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginTop: '0.15rem' }}>Aktifkan kata kunci ini untuk pemindaian berikutnya.</div>
                                </div>
                                <div className="form-check form-switch p-0 m-0" style={{ minHeight: 'auto' }}>
                                    <input 
                                        className="form-check-input toggle-active" 
                                        type="checkbox" 
                                        role="switch" 
                                        style={{ width: '2.8rem', height: '1.5rem', margin: 0, cursor: 'pointer' }}
                                        checked={data.is_active}
                                        onChange={e => setData('is_active', e.target.checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex justify-content-end gap-3 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="btn btn-light" 
                                style={{ borderRadius: '12px', padding: '0.65rem 1.6rem', fontWeight: 600, color: '#64748b', fontSize: '0.88rem' }}
                                disabled={processing}
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary d-flex align-items-center justify-content-center gap-2" 
                                style={{ borderRadius: '12px', background: headerGradient, border: 'none', padding: '0.65rem 1.8rem', fontWeight: 600, fontSize: '0.88rem', minWidth: '130px', boxShadow: '0 10px 20px -5px rgba(59,130,246,0.3)' }} 
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        Proses...
                                    </>
                                ) : (
                                    <><i className="bi bi-save"></i> Simpan</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
