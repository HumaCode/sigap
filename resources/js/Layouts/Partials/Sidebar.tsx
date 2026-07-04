import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    user: { name: string; email: string; [key: string]: any };
}

export default function Sidebar({ isOpen, setIsOpen, user }: SidebarProps) {
    const { menus } = usePage<any>().props;
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

                {menus && Object.keys(menus).map(category => (
                    <div key={category}>
                        <div className="nav-section-label">{category}</div>
                        {menus[category].map((item: any) => {
                            let href = '#';
                            let isActive = false;
                            
                            try {
                                if (item.url && item.url !== '#') {
                                    if (typeof route !== 'undefined' && route().has(item.url)) {
                                        href = route(item.url);
                                        isActive = route().current(item.url);
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
