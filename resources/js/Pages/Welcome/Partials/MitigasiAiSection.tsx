import React, { useState } from 'react';

type ScenarioType = 'defacement' | 'downtime' | 'ssl';

export default function MitigasiAiSection() {
    const [simScenario, setSimScenario] = useState<ScenarioType>('defacement');
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const handleSelectScenario = (scenario: ScenarioType) => {
        setIsPlaying(true);
        setSimScenario(scenario);
        setTimeout(() => setIsPlaying(false), 400);
    };

    return (
        <section className="w-full max-w-[1800px] mx-auto px-6 sm:px-8 py-16" id="mitigasi-insiden-ai">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Explanation (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary/10 border border-secondary/30 text-secondary text-xs font-['JetBrains_Mono'] uppercase font-semibold w-fit">
                        ORCHESTRATED REMEDIATION
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                        Bagaimana AI SIGAP Menghentikan Peretasan dalam Hitungan Detik
                    </h2>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                        Ketika terjadi serangan defacement atau lonjakan galat ketersediaan pada website atau sub-domain Anda, mesin deteksi otonom SIGAP mengeksekusi mitigasi otomatis tanpa perlu menunggu intervensi manual berjam-jam.
                    </p>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-surface-container-highest flex items-center justify-center text-primary font-bold shrink-0 mt-0.5 text-xs font-['JetBrains_Mono']">
                                1
                            </div>
                            <div>
                                <div className="text-sm font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                                    Inspeksi Payload &amp; DOM Tree
                                </div>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    Membandingkan snapshot situs dengan hash basis data integritas berkala.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-surface-container-highest flex items-center justify-center text-secondary font-bold shrink-0 mt-0.5 text-xs font-['JetBrains_Mono']">
                                2
                            </div>
                            <div>
                                <div className="text-sm font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                                    Isolasi &amp; Rollback Cepat
                                </div>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    Mematikan skrip berbahaya secara virtual lewat WAF dan meregenerasi file asli.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-surface-container-highest flex items-center justify-center text-tertiary font-bold shrink-0 mt-0.5 text-xs font-['JetBrains_Mono']">
                                3
                            </div>
                            <div>
                                <div className="text-sm font-bold text-on-surface font-['Plus_Jakarta_Sans']">
                                    Eskalasi Tiket Penanganan Instan
                                </div>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    Membuat laporan forensik lengkap beserta titik celah keamanan yang dieksploitasi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Interactive Simulation Terminal Box (7 Cols) */}
                <div className="lg:col-span-7">
                    <div className="rounded-2xl bg-surface-container-low/90 border border-surface-container-highest/80 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden">
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-surface-container-highest">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-error/60"></span>
                                <span className="w-3 h-3 rounded-full bg-warning/60"></span>
                                <span className="w-3 h-3 rounded-full bg-primary/60"></span>
                                <span className="text-xs font-['JetBrains_Mono'] text-on-surface-variant ml-2">
                                    SIMULASI ANCAMAN SIBER // LIVE REPLAY
                                </span>
                            </div>
                            <span className="text-[11px] font-['JetBrains_Mono'] text-primary uppercase font-semibold">
                                STATUS: MITIGATED
                            </span>
                        </div>

                        {/* Scenario Selector Tabs */}
                        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-surface-container-highest/50 overflow-x-auto text-xs font-['JetBrains_Mono']">
                            <button
                                onClick={() => handleSelectScenario('defacement')}
                                className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                                    simScenario === 'defacement'
                                        ? 'bg-error/15 border-error/40 text-error font-semibold shadow-sm'
                                        : 'bg-surface-container-high/60 border-surface-container-highest text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                Skenario 1: Defacement Injeksi
                            </button>
                            <button
                                onClick={() => handleSelectScenario('downtime')}
                                className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                                    simScenario === 'downtime'
                                        ? 'bg-warning/15 border-warning/40 text-warning font-semibold shadow-sm'
                                        : 'bg-surface-container-high/60 border-surface-container-highest text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                Skenario 2: HTTP 504 Timeout
                            </button>
                            <button
                                onClick={() => handleSelectScenario('ssl')}
                                className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                                    simScenario === 'ssl'
                                        ? 'bg-secondary/15 border-secondary/40 text-secondary font-semibold shadow-sm'
                                        : 'bg-surface-container-high/60 border-surface-container-highest text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                Skenario 3: Anomali SSL / TLS
                            </button>
                        </div>

                        {/* Simulation Flow Step Sequence */}
                        <div className={`space-y-4 py-6 font-['JetBrains_Mono'] text-xs transition-opacity duration-300 ${isPlaying ? 'opacity-40' : 'opacity-100'}`}>
                            {simScenario === 'defacement' && (
                                <>
                                    {/* Step 1: Anomali Terdeteksi */}
                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-error">
                                        <span className="material-symbols-outlined text-error text-[22px] mt-0.5">warning</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-on-surface">ANOMALI TERDETEKSI: Injeksi URL Liar</span>
                                                <span className="text-[10px] text-error font-semibold">T = +0.00s</span>
                                            </div>
                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                Target: <span className="text-on-surface font-semibold">portal.layanan-digital.id/publikasi</span> • Keyword terlarang:{' '}
                                                <span className="text-error bg-error/10 px-1 rounded font-mono">slot-gacor-88</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2: AI Engine Analysis & Containment */}
                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-secondary">
                                        <span className="material-symbols-outlined text-secondary text-[22px] mt-0.5">psychology</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-on-surface">ANALISIS OTONOM: AI Root-Cause</span>
                                                <span className="text-[10px] text-secondary font-semibold">T = +1.18s</span>
                                            </div>
                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                Celah: <span className="text-on-surface font-mono">POST /wp-comments-post.php</span>. WAF menyaring IP penyerang (ASN 45823) &amp; memulihkan teks asli.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 3: Resolution & Incident Notification */}
                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-primary">
                                        <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">check_circle</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-on-surface">RESOLUSI TUNTAS: Tiket #INC-2026-088</span>
                                                <span className="text-[10px] text-primary font-semibold">T = +2.45s</span>
                                            </div>
                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                Notifikasi terkirim ke Telegram Tim Pengelola. Laman pulih 100% tanpa waktu henti operasional.
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {simScenario === 'downtime' && (
                                <>
                                    {/* Scenario 2: Downtime & Server Latency */}
                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-warning">
                                        <span className="material-symbols-outlined text-warning text-[22px] mt-0.5">timer_off</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-on-surface">LATENSI KRITIS: HTTP 504 Gateway Timeout</span>
                                                <span className="text-[10px] text-warning font-semibold">T = +0.00s</span>
                                            </div>
                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                Target: <span className="text-on-surface font-semibold">auth.secure-identity.id</span> • Server tidak merespons dalam 60 detik.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-secondary">
                                        <span className="material-symbols-outlined text-secondary text-[22px] mt-0.5">dns</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-on-surface">DIAGNOSTIK OTOMATIS: Healthcheck Node</span>
                                                <span className="text-[10px] text-secondary font-semibold">T = +0.95s</span>
                                            </div>
                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                Port 443 terbuka, Service PHP-FPM antrean tinggi. AI merekomendasikan restart pool worker secara otomatis.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-primary">
                                        <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">done_all</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-on-surface">PEMULIHAN KONEKSI: Normal</span>
                                                <span className="text-[10px] text-primary font-semibold">T = +1.80s</span>
                                            </div>
                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                Latency stabil kembali 24ms. Status tercatat pada laporan SLA Uptime harian.
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {simScenario === 'ssl' && (
                                <>
                                    {/* Scenario 3: SSL Expiry & TLS Degradation */}
                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-secondary">
                                        <span className="material-symbols-outlined text-secondary text-[22px] mt-0.5">lock_clock</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-on-surface">PERINGATAN SSL: Handshake Kedaluwarsa Segera</span>
                                                <span className="text-[10px] text-secondary font-semibold">T = +0.00s</span>
                                            </div>
                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                Target: <span className="text-on-surface font-semibold">api.service-cloud.id</span> • Sertifikat berakhir dalam 48 jam.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-secondary">
                                        <span className="material-symbols-outlined text-secondary text-[22px] mt-0.5">sync_saved_locally</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-on-surface">AUTO-RENEWAL PROVISIONING: ACME Challenge</span>
                                                <span className="text-[10px] text-secondary font-semibold">T = +1.40s</span>
                                            </div>
                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                Penerbitan kunci baru RSA 4096-bit berhasil diautentikasi tanpa downtime koneksi API.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-surface-container/70 border border-surface-container-highest flex items-start gap-4 border-l-4 border-l-primary">
                                        <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">verified_user</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-on-surface">SERTIFIKASI DIPERBARUI: Valid 90 Hari</span>
                                                <span className="text-[10px] text-primary font-semibold">T = +2.10s</span>
                                            </div>
                                            <div className="text-on-surface-variant text-[11px] mt-1">
                                                Cipher suite TLS 1.3 terverifikasi aman. Skor keamanan SSL kembali Grade A+.
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Bottom Summary Status Badge */}
                        <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-['JetBrains_Mono']">
                            <div className="flex items-center gap-2 text-primary">
                                <span className="material-symbols-outlined text-[18px]">verified</span>
                                <span>
                                    Durasi Mitigasi:{' '}
                                    {simScenario === 'defacement' ? '2.45' : simScenario === 'downtime' ? '1.80' : '2.10'}s (Zero Downtime)
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                                <span>Klik tab skenario di atas untuk menguji simulasi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
