import React from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';

export default function AddSiteModal({ show, onClose, site }: { show: boolean, onClose: () => void, site?: any }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        category: 'Portal Utama',
        url: '',
        pic_name: '',
        pic_contact: '',
        check_interval: 5,
        sitemap_url: '',
        critical_pages: []
    });

    React.useEffect(() => {
        if (site) {
            setData({
                name: site.name || '',
                category: site.category || 'Portal Utama',
                url: site.url || '',
                pic_name: site.pic_name || '',
                pic_contact: site.pic_contact || '',
                check_interval: site.check_interval || 5,
                sitemap_url: site.sitemap_url || '',
                critical_pages: site.critical_pages || []
            });
        } else {
            reset();
        }
    }, [site]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (site) {
            put(route('sites.update', site.id), {
                onSuccess: () => {
                    toast.success('Berhasil Diubah', `Data situs ${data.name} berhasil diperbarui.`);
                    reset();
                    onClose();
                },
            });
        } else {
            post(route('sites.store'), {
                onSuccess: () => {
                    toast.success('Berhasil Ditambahkan', `Situs ${data.name} berhasil ditambahkan dan sedang diproses.`);
                    reset();
                    onClose();
                },
            });
        }
    };

    if (!show) return null;

    const isEdit = !!site;
    const headerGradient = isEdit ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #0ea5a3, #0d9488)';
    const headerIcon = isEdit ? 'bi-pencil-square' : 'bi-plus-circle';
    
    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(15,42,63,0.5)', zIndex: 1060, backdropFilter: 'blur(8px)' }} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
                    
                    {/* Header Section */}
                    <div style={{ background: headerGradient, padding: '2rem 2.5rem', position: 'relative', color: 'white' }}>
                        <button type="button" className="btn-close btn-close-white" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.8 }} onClick={onClose} aria-label="Close"></button>
                        
                        <div className="d-flex align-items-center gap-4">
                            <div style={{ width: '70px', height: '70px', background: 'rgba(255,255,255,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', backdropFilter: 'blur(10px)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}>
                                <i className={`bi ${headerIcon}`}></i>
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 800, fontSize: '1.6rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    {isEdit ? 'Ubah Data Situs' : 'Daftarkan Situs Baru'}
                                </h4>
                                <div style={{ opacity: 0.9, fontSize: '0.95rem', marginTop: '0.3rem', fontWeight: 500 }}>
                                    {isEdit ? 'Perbarui informasi dan konfigurasi pemantauan situs.' : 'Masukkan detail situs yang akan ditambahkan ke sistem pemantauan.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-0" style={{ background: '#f8fafc' }}>
                            <div className="row g-0">
                                {/* Left Section - Main Form */}
                                <div className="col-md-7 p-4 p-md-5 border-end" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                    <h6 style={{ color: 'var(--ink-faint)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Informasi Utama</h6>
                                    
                                    <div className="mb-4">
                                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Nama OPD / Instansi <span className="text-danger">*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            style={{ background: 'white', borderRadius: '12px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                                            placeholder="Dinas Komunikasi dan Informatika"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            required
                                        />
                                        {errors.name && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{errors.name}</div>}
                                    </div>

                                    <div className="mb-4">
                                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>URL Situs <span className="text-danger">*</span></label>
                                        <div className="input-group" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                                            <span className="input-group-text border-end-0" style={{ background: '#f1f5f9', borderRadius: '12px 0 0 12px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>https://</span>
                                            <input 
                                                type="text" 
                                                className="form-control border-start-0" 
                                                style={{ background: 'white', borderRadius: '0 12px 12px 0', padding: '0.75rem 1rem', border: '1px solid #e2e8f0' }} 
                                                placeholder="pekalongankota.go.id"
                                                value={data.url}
                                                onChange={e => setData('url', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}><i className="bi bi-info-circle me-1"></i>Domain utama yang akan dipantau secara otomatis.</p>
                                        {errors.url && <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>{errors.url}</div>}
                                    </div>

                                    <div className="mb-0">
                                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Kategori Situs</label>
                                        <select 
                                            className="form-select"
                                            style={{ background: 'white', borderRadius: '12px', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                                            value={data.category}
                                            onChange={e => setData('category', e.target.value)}
                                        >
                                            <option>Portal Utama</option>
                                            <option>SPBE</option>
                                            <option>PPID</option>
                                            <option>Lainnya</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Right Section - Config & PIC */}
                                <div className="col-md-5 p-4 p-md-5" style={{ background: 'rgba(255,255,255,0.6)' }}>
                                    <h6 style={{ color: 'var(--ink-faint)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Konfigurasi & PIC</h6>
                                    
                                    <div className="mb-4">
                                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Interval Pengecekan</label>
                                        <select 
                                            className="form-select"
                                            style={{ background: 'white', borderRadius: '10px', padding: '0.6rem 1rem', border: '1px solid #e2e8f0' }}
                                            value={data.check_interval}
                                            onChange={e => setData('check_interval', parseInt(e.target.value))}
                                        >
                                            <option value={1}>Setiap 1 menit (Kritis)</option>
                                            <option value={5}>Setiap 5 menit (Standar)</option>
                                            <option value={15}>Setiap 15 menit</option>
                                            <option value={30}>Setiap 30 menit</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>URL Sitemap <span className="text-muted fw-normal">(Opsional)</span></label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            style={{ background: 'white', borderRadius: '10px', padding: '0.6rem 1rem', border: '1px solid #e2e8f0' }}
                                            placeholder="/sitemap.xml"
                                            value={data.sitemap_url}
                                            onChange={e => setData('sitemap_url', e.target.value)}
                                        />
                                    </div>

                                    <hr style={{ borderColor: 'rgba(0,0,0,0.05)', margin: '1.5rem 0' }} />

                                    <div className="mb-3">
                                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Nama Penanggung Jawab (PIC)</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            style={{ background: 'white', borderRadius: '10px', padding: '0.6rem 1rem', border: '1px solid #e2e8f0' }}
                                            placeholder="Nama lengkap"
                                            value={data.pic_name}
                                            onChange={e => setData('pic_name', e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-0">
                                        <label style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Kontak PIC <span className="text-muted fw-normal">(WA/Email)</span></label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            style={{ background: 'white', borderRadius: '10px', padding: '0.6rem 1rem', border: '1px solid #e2e8f0' }}
                                            placeholder="08xx / email"
                                            value={data.pic_contact}
                                            onChange={e => setData('pic_contact', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '1.2rem 2rem', background: 'white' }}>
                            <button type="button" className="btn btn-light" style={{ borderRadius: '12px', padding: '0.6rem 1.5rem', fontWeight: 600, color: '#64748b' }} onClick={onClose} disabled={processing}>Batal</button>
                            <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '12px', background: isEdit ? '#2563eb' : 'var(--teal-1)', border: 'none', padding: '0.6rem 1.5rem', fontWeight: 600, minWidth: '150px' }} disabled={processing}>
                                {processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        Menyimpan...
                                    </>
                                ) : (
                                    isEdit ? <><i className="bi bi-save"></i> Simpan Perubahan</> : <><i className="bi bi-plus-lg"></i> Tambahkan Situs</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
