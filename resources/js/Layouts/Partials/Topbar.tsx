import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import SystemHelpModal from '@/Components/SystemHelpModal';

interface TopbarProps {
    setSidebarOpen: (isOpen: boolean) => void;
}

interface SearchItem {
    id: string;
    title: string;
    subtitle?: string;
    badge?: string;
    badge_type?: string;
    url: string;
    icon?: string;
}

interface SearchCategory {
    category_id: string;
    category_name: string;
    category_icon: string;
    category_color: string;
    category_bg: string;
    items: SearchItem[];
}

export default function Topbar({ setSidebarOpen }: TopbarProps) {
    const { unread_notifications_count, app_name } = usePage<any>().props;
    const unreadCount = Number(unread_notifications_count || 0);

    const [query, setQuery] = useState<string>('');
    const [categories, setCategories] = useState<SearchCategory[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

    const searchBoxRef = useRef<HTMLDivElement>(null);

    // Debounced search effect with AbortController
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setCategories([]);
            setTotal(0);
            setIsLoading(false);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        const abortController = new AbortController();

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/global-search?q=${encodeURIComponent(trimmed)}`, {
                    headers: { 'Accept': 'application/json' },
                    signal: abortController.signal,
                });
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                    setTotal(data.total || 0);
                    setIsOpen(true);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Search error:', err);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [query]);

    // Close on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
            // Open help modal on Shift + ? (or question mark key)
            if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
                e.preventDefault();
                setShowHelpModal(true);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Helper to highlight matching keyword in title or subtitle
    const highlightMatch = (text: string, q: string) => {
        if (!q || !text) return text;
        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!escaped) return text;

        const regex = new RegExp(`(${escaped})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) =>
            regex.test(part) ? (
                <mark
                    key={index}
                    style={{
                        background: 'rgba(14, 165, 163, 0.22)',
                        color: '#087371',
                        fontWeight: 800,
                        padding: '1px 3px',
                        borderRadius: '3px',
                    }}
                >
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    const getBadgeClass = (type?: string) => {
        switch (type) {
            case 'success':
                return 'bg-success-subtle text-success border border-success-subtle';
            case 'danger':
                return 'bg-danger-subtle text-danger border border-danger-subtle';
            case 'warning':
                return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
            case 'info':
                return 'bg-info-subtle text-info-emphasis border border-info-subtle';
            case 'primary':
                return 'bg-primary-subtle text-primary border border-primary-subtle';
            default:
                return 'bg-light text-muted border';
        }
    };

    const handleSelectResult = (url: string) => {
        setIsOpen(false);
        setQuery('');
        router.visit(url);
    };

    return (
        <div className="topbar">
            <button className="btn-burger" id="burgerBtn" onClick={() => setSidebarOpen(true)}>
                <i className="bi bi-list"></i>
            </button>

            {/* Interactive Search Box Container */}
            <div className="search-box position-relative" ref={searchBoxRef}>
                <i className="bi bi-search" style={{ pointerEvents: 'none' }}></i>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.trim().length >= 2) setIsOpen(true);
                    }}
                    placeholder="Cari situs, insiden, kata kunci..."
                    style={{ paddingRight: query ? '36px' : '1rem' }}
                />

                {/* Interactive Loading indicator or clear button */}
                {isLoading ? (
                    <div className="search-loader" title="Sedang mencari data...">
                        <span className="search-loader-pulse" />
                        <svg className="search-loader-svg" viewBox="0 0 24 24" fill="none">
                            <circle
                                cx="12"
                                cy="12"
                                r="9"
                                stroke="rgba(14, 165, 163, 0.2)"
                                strokeWidth="2.5"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="9"
                                stroke="url(#search-loader-grad)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray="25 45"
                            />
                            <defs>
                                <linearGradient id="search-loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#0ea5a3" />
                                    <stop offset="100%" stopColor="#22c1a4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                ) : query ? (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setIsOpen(false);
                        }}
                        aria-label="Hapus pencarian"
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(15, 42, 63, 0.08)',
                            color: 'var(--ink-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            zIndex: 2,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                            e.currentTarget.style.color = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(15, 42, 63, 0.08)';
                            e.currentTarget.style.color = 'var(--ink-soft)';
                        }}
                        title="Hapus pencarian"
                    >
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </button>
                ) : null}

                {/* Categorized Live Search Dropdown */}
                {isOpen && (
                    <div
                        className="position-absolute shadow-lg overflow-hidden animate__animated animate__fadeIn"
                        style={{
                            top: 'calc(100% + 8px)',
                            left: 0,
                            width: '100%',
                            minWidth: '380px',
                            maxWidth: '460px',
                            background: '#ffffff',
                            borderRadius: '16px',
                            border: '1.5px solid rgba(14, 165, 163, 0.22)',
                            boxShadow: '0 16px 40px rgba(15, 42, 63, 0.16), 0 2px 8px rgba(0,0,0,0.06)',
                            zIndex: 1060,
                        }}
                    >
                        {categories.length > 0 ? (
                            <>
                                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                    {categories.map((cat) => (
                                        <div key={cat.category_id} className="search-group">
                                            {/* Category Header */}
                                            <div
                                                className="d-flex align-items-center justify-content-between px-3 py-1.5"
                                                style={{
                                                    background: '#f8fafc',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    borderTop: '1px solid #f1f5f9',
                                                }}
                                            >
                                                <div
                                                    className="d-flex align-items-center gap-1.5"
                                                    style={{
                                                        color: cat.category_color,
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.04em',
                                                    }}
                                                >
                                                    <i className={`bi ${cat.category_icon}`}></i>
                                                    <span>{cat.category_name}</span>
                                                </div>
                                                <span
                                                    className="badge rounded-pill bg-white text-muted border px-2 py-0.5"
                                                    style={{ fontSize: '0.64rem', fontWeight: 600 }}
                                                >
                                                    {cat.items.length} hasil
                                                </span>
                                            </div>

                                            {/* Category Items */}
                                            {cat.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleSelectResult(item.url)}
                                                    className="px-3 py-2 d-flex align-items-center justify-content-between"
                                                    style={{
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid rgba(15, 42, 63, 0.04)',
                                                        transition: 'all 0.15s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(14, 165, 163, 0.06)';
                                                        e.currentTarget.style.transform = 'translateX(2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.transform = 'translateX(0)';
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center gap-2.5 min-w-0">
                                                        <div
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '7px',
                                                                background: cat.category_bg,
                                                                color: cat.category_color,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.85rem',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <i className={`bi ${item.icon || cat.category_icon}`}></i>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div
                                                                className="text-truncate fw-semibold"
                                                                style={{ fontSize: '0.82rem', color: '#0f2a3f' }}
                                                            >
                                                                {highlightMatch(item.title, query)}
                                                            </div>
                                                            {item.subtitle && (
                                                                <div
                                                                    className="text-truncate"
                                                                    style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}
                                                                >
                                                                    {highlightMatch(item.subtitle, query)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {item.badge && (
                                                        <span
                                                            className={`badge rounded-pill ${getBadgeClass(
                                                                item.badge_type
                                                            )} px-2 py-0.5 flex-shrink-0 ms-2`}
                                                            style={{ fontSize: '0.66rem', fontWeight: 600 }}
                                                        >
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {/* Dropdown Footer */}
                                <div
                                    className="px-3 py-2 bg-light border-top d-flex align-items-center justify-content-between"
                                    style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}
                                >
                                    <span>
                                        Ditemukan <strong>{total}</strong> data sesuai kriteria
                                    </span>
                                    <span className="badge bg-white text-muted border px-2 py-0.5" style={{ fontSize: '0.62rem' }}>
                                        ESC untuk tutup
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 text-center">
                                <div
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        background: 'rgba(15, 42, 63, 0.05)',
                                        color: 'var(--ink-faint)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 0.5rem auto',
                                        fontSize: '1.2rem',
                                    }}
                                >
                                    <i className="bi bi-search"></i>
                                </div>
                                <div className="fw-semibold mb-1" style={{ fontSize: '0.82rem', color: '#0f2a3f' }}>
                                    Tidak ada hasil untuk &quot;{query}&quot;
                                </div>
                                <p className="text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                                    Coba gunakan kata kunci nama domain, judul insiden, atau menu lainnya.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="topbar-actions">
                <div className="status-live">
                    <span className="live-dot"></span>
                    <span>Realtime aktif</span>
                </div>
                <Link
                    href={typeof route !== 'undefined' && route().has('notifications.index') ? route('notifications.index') : '/notifications'}
                    className="icon-btn position-relative text-decoration-none"
                    title="Pusat Notifikasi &amp; Alert"
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
                                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                            }}
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    ) : (
                        <span className="dot-alert" style={{ display: 'none' }}></span>
                    )}
                </Link>
                <button
                    type="button"
                    className="icon-btn d-none d-sm-flex"
                    title="Pusat Bantuan & Panduan Sistem (Shift + ?)"
                    onClick={() => setShowHelpModal(true)}
                >
                    <i className="bi bi-question-circle"></i>
                </button>
            </div>

            {/* Interactive Help & Knowledge Base Modal */}
            <SystemHelpModal
                show={showHelpModal}
                onClose={() => setShowHelpModal(false)}
                appName={app_name || 'SIGAP'}
            />
        </div>
    );
}
