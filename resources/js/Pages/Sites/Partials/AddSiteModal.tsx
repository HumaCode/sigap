import React from 'react';
import { useForm } from '@inertiajs/react';

export default function AddSiteModal({ show, onClose }: { show: boolean, onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        category: 'Portal Utama',
        url: '',
        pic_name: '',
        pic_contact: '',
        check_interval: 5,
        sitemap_url: '',
        critical_pages: []
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sites.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content modal-content-custom">
                    <div className="modal-header-custom d-flex justify-content-between align-items-start">
                        <div>
                            <h5><i className="bi bi-plus-circle me-2" style={{ color: 'var(--teal-1)' }}></i>Daftarkan Situs Baru</h5>
                            <p>Cukup masukkan URL — sistem akan crawl otomatis untuk baseline awal.</p>
                        </div>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            <div className="row g-3">
                                <div className="col-md-7">
                                    <label className="form-label-custom">Nama OPD / Instansi <span style={{ color: 'var(--coral)' }}>*</span></label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-custom" 
                                        placeholder="Dinas Komunikasi dan Informatika"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{errors.name}</div>}
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label-custom">Kategori Situs</label>
                                    <select 
                                        className="form-select form-select-custom"
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                    >
                                        <option>Portal Utama</option>
                                        <option>SPBE</option>
                                        <option>PPID</option>
                                        <option>Lainnya</option>
                                    </select>
                                </div>

                                <div className="col-12">
                                    <label className="form-label-custom">URL Situs <span style={{ color: 'var(--coral)' }}>*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text" style={{ borderRadius: '12px 0 0 12px', background: 'rgba(255,255,255,0.6)', borderColor: 'var(--line)', fontSize: '0.85rem', color: 'var(--ink-faint)' }}>https://</span>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-custom" 
                                            style={{ borderRadius: '0 12px 12px 0' }} 
                                            placeholder="pekalongankota.go.id"
                                            value={data.url}
                                            onChange={e => setData('url', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="form-hint">Domain utama yang akan dipantau. Sistem akan crawl seluruh halaman via sitemap.</p>
                                    {errors.url && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{errors.url}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label-custom">Nama PIC</label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-custom" 
                                        placeholder="Nama penanggung jawab"
                                        value={data.pic_name}
                                        onChange={e => setData('pic_name', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label-custom">Kontak PIC (WA/Email)</label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-custom" 
                                        placeholder="08xx-xxxx-xxxx atau email"
                                        value={data.pic_contact}
                                        onChange={e => setData('pic_contact', e.target.value)}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label-custom">Interval Pemantauan</label>
                                    <select 
                                        className="form-select form-select-custom"
                                        value={data.check_interval}
                                        onChange={e => setData('check_interval', parseInt(e.target.value))}
                                    >
                                        <option value={1}>Setiap 1 menit</option>
                                        <option value={5}>Setiap 5 menit</option>
                                        <option value={15}>Setiap 15 menit</option>
                                        <option value={30}>Setiap 30 menit</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label-custom">URL Sitemap (opsional)</label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-custom" 
                                        placeholder="/sitemap.xml — otomatis dideteksi"
                                        value={data.sitemap_url}
                                        onChange={e => setData('sitemap_url', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid var(--line)', padding: '1.2rem 1.5rem' }}>
                            <button type="button" className="btn btn-light" style={{ borderRadius: '10px' }} onClick={onClose} disabled={processing}>Batal</button>
                            <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px', background: 'var(--teal-1)', border: 'none' }} disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Situs'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
