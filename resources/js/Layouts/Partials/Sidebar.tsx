import { Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    user: { name: string; email: string; [key: string]: any };
}

export default function Sidebar({ isOpen, setIsOpen, user }: SidebarProps) {
    const { menus, sso_enabled } = usePage<any>().props;
    const isSsoActive = Boolean(sso_enabled);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Keyboard ESC to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showLogoutModal && !isLoggingOut) {
                setShowLogoutModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showLogoutModal, isLoggingOut]);

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

                {menus && Object.keys(menus).map(category => (
                    <div key={category}>
                        <div className="nav-section-label">{category}</div>
                        {menus[category].map((item: any) => {
                            let href = '#';
                            let isActive = false;
                            
                            try {
                                if (item.url && item.url !== '#') {
                                    if (typeof route !== 'undefined' && route().has(item.url)) {
                                        href = String(route(item.url));
                                        isActive = Boolean(route().current(item.url));
                                    }
                                }
                            } catch (e) {
                                // Biarkan href='#', jika route belum ada
                            }

                            return (
                                <Link 
                                    key={item.id} 
                                    href={href} 
                                    className={`nav-item-custom ${isActive ? 'active' : ''}`}
                                >
                                    {item.icon && <i className={item.icon}></i>} {item.name}
                                </Link>
                            );
                        })}
                    </div>
                ))}

                <div className="sidebar-footer">
                    <div className="pic-mini">
                        <Link 
                            href={typeof route !== 'undefined' && route().has('profile.edit') ? route('profile.edit') : '/profile'} 
                            className="avatar-mini text-decoration-none"
                            title="Buka Profil Saya"
                        >
                            {user.name.substring(0, 2).toUpperCase()}
                        </Link>
                        <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                            <Link 
                                href={typeof route !== 'undefined' && route().has('profile.edit') ? route('profile.edit') : '/profile'} 
                                className="text-decoration-none text-reset"
                                title="Buka Profil Saya"
                            >
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block' }} className="text-truncate">{user.name}</span>
                            </Link>
                            <small className="text-truncate d-block">{user.email}</small>
                        </div>
                        <button onClick={() => setShowLogoutModal(true)} className="ms-auto btn-logout-sidebar" title="Keluar">
                            <i className="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </aside>

            {typeof document !== 'undefined' && createPortal(
                <div 
                    className={`custom-modal-overlay ${showLogoutModal ? 'show' : ''}`}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isLoggingOut) {
                            setShowLogoutModal(false);
                        }
                    }}
                >
                    <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Close Button */}
                        <button 
                            type="button" 
                            className="modal-close-btn" 
                            onClick={() => setShowLogoutModal(false)}
                            disabled={isLoggingOut}
                            title="Tutup Modal"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>

                        {/* Interactive Animated Icon */}
                        <div className={`modal-icon-anim ${isSsoActive ? 'sso-mode' : 'local-mode'}`}>
                            <i className={`bi ${isSsoActive ? 'bi-shield-lock-fill' : 'bi-door-open'}`}></i>
                        </div>

                        {/* Status Badge Pill */}
                        <div className="mb-2">
                            {isSsoActive ? (
                                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-3 py-1" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                                    <i className="bi bi-shield-check me-1"></i>SSO HumaCode Aktif
                                </span>
                            ) : (
                                <span className="badge rounded-pill bg-secondary-subtle text-muted border px-3 py-1" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                                    <i className="bi bi-laptop me-1"></i>Sesi Lokal SIGAP
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h4 className="modal-title-bold">
                            {isSsoActive ? 'Keluar Sesi & SSO' : 'Keluar Sesi'}
                        </h4>

                        {/* Description */}
                        <p className="modal-desc mb-3">
                            {isSsoActive ? (
                                <>
                                    Mengakhiri sesi akan mengeluarkan Anda dari <strong>SIGAP Web</strong> serta membersihkan seluruh sesi <strong>SSO HumaCode</strong>.
                                </>
                            ) : (
                                <>
                                    Apakah Anda yakin ingin mengakhiri sesi kerja dan keluar dari sistem <strong>SIGAP Web</strong>?
                                </>
                            )}
                        </p>

                        {/* Active User Preview Card */}
                        <div className="modal-user-card">
                            <div className="modal-user-avatar">
                                {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                                <div className="text-truncate fw-semibold" style={{ fontSize: '0.86rem', color: 'var(--ink, #0f2a3f)' }}>
                                    {user.name}
                                </div>
                                <div className="text-truncate text-muted" style={{ fontSize: '0.74rem' }}>
                                    {user.email}
                                </div>
                            </div>
                            <span className="badge bg-white text-muted border px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                {user.is_active ? 'Akun Aktif' : 'User'}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex justify-content-center gap-2">
                            <button 
                                type="button"
                                className="btn-cancel-custom flex-grow-1" 
                                onClick={() => setShowLogoutModal(false)}
                                disabled={isLoggingOut}
                            >
                                Batal
                            </button>
                            <button 
                                type="button"
                                className={`btn-confirm-custom flex-grow-1 ${isSsoActive ? 'sso-btn' : 'local-btn'}`}
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        {isSsoActive ? 'Keluar SSO...' : 'Memproses...'}
                                    </>
                                ) : (
                                    <>
                                        <i className={`bi ${isSsoActive ? 'bi-shield-x' : 'bi-box-arrow-right'}`}></i>
                                        {isSsoActive ? 'Ya, Logout SSO' : 'Ya, Keluar'}
                                    </>
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
