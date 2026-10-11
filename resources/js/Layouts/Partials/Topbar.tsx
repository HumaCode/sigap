import { Link, usePage } from '@inertiajs/react';

interface TopbarProps {
    setSidebarOpen: (isOpen: boolean) => void;
}

export default function Topbar({ setSidebarOpen }: TopbarProps) {
    const { unread_notifications_count } = usePage<any>().props;
    const unreadCount = Number(unread_notifications_count || 0);

    return (
        <div className="topbar">
            <button className="btn-burger" id="burgerBtn" onClick={() => setSidebarOpen(true)}>
                <i className="bi bi-list"></i>
            </button>
            <div className="search-box">
                <i className="bi bi-search"></i>
                <input type="text" placeholder="Cari situs, insiden, kata kunci..." />
            </div>
            <div className="topbar-actions">
                <div className="status-live"><span className="live-dot"></span><span>Realtime aktif</span></div>
                <Link 
                    href={typeof route !== 'undefined' && route().has('notifications.index') ? route('notifications.index') : '/notifications'} 
                    className="icon-btn position-relative text-decoration-none"
                    title="Pusat Notifikasi & Alert"
                >
                    <i className="bi bi-bell"></i>
                    {unreadCount > 0 ? (
                        <span 
                            className="position-absolute badge rounded-pill bg-danger"
                            style={{ 
                                fontSize: '0.62rem', 
                                padding: '0.2rem 0.42rem', 
                                top: '4px',
                                right: '4px',
                                transform: 'translate(25%, -25%)',
                                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                            }}
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    ) : (
                        <span className="dot-alert" style={{ display: 'none' }}></span>
                    )}
                </Link>
                <button className="icon-btn d-none d-sm-flex"><i className="bi bi-question-circle"></i></button>
            </div>
        </div>
    );
}
