import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    user: { name: string; email: string; [key: string]: any };
}

export default function Sidebar({ isOpen, setIsOpen, user }: SidebarProps) {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = () => {
        setIsLoggingOut(true);
        router.post(route('logout'), {}, {
            onFinish: () => {
                setIsLoggingOut(false);
                setShowLogoutModal(false);
            }
        });
    };

    return (
        <>
            <div 
                className={`sidebar-backdrop ${isOpen ? 'show' : ''}`} 
                id="sidebarBackdrop"
                onClick={() => setIsOpen(false)}
            ></div>
            <aside className={`sidebar ${isOpen ? 'show' : ''}`} id="sidebar">
                <div className="brand-mini">
                    <div className="badge-icon"><i className="bi bi-shield-lock-fill"></i></div>
                    <div>
                        <strong>SIGAP Web</strong>
                        <span>Monitoring Situs Instansi</span>
                    </div>
                </div>

                <div className="nav-section-label">Menu Utama</div>
                <Link href={route('dashboard')} className={`nav-item-custom ${route().current('dashboard') ? 'active' : ''}`}>
                    <i className="bi bi-grid-1x2-fill"></i> Dashboard
                </Link>
                <Link href="#" className="nav-item-custom"><i className="bi bi-hdd-network"></i> Daftar Situs</Link>
                <Link href="#" className="nav-item-custom"><i className="bi bi-exclamation-octagon"></i> Insiden <span className="nav-badge">7</span></Link>
                <Link href="#" className="nav-item-custom"><i className="bi bi-graph-up-arrow"></i> Laporan Uptime</Link>

                <div className="nav-section-label">Deteksi</div>
                <Link href="#" className="nav-item-custom"><i className="bi bi-bug-fill"></i> Log Deteksi Konten</Link>
                <Link href="#" className="nav-item-custom"><i className="bi bi-journal-code"></i> Kamus Kata Kunci</Link>
                <Link href="#" className="nav-item-custom"><i className="bi bi-shield-exclamation"></i> Keamanan Situs</Link>

                <div className="nav-section-label">Sistem</div>
                <Link href="#" className="nav-item-custom"><i className="bi bi-people"></i> Pengguna &amp; Peran</Link>
                <Link href="#" className="nav-item-custom"><i className="bi bi-bell"></i> Notifikasi</Link>
                <Link href={route('profile.edit')} className="nav-item-custom"><i className="bi bi-gear"></i> Pengaturan</Link>

                <div className="sidebar-footer">
                    <div className="pic-mini">
                        <div className="avatar-mini">
                            {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>{user.name}</span>
                            <small>{user.email}</small>
                        </div>
                        <button onClick={() => setShowLogoutModal(true)} className="ms-auto btn-logout-sidebar" title="Keluar">
                            <i className="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </aside>

            {typeof document !== 'undefined' && createPortal(
                <div className={`custom-modal-overlay ${showLogoutModal ? 'show' : ''}`}>
                    <div className="custom-modal-content">
                        <div className="modal-icon-anim">
                            <i className="bi bi-door-open"></i>
                        </div>
                        <h4 className="modal-title-bold">Keluar Sesi</h4>
                        <p className="modal-desc">Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem?</p>
                        <div className="d-flex justify-content-center gap-2">
                            <button 
                                className="btn-cancel-custom" 
                                onClick={() => setShowLogoutModal(false)}
                                disabled={isLoggingOut}
                            >
                                Batal
                            </button>
                            <button 
                                className="btn-confirm-custom"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Proses...</>
                                ) : (
                                    <><i className="bi bi-box-arrow-right"></i> Ya, Keluar</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
