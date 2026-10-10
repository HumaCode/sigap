import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import BaseModal from '@/Components/BaseModal';
import { toast } from '@/Components/DynamicToast';
import { KeywordItem } from './KeywordTable';

interface KeywordModalProps {
    show: boolean;
    onClose: () => void;
    keyword: KeywordItem | null;
}

export default function KeywordModal({ show, onClose, keyword }: KeywordModalProps) {
    const isEdit = !!keyword;

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        keyword: '',
        category: 'judol',
        type: 'plain',
        is_active: true,
        description: '',
    });

    useEffect(() => {
        if (show) {
            if (isEdit) {
                setData({
                    keyword: keyword.keyword || '',
                    category: keyword.category || 'judol',
                    type: keyword.type || 'plain',
                    is_active: keyword.is_active ?? true,
                    description: keyword.description || '',
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [show, keyword]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const keywordName = data.keyword.trim();

        if (isEdit) {
            patch(route('keywords.update', keyword.id), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                    toast.success('Berhasil Diperbarui', `Kata kunci "${keywordName}" berhasil diperbarui.`);
                },
                onError: (errs: any) => {
                    const firstErr = Object.values(errs)[0];
                    toast.error('Gagal', typeof firstErr === 'string' ? firstErr : 'Periksa kembali formulir kata kunci.');
                }
            });
        } else {
            post(route('keywords.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                    toast.success('Berhasil Ditambahkan', `Kata kunci baru "${keywordName}" berhasil didaftarkan ke sistem pemindai.`);
                },
                onError: (errs: any) => {
                    const firstErr = Object.values(errs)[0];
                    toast.error('Gagal', typeof firstErr === 'string' ? firstErr : 'Periksa kembali formulir kata kunci.');
                }
            });
        }
    };

    const headerGradient = isEdit 
        ? 'linear-gradient(135deg, #2563eb, #1e3a8a)' 
        : 'linear-gradient(135deg, #0ea5a3, #0f2a3f)';
    const headerIcon = isEdit ? 'bi bi-pencil-square' : 'bi bi-journal-plus';

    const modalFooter = (
        <div className="w-100 d-flex align-items-center justify-content-between">
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                <i className="bi bi-shield-check me-1"></i>
                Pola deteksi akan otomatis aktif di jadwal pemindaian.
            </span>
            <div className="d-flex gap-2">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="btn btn-light" 
                    style={{ borderRadius: '12px', padding: '0.6rem 1.4rem', fontWeight: 600, color: '#64748b' }}
                    disabled={processing}
                >
                    Batal
                </button>
                <button 
                    type="submit" 
                    form="keyword-form"
                    className="btn d-flex align-items-center justify-content-center gap-2 text-white shadow-sm" 
                    style={{ 
                        borderRadius: '12px', 
                        background: isEdit ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, var(--teal-1), #0d9488)', 
                        border: 'none', 
                        padding: '0.6rem 1.5rem', 
                        fontWeight: 600,
                        minWidth: '150px'
                    }} 
                    disabled={processing}
                >
                    {processing ? (
                        <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>Menyimpan...</span>
                        </>
                    ) : (
                        <>
                            <i className={isEdit ? 'bi bi-check2-circle' : 'bi bi-plus-lg'}></i>
                            <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Kata Kunci'}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <BaseModal
            show={show}
            onClose={onClose}
            title={isEdit ? 'Ubah Kata Kunci' : 'Tambah Kata Kunci Baru'}
            subtitle={isEdit ? 'Perbarui kriteria deteksi kata kunci atau pola regex pemindai.' : 'Daftarkan kata kunci atau pola regex baru untuk scanner pemindai.'}
            icon={headerIcon}
            headerGradient={headerGradient}
            size="lg"
            maxWidth="700px"
            bodyClassName="p-4"
            footer={modalFooter}
        >
            <form id="keyword-form" onSubmit={handleSubmit}>
                <div className="d-flex flex-column gap-3.5">
                    {/* Keyword / Pattern Input */}
                    <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                            Kata Kunci / Pola Script <span className="text-danger">*</span>
                        </label>
                        <input 
                            type="text" 
                            className={`form-control ${errors.keyword ? 'is-invalid' : ''}`}
                            style={{ 
                                background: 'white', 
                                borderRadius: '12px', 
                                padding: '0.7rem 1rem', 
                                border: '1px solid #e2e8f0', 
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                fontFamily: data.type === 'regex' ? 'monospace' : 'inherit',
                                fontSize: '0.9rem' 
                            }}
                            placeholder={data.type === 'regex' ? 'Cth: /phising-.*\\.com/i' : 'Cth: slot gacor, judi online, obat kuat'} 
                            value={data.keyword}
                            onChange={e => setData('keyword', e.target.value)}
                            required
                        />
                        {errors.keyword ? (
                            <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{errors.keyword}</div>
                        ) : (
                            <p style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '0.35rem', marginBottom: 0 }}>
                                <i className="bi bi-info-circle me-1"></i>
                                {data.type === 'regex' ? 'Gunakan format regex PHP standar (pola ekspresi reguler).' : 'Kata atau frasa yang menjadi target pemindaian konten berbahaya.'}
                            </p>
                        )}
                    </div>

                    {/* Category and Detection Type */}
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                                Kategori Konten <span className="text-danger">*</span>
                            </label>
                            <select 
                                className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                style={{ background: 'white', borderRadius: '12px', padding: '0.7rem 1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontSize: '0.88rem' }}
                                value={data.category}
                                onChange={e => setData('category', e.target.value)}
                            >
                                <option value="judol">Judi Online (Judol)</option>
                                <option value="obat">Obat Terlarang</option>
                                <option value="phising">Phising / Deface</option>
                                <option value="hidden">Teks Tersembunyi (Hidden CSS)</option>
                                <option value="newpage">Halaman Baru (New Injected Page)</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                            {errors.category && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{errors.category}</div>}
                        </div>

                        <div className="col-md-6">
                            <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                                Tipe Deteksi <span className="text-danger">*</span>
                            </label>
                            <select 
                                className={`form-select ${errors.type ? 'is-invalid' : ''}`}
                                style={{ background: 'white', borderRadius: '12px', padding: '0.7rem 1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontSize: '0.88rem' }}
                                value={data.type}
                                onChange={e => setData('type', e.target.value)}
                            >
                                <option value="plain">Teks Biasa (Exact match / Substring)</option>
                                <option value="regex">Pola Regex (Regular Expression)</option>
                            </select>
                            {errors.type && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{errors.type}</div>}
                        </div>
                    </div>

                    {/* Optional Description */}
                    <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                            Keterangan Tambahan <span className="text-muted fw-normal">(Opsional)</span>
                        </label>
                        <input 
                            type="text" 
                            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                            style={{ background: 'white', borderRadius: '12px', padding: '0.65rem 1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontSize: '0.85rem' }}
                            placeholder="Cth: Sering disisipkan pada artikel web PPID atau OPD"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                        />
                        {errors.description && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{errors.description}</div>}
                    </div>

                    {/* Status Toggle Switch Card */}
                    <div 
                        className="p-3.5 rounded-4 d-flex align-items-center justify-content-between" 
                        style={{ 
                            background: '#ffffff', 
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 6px rgba(15,42,63,0.02)'
                        }}
                    >
                        <div>
                            <div className="fw-semibold" style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>
                                Status Kata Kunci
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.76rem', marginTop: '0.15rem' }}>
                                {data.is_active ? 'Aktif — Kata kunci ini akan digunakan pada pemindaian website.' : 'Nonaktif — Kata kunci ini sementara dilewati saat pemindaian.'}
                            </div>
                        </div>
                        <div className="form-check form-switch m-0 ps-0">
                            <input 
                                className="form-check-input toggle-active ms-0" 
                                type="checkbox" 
                                role="switch" 
                                style={{ width: '2.6rem', height: '1.4rem', cursor: 'pointer' }}
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </BaseModal>
    );
}
