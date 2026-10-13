import React from 'react';
import { Link } from '@inertiajs/react';
import { User } from '@/types';

interface PusatBantuanSectionProps {
    user?: User;
}

export default function PusatBantuanSection({ user }: PusatBantuanSectionProps) {
    return (
        <>
            <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 py-20" id="pusat-bantuan">
                <div className="relative rounded-3xl p-10 lg:p-16 overflow-hidden shadow-2xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest border border-surface-container-highest">
                    {/* Cyber Mesh Glowing Elements in Background */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[90px] pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/20 rounded-full blur-[90px] pointer-events-none"></div>

                    <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                security
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight font-['Plus_Jakarta_Sans']">
                            Wujudkan Ekosistem Digital yang Tangguh, Aman, dan Bebas Ancaman Siber
                        </h2>
                        <p className="text-base text-on-surface-variant max-w-2xl mt-5 leading-relaxed">
                            Hubungi tim keamanan kami untuk integrasi monitoring domain baru, audit sertifikat SSL/TLS, atau dapatkan bantuan teknis tanggap darurat keamanan web.
                        </p>

                        {/* CTA Action Buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 w-full sm:w-auto">
                            <Link
                                href={user ? route('dashboard') : route('login')}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-container via-surface-tint to-primary text-on-primary font-bold text-sm shadow-[0_0_24px_rgba(20,184,166,0.4)] hover:shadow-[0_0_36px_rgba(20,184,166,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all font-['Plus_Jakarta_Sans']"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {user ? 'dashboard' : 'login'}
                                </span>
                                <span>{user ? 'Masuk ke Dashboard Sistem' : 'Akses Portal SIGAP'}</span>
                            </Link>
                            <a
                                href="tel:159"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-surface-container-highest/80 hover:bg-surface-container-highest text-secondary text-sm font-semibold border border-surface-container-highest backdrop-blur-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all font-['Plus_Jakarta_Sans']"
                            >
                                <span className="material-symbols-outlined text-[20px] text-primary">phone_in_talk</span>
                                <span>Hubungi Hotline Siaga (159)</span>
                            </a>
                        </div>

                        {/* Micro Information Guarantee */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-on-surface-variant text-xs font-['JetBrains_Mono']">
                            <span>• Layanan Pemantauan Domain &amp; Sistem Web</span>
                            <span>• Siaga 24 Jam 7 Hari Penuh</span>
                            <span>• Respons Tim Reaksi Cepat 24/7</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* OFFICIAL FOOTER */}
            <footer className="w-full bg-[#060e20]/95 backdrop-blur-xl border-t border-[#222a3d] mt-10 pt-12 pb-8">
                <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    {/* Col 1 */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-surface-tint flex items-center justify-center text-on-primary">
                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    shield_lock
                                </span>
                            </div>
                            <span className="font-bold text-lg text-primary tracking-wider font-['Plus_Jakarta_Sans']">
                                SIGAP
                            </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                            Platform Pengawasan &amp; Tanggap Keamanan Siber Terpadu. Menjaga ketersediaan digital dan integritas infrastruktur web &amp; sistem aplikasi secara real-time.
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high border border-surface-container-highest text-on-surface-variant text-[11px] font-['JetBrains_Mono']">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                DEFENSE READY
                            </span>
                        </div>
                    </div>

                    {/* Col 2 */}
                    <div>
                        <h4 className="text-sm font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                            Pusat Bantuan &amp; Layanan
                        </h4>
                        <div className="space-y-2.5 text-xs text-on-surface-variant">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">support_agent</span>
                                <div>
                                    <div className="text-on-surface font-semibold">Hotline 24/7 Tanggap Darurat</div>
                                    <div className="text-secondary font-['JetBrains_Mono']">159 / (021) 788-400-99</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">mail</span>
                                <div>
                                    <div className="text-on-surface font-semibold">Email Insiden</div>
                                    <div className="font-['JetBrains_Mono']">incident-response@sigap.id</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">shield</span>
                                <div>
                                    <div className="text-on-surface font-semibold">Unit Pengawas</div>
                                    <div className="text-on-surface-variant">Security Operations Center (SOC)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Col 3 */}
                    <div>
                        <h4 className="text-sm font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                            Tautan Layanan &amp; Panduan
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[16px]">chevron_right</span>
                                <a href="#mitigasi-insiden-ai" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                    SOP Penanganan Insiden Siber
                                </a>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[16px]">chevron_right</span>
                                <a href="#pilar-pengawasan" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                    Standar Keamanan ISO 27001
                                </a>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[16px]">chevron_right</span>
                                <a href="#transparansi-status" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                    Status Ketersediaan Layanan
                                </a>
                            </li>
                            <li className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[16px]">chevron_right</span>
                                <a href="#pusat-bantuan" className="text-on-surface-variant hover:text-on-surface transition-colors">
                                    Pelaporan Cepat Web Defacement
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Col 4 */}
                    <div>
                        <h4 className="text-sm font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                            Sertifikasi &amp; Keamanan
                        </h4>
                        <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                            Menerapkan arsitektur keamanan siber berstandar internasional untuk perlindungan ketersediaan web dan integritas data.
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 rounded bg-surface-container border border-surface-container-highest text-on-surface-variant text-[11px] font-['JetBrains_Mono'] uppercase">
                                Security Grade A
                            </div>
                            <div className="px-3 py-1.5 rounded bg-surface-container border border-surface-container-highest text-on-surface-variant text-[11px] font-['JetBrains_Mono'] uppercase">
                                ISO 27001 Ready
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 pt-6 border-t border-surface-container-highest/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
                    <p className="text-center md:text-left">
                        &copy; 2026 SIGAP — Platform Pengawasan Keamanan &amp; Uptime Web. Seluruh Hak Cipta Dilindungi.
                    </p>
                    <div className="flex items-center gap-4 text-[11px] font-['JetBrains_Mono']">
                        <span className="hover:text-primary transition-colors cursor-pointer">Kebijakan Privasi</span>
                        <span className="text-outline-variant">•</span>
                        <span className="hover:text-primary transition-colors cursor-pointer">Ketentuan Layanan</span>
                        <span className="text-outline-variant">•</span>
                        <span className="hover:text-primary transition-colors cursor-pointer">Klasifikasi Keamanan</span>
                    </div>
                </div>
            </footer>
        </>
    );
}
