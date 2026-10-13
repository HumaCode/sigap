import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { User } from '@/types';

interface LandingHeaderProps {
    user?: User;
    activeSection: 'beranda' | 'pilar' | 'status' | 'mitigasi' | 'kontak';
    setActiveSection: (section: 'beranda' | 'pilar' | 'status' | 'mitigasi' | 'kontak') => void;
}

export default function LandingHeader({
    user,
    activeSection,
    setActiveSection,
}: LandingHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sigap-nav" id="beranda-top">
            <div className="sigap-nav-inner">
                {/* Brand Logo & Name */}
                <a
                    className="sigap-brand"
                    href="#beranda"
                    onClick={() => setActiveSection('beranda')}
                    aria-label="SIGAP — Monitoring Keamanan & Uptime Situs"
                >
                    <svg className="sigap-brand-logo" viewBox="0 0 48 48" aria-hidden="true">
                        <defs>
                            <linearGradient id="sigap-sg" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#2dd4bf" />
                                <stop offset="0.55" stopColor="#0ea5a3" />
                                <stop offset="1" stopColor="#0284c7" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M24 3l17 6v13c0 11-7.5 19.5-17 23C14.5 41.5 7 33 7 22V9z"
                            fill="rgba(14,165,163,.16)"
                            stroke="url(#sigap-sg)"
                            strokeWidth="2.4"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M24 9l11 4v9c0 7.5-4.8 13.5-11 16.5C17.8 35.5 13 29.5 13 22v-9z"
                            fill="url(#sigap-sg)"
                            opacity=".22"
                        />
                        <rect x="17.5" y="21" width="13" height="10" rx="2.2" fill="none" stroke="#e8fffb" strokeWidth="2" />
                        <path d="M20.5 21v-3.2a3.5 3.5 0 0 1 7 0V21" fill="none" stroke="#e8fffb" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="24" cy="26" r="1.6" fill="#e8fffb" />
                    </svg>
                    <span className="sigap-brand-text">
                        <span className="sigap-brand-name">SIGAP</span>
                        <span className="sigap-brand-sub">Monitoring Situs & Layanan</span>
                    </span>
                </a>

                {/* Navigation Links (Center) */}
                <nav className="sigap-links" aria-label="Navigasi utama">
                    <a
                        href="#beranda"
                        onClick={() => setActiveSection('beranda')}
                        className={activeSection === 'beranda' ? 'active' : ''}
                    >
                        Beranda
                    </a>
                    <a
                        href="#pilar-pengawasan"
                        onClick={() => setActiveSection('pilar')}
                        className={activeSection === 'pilar' ? 'active' : ''}
                    >
                        Pilar Pengawasan
                    </a>
                    <a
                        href="#transparansi-status"
                        onClick={() => setActiveSection('status')}
                        className={activeSection === 'status' ? 'active' : ''}
                    >
                        Status Publik
                    </a>
                    <a
                        href="#mitigasi-insiden-ai"
                        onClick={() => setActiveSection('mitigasi')}
                        className={activeSection === 'mitigasi' ? 'active' : ''}
                    >
                        Mitigasi AI
                    </a>
                    <a
                        href="#pusat-bantuan"
                        onClick={() => setActiveSection('kontak')}
                        className={activeSection === 'kontak' ? 'active' : ''}
                    >
                        Pusat Bantuan
                    </a>
                </nav>

                {/* Actions (Right) */}
                <div className="sigap-nav-right">
                    {user ? (
                        <Link className="sigap-btn sigap-btn-primary" href={route('dashboard')}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="9" rx="1" />
                                <rect x="14" y="3" width="7" height="5" rx="1" />
                                <rect x="14" y="12" width="7" height="9" rx="1" />
                                <rect x="3" y="16" width="7" height="5" rx="1" />
                            </svg>
                            <span>Buka Dashboard</span>
                        </Link>
                    ) : (
                        <Link className="sigap-btn sigap-btn-primary" href={route('login')}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-3" />
                                <path d="M10 17l5-5-5-5" />
                                <path d="M15 12H3" />
                            </svg>
                            <span>Masuk ke Portal</span>
                        </Link>
                    )}

                    {/* Mobile Hamburger Button */}
                    <button
                        className="sigap-burger"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Buka menu"
                    >
                        {mobileMenuOpen ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="sigap-mobile-menu">
                    <a
                        href="#beranda"
                        onClick={() => {
                            setActiveSection('beranda');
                            setMobileMenuOpen(false);
                        }}
                        className="block px-4 py-2.5 rounded-xl text-white font-medium hover:bg-white/[0.06]"
                    >
                        Beranda
                    </a>
                    <a
                        href="#pilar-pengawasan"
                        onClick={() => {
                            setActiveSection('pilar');
                            setMobileMenuOpen(false);
                        }}
                        className="block px-4 py-2.5 rounded-xl text-white font-medium hover:bg-white/[0.06]"
                    >
                        Pilar Pengawasan
                    </a>
                    <a
                        href="#transparansi-status"
                        onClick={() => {
                            setActiveSection('status');
                            setMobileMenuOpen(false);
                        }}
                        className="block px-4 py-2.5 rounded-xl text-white font-medium hover:bg-white/[0.06]"
                    >
                        Status Publik
                    </a>
                    <a
                        href="#mitigasi-insiden-ai"
                        onClick={() => {
                            setActiveSection('mitigasi');
                            setMobileMenuOpen(false);
                        }}
                        className="block px-4 py-2.5 rounded-xl text-white font-medium hover:bg-white/[0.06]"
                    >
                        Mitigasi AI
                    </a>
                    <a
                        href="#pusat-bantuan"
                        onClick={() => {
                            setActiveSection('kontak');
                            setMobileMenuOpen(false);
                        }}
                        className="block px-4 py-2.5 rounded-xl text-white font-medium hover:bg-white/[0.06]"
                    >
                        Pusat Bantuan
                    </a>
                    <div className="pt-2">
                        <Link
                            className="sigap-btn sigap-btn-primary w-full"
                            href={user ? route('dashboard') : route('login')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-3" />
                                <path d="M10 17l5-5-5-5" />
                                <path d="M15 12H3" />
                            </svg>
                            <span>{user ? 'Buka Dashboard' : 'Masuk ke Portal'}</span>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
