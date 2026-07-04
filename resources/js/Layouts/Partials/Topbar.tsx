interface TopbarProps {
    setSidebarOpen: (isOpen: boolean) => void;
}

export default function Topbar({ setSidebarOpen }: TopbarProps) {
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
                <button className="icon-btn"><i className="bi bi-bell"></i><span className="dot-alert"></span></button>
                <button className="icon-btn d-none d-sm-flex"><i className="bi bi-question-circle"></i></button>
            </div>
        </div>
    );
}
