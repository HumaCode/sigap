import React from 'react';

export default function PilarPengawasanSection() {
    return (
        <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 py-20" id="pilar-pengawasan">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container text-primary text-xs font-['JetBrains_Mono'] uppercase tracking-widest font-semibold mb-4 border border-surface-container-highest">
                    ARSITEKTUR PERTAHANAN BERLAPIS
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                    4 Pilar Pengawasan Siber Komprehensif
                </h2>
                <p className="text-sm text-on-surface-variant mt-3 max-w-2xl leading-relaxed">
                    Dirancang khusus untuk menjaga integritas, reputasi, dan ketersediaan layanan web dari ancaman peretasan modern.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pillar 1 */}
                <div className="p-8 rounded-2xl bg-surface-container/80 border border-surface-container-highest backdrop-blur-xl shadow-xl relative overflow-hidden group hover:bg-surface-container-high transition-all flex flex-col justify-between">
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-surface-container-highest flex items-center justify-center text-primary shadow-inner border border-primary/20">
                                <span className="material-symbols-outlined text-[32px]">wifi_tethering</span>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-['JetBrains_Mono'] font-semibold uppercase border border-primary/20">
                                AUTO PING 30S
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                            Pemantauan Ketersediaan (Uptime &amp; SSL)
                        </h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                            Pengecekan HTTP/HTTPS multi-node berkala, pengawasan latensi respons server, serta peringatan dini kedaluwarsa sertifikat SSL/TLS sebelum downtime merugikan pengguna dan operasional layanan.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                            <div className="text-left">
                                <div className="text-xs font-semibold text-on-surface font-['JetBrains_Mono']">SSL Handshake Check</div>
                                <div className="text-[10px] text-on-surface-variant font-['JetBrains_Mono']">Auto Renewal Reminder H-30</div>
                            </div>
                        </div>
                        <span className="text-xs text-primary font-bold font-['JetBrains_Mono']">ACTIVE PROTOCOL</span>
                    </div>
                </div>

                {/* Pillar 2 */}
                <div className="p-8 rounded-2xl bg-surface-container/80 border border-surface-container-highest backdrop-blur-xl shadow-xl relative overflow-hidden group hover:bg-surface-container-high transition-all flex flex-col justify-between">
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-error/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-error/20 to-surface-container-highest flex items-center justify-center text-error shadow-inner border border-error/20">
                                <span className="material-symbols-outlined text-[32px]">shield_lock</span>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-error/15 text-error text-xs font-['JetBrains_Mono'] font-semibold uppercase border border-error/20">
                                DEEP CRAWLER
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                            Scanner Konten Ilegal &amp; Defacement
                        </h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                            Algoritma pendeteksi sisipan webshell backdoor, script defacement visual, serta injeksi kata kunci terlarang (promosi judi online slot/gacor, situs obat aborsi, konten pornografi).
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-error text-[20px]">policy</span>
                            <div className="text-left">
                                <div className="text-xs font-semibold text-on-surface font-['JetBrains_Mono']">Kamus Kata Kunci Threat Intelligence</div>
                                <div className="text-[10px] text-on-surface-variant font-['JetBrains_Mono']">15,000+ Regex Pattern Sinkron</div>
                            </div>
                        </div>
                        <span className="text-xs text-error font-bold font-['JetBrains_Mono']">ZERO TOLERANCE</span>
                    </div>
                </div>

                {/* Pillar 3 */}
                <div className="p-8 rounded-2xl bg-surface-container/80 border border-surface-container-highest backdrop-blur-xl shadow-xl relative overflow-hidden group hover:bg-surface-container-high transition-all flex flex-col justify-between">
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-surface-container-highest flex items-center justify-center text-secondary shadow-inner border border-secondary/20">
                                <span className="material-symbols-outlined text-[32px]">smart_toy</span>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-['JetBrains_Mono'] font-semibold uppercase border border-secondary/20">
                                AI Engine
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                            Asisten Remediasi Insiden Berbasis AI
                        </h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                            Analisis akar masalah otomatis (root-cause analysis), penilaian tingkat keparahan insiden berbasis CVSS, serta rekomendasi langkah teknis instan untuk tim keamanan &amp; developer.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-secondary text-[20px]">terminal</span>
                            <div className="text-left">
                                <div className="text-xs font-semibold text-on-surface font-['JetBrains_Mono']">Saran Script Mitigasi WAF / Nginx</div>
                                <div className="text-[10px] text-on-surface-variant font-['JetBrains_Mono']">Panduan Eksekusi Seketika</div>
                            </div>
                        </div>
                        <span className="text-xs text-secondary font-bold font-['JetBrains_Mono']">READY TO DEPLOY</span>
                    </div>
                </div>

                {/* Pillar 4 */}
                <div className="p-8 rounded-2xl bg-surface-container/80 border border-surface-container-highest backdrop-blur-xl shadow-xl relative overflow-hidden group hover:bg-surface-container-high transition-all flex flex-col justify-between">
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform"></div>
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-tertiary/20 to-surface-container-highest flex items-center justify-center text-tertiary shadow-inner border border-tertiary/20">
                                <span className="material-symbols-outlined text-[32px]">campaign</span>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-tertiary/15 text-tertiary text-xs font-['JetBrains_Mono'] font-semibold uppercase border border-tertiary/20">
                                Multi-Channel
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-on-surface mb-3 font-['Plus_Jakarta_Sans']">
                            Pusat Notifikasi &amp; Alarm Terpadu
                        </h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                            Pengiriman alarm darurat otomatis melalui multi-kanal: Webhook Telegram Siaga 24 jam, Discord, SMS Gateway, dan surel darurat tim pengelola.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-surface-container-highest flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-tertiary text-[20px]">send</span>
                            <div className="text-left">
                                <div className="text-xs font-semibold text-on-surface font-['JetBrains_Mono']">Telegram Bot Dispatcher</div>
                                <div className="text-[10px] text-on-surface-variant font-['JetBrains_Mono']">Integrasi Instant Alert Dispatcher</div>
                            </div>
                        </div>
                        <span className="text-xs text-tertiary font-bold font-['JetBrains_Mono']">REAL-TIME PUSH</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
