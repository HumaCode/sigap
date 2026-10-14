import React from 'react';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import Tooltip from '@/Components/Tooltip';
import ColumnInfoTooltip from '@/Components/ColumnInfoTooltip';

interface SiteTableProps {
    sites: {
        data: any[];
        meta?: any;
        links?: any;
    };
    liveRpm: { [key: string]: number };
    pulseRpm: { [key: string]: boolean };
    pingingSiteId: string | null;
    can?: {
        create?: boolean;
        update?: boolean;
        delete?: boolean;
        check?: boolean;
    };
    onPageChange?: (page: number) => void;
    onPing: (site: any) => void;
    onViewDetail: (site: any) => void;
    onEdit: (site: any) => void;
    onDelete: (site: any) => void;
    onAddSite: () => void;
}

export default function SiteTable({
    sites,
    liveRpm,
    pulseRpm,
    pingingSiteId,
    can = { create: true, update: true, delete: true, check: true },
    onPageChange,
    onPing,
    onViewDetail,
    onEdit,
    onDelete,
    onAddSite,
}: SiteTableProps) {
    const getSiteFavicon = (category: string) => {
        switch (category) {
            case 'PPID':
                return (
                    <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #ff7a6e, #ff9d6e)' }}>
                        <i className="bi bi-file-earmark-text"></i>
                    </div>
                );
            case 'SPBE':
                return (
                    <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #8b7bf0, #a78bfa)' }}>
                        <i className="bi bi-diagram-3"></i>
                    </div>
                );
            case 'Portal Utama':
                return (
                    <div className="site-favicon">
                        <i className="bi bi-building"></i>
                    </div>
                );
            default:
                return (
                    <div className="site-favicon" style={{ background: 'linear-gradient(135deg, #ffb648, #ff9d6e)' }}>
                        <i className="bi bi-globe2"></i>
                    </div>
                );
        }
    };

    const getStatusChip = (status: string, isActive?: boolean) => {
        if (isActive === false || status === 'paused') {
            return <span className="status-chip chip-paused"><span className="chip-dot"></span>Nonaktif</span>;
        }
        switch (status) {
            case 'up':
                return <span className="status-chip chip-up"><span className="chip-dot"></span>Online</span>;
            case 'down':
                return <span className="status-chip chip-down"><span className="chip-dot"></span>Down</span>;
            case 'warn':
                return <span className="status-chip chip-warn"><span className="chip-dot"></span>Lambat</span>;
            case 'paused':
                return <span className="status-chip chip-paused"><span className="chip-dot"></span>Nonaktif</span>;
            default:
                return <span className="status-chip chip-up"><span className="chip-dot"></span>Online</span>;
        }
    };

    const renderTrafficTag = (site: any) => {
        const isDown = site.status === 'down';
        const currentRpm = isDown ? 0 : (liveRpm[site.id] ?? site.requests_per_minute ?? (site.status === 'warn' ? 1450 : 180));
        const formattedRpm = currentRpm.toLocaleString('id-ID') + ' req/mnt';
        const isPulsing = pulseRpm[site.id];

        if (isDown) {
            return (
                <span 
                    className="status-chip" 
                    style={{ 
                        background: 'rgba(100,116,139,0.1)', 
                        color: '#64748b', 
                        fontWeight: 600, 
                        border: '1px solid rgba(100,116,139,0.2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem'
                    }}
                    title="Situs dalam kondisi Offline / Down (Tidak melayani trafik)"
                >
                    <i className="bi bi-x-circle" style={{ color: '#ef4444' }}></i>
                    0 req/mnt (Offline)
                </span>
            );
        }

        if (currentRpm > 3000) {
            return (
                <span 
                    className="status-chip" 
                    style={{ 
                        background: isPulsing ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.12)', 
                        color: '#dc2626', 
                        fontWeight: 700, 
                        border: '1px solid rgba(239,68,68,0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        transition: 'all 0.3s ease-in-out',
                        transform: isPulsing ? 'scale(1.04)' : 'scale(1)',
                        boxShadow: isPulsing ? '0 0 12px rgba(239,68,68,0.25)' : 'none'
                    }}
                    title="Trafik sangat ekstrem! Dicurigai Surge / Serangan Flood"
                >
                    <i className="bi bi-lightning-charge-fill" style={{ color: '#ef4444' }}></i>
                    {formattedRpm} (Bahaya)
                </span>
            );
        }

        if (currentRpm > 1200 || site.status === 'warn') {
            return (
                <span 
                    className="status-chip" 
                    style={{ 
                        background: isPulsing ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.12)', 
                        color: '#b45309', 
                        fontWeight: 700, 
                        border: '1px solid rgba(245,158,11,0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        transition: 'all 0.3s ease-in-out',
                        transform: isPulsing ? 'scale(1.04)' : 'scale(1)',
                        boxShadow: isPulsing ? '0 0 12px rgba(245,158,11,0.25)' : 'none'
                    }}
                    title="Trafik tinggi (Beban Padat/Waspada)"
                >
                    <i className="bi bi-fire" style={{ color: '#f59e0b' }}></i>
                    {formattedRpm} (Padat)
                </span>
            );
        }

        if (currentRpm > 450) {
            return (
                <span 
                    className="status-chip" 
                    style={{ 
                        background: isPulsing ? 'rgba(2,132,199,0.2)' : 'rgba(2,132,199,0.12)', 
                        color: '#0284c7', 
                        fontWeight: 600,
                        border: '1px solid rgba(2,132,199,0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        transition: 'all 0.3s ease-in-out',
                        transform: isPulsing ? 'scale(1.04)' : 'scale(1)',
                        boxShadow: isPulsing ? '0 0 10px rgba(2,132,199,0.2)' : 'none'
                    }}
                >
                    <i className="bi bi-activity" style={{ color: '#0284c7' }}></i>
                    {formattedRpm} (Sedang)
                </span>
            );
        }

        return (
            <span 
                className="status-chip" 
                style={{ 
                    background: isPulsing ? 'rgba(14,165,163,0.2)' : 'rgba(14,165,163,0.08)', 
                    color: 'var(--teal-1)', 
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.65rem',
                    transition: 'all 0.3s ease-in-out',
                    transform: isPulsing ? 'scale(1.04)' : 'scale(1)',
                    boxShadow: isPulsing ? '0 0 10px rgba(14,165,163,0.2)' : 'none'
                }}
            >
                <i className="bi bi-speedometer2" style={{ color: 'var(--teal-1)' }}></i>
                {formattedRpm}
            </span>
        );
    };

    return (
        <>
            {/* Desktop table */}
            <div className="table-desktop" style={{ overflowX: 'auto' }}>
                <table className="table-modern">
                    <thead>
                        <tr>
                            <th>Situs</th>
                            <th>Kategori</th>
                            <th>Status</th>
                            <th>
                                <span className="d-inline-flex align-items-center">
                                    <span>Trafik / Request</span>
                                    <span className="badge ms-1 text-white" style={{ background: '#ef4444', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px', verticalAlign: 'middle', letterSpacing: '0.5px' }}>
                                        <i className="bi bi-broadcast me-1"></i>REALTIME
                                    </span>
                                    <ColumnInfoTooltip
                                        title="Trafik / Request (Realtime)"
                                        badgeText="METRIK TELEMETRI"
                                        icon="bi-speedometer2"
                                        functionDescription={
                                            <>
                                                Mengukur estimasi volume permintaan HTTP yang sedang ditangani oleh web server setiap menitnya (<strong>Requests per Minute / RPM</strong>). Kolom ini berfungsi sebagai <em>radar deteksi dini</em> untuk memantau lonjakan pengunjung (<em>traffic surge</em>) atau potensi serangan <strong>DDoS / HTTP Flood</strong> yang dapat melumpuhkan server.
                                            </>
                                        }
                                        sourceDescription={
                                            <>
                                                Nilai RPM dihitung otomatis oleh sensor pemantau SIGAP saat siklus pemeriksaan kesehatan (<em>health check</em>) berlangsung. Ketika situs dalam kondisi <strong>Offline/Down</strong>, nilai otomatis bernilai <strong>0 req/mnt</strong>. Saat online, data disinkronkan secara berkala dengan animasi denyut (<em>pulse</em>) aktif.
                                            </>
                                        }
                                        formula="RPM = Total Request HTTP Masuk / Menit"
                                        indicators={[
                                            { badge: 'Normal', label: '< 450 req/mnt', color: 'teal', desc: 'Lalu lintas pengunjung wajar' },
                                            { badge: 'Sedang', label: '450 - 1.200 req/mnt', color: 'blue', desc: 'Aktivitas pengguna meningkat' },
                                            { badge: 'Padat', label: '1.200 - 3.000 req/mnt', color: 'amber', desc: 'Beban server tinggi / waspada' },
                                            { badge: 'Bahaya', label: '> 3.000 req/mnt', color: 'danger', desc: 'Lonjakan ekstrim / Flood suspect' },
                                        ]}
                                        notes="Data diperbarui secara live dengan denyut telemetri real-time."
                                    />
                                </span>
                            </th>
                            <th>
                                <span className="d-inline-flex align-items-center">
                                    <span>Uptime 30 Hari</span>
                                    <ColumnInfoTooltip
                                        title="Uptime 30 Hari"
                                        badgeText="STANDAR KETERSEDIAAN SLA"
                                        icon="bi-activity"
                                        functionDescription={
                                            <>
                                                Menunjukkan persentase tingkat ketersediaan (<strong>Availability SLA</strong>) situs web publik selama 30 hari ke belakang. Kolom ini menjadi tolok ukur keandalan layanan digital pemerintah (SPBE) untuk memastikan masyarakat dapat mengakses portal tanpa kendala situs mati (<em>downtime</em>).
                                            </>
                                        }
                                        sourceDescription={
                                            <>
                                                Dihitung otomatis dari agregasi riwayat audit probe bot pada tabel <code>detection_logs</code> (kategori <code>uptime</code>) dalam rentang 30 hari terakhir. Setiap pemeriksaan probe yang menghasilkan status sukses (HTTP 200/Redirect) dicatat sebagai <em>Success Check</em>.
                                            </>
                                        }
                                        formula="Uptime (%) = (Pemeriksaan Sukses / Total Pemeriksaan 30 Hari) × 100%"
                                        indicators={[
                                            { badge: 'Optimal', label: '≥ 99.9%', color: 'teal', desc: 'Standar emas keandalan SPBE' },
                                            { badge: 'Waspada', label: '98.0% - 99.8%', color: 'amber', desc: 'Terjadi beberapa kali insiden down' },
                                            { badge: 'Kritis', label: '< 98.0%', color: 'danger', desc: 'Sering mati / butuh investigasi' },
                                        ]}
                                        notes="Frekuensi probe audit bergantung pada pengaturan Interval Cek situs."
                                    />
                                </span>
                            </th>
                            <th>Interval Cek</th>
                            <th>PIC</th>
                            <th style={{ textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!sites.data || sites.data.length === 0 ? (
                            <EmptyState 
                                icon="bi-globe"
                                title="Belum Ada Situs"
                                description="Daftar situs yang dipantau masih kosong. Daftarkan situs Anda untuk mulai memantau uptime secara real-time."
                                actionLabel={can?.create ? "Daftarkan Situs" : undefined}
                                onAction={can?.create ? onAddSite : undefined}
                                colSpan={8}
                            />
                        ) : sites.data.map((site: any) => (
                            <tr key={site.id}>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        {getSiteFavicon(site.category)}
                                        <div>
                                            <p className="site-name">{site.name}</p>
                                            <p className="site-url">{site.url}</p>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="category-tag">{site.category}</span></td>
                                <td>{getStatusChip(site.status, site.is_active)}</td>
                                <td>{renderTrafficTag(site)}</td>
                                <td>{site.uptime}%</td>
                                <td>{site.check_interval} menit</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>{site.pic_name || '-'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="d-inline-flex align-items-center gap-1">
                                        {can?.check && (
                                            <Tooltip 
                                                title={pingingSiteId === site.id ? "Memeriksa..." : "Ping Sekarang"} 
                                                description="Uji respon HTTP & uptime situs"
                                                variant="teal"
                                            >
                                                <button
                                                    className="action-btn info"
                                                    onClick={() => onPing(site)}
                                                    disabled={pingingSiteId === site.id}
                                                >
                                                    <i className={`bi bi-arrow-repeat ${pingingSiteId === site.id ? 'spin-icon' : ''}`}></i>
                                                </button>
                                            </Tooltip>
                                        )}

                                        <Tooltip 
                                            title="Lihat Detail" 
                                            description="Informasi & riwayat pemantauan"
                                            variant="teal"
                                        >
                                            <button className="action-btn info" onClick={() => onViewDetail(site)}>
                                                <i className="bi bi-eye"></i>
                                            </button>
                                        </Tooltip>

                                        {site.ssh_host && (
                                            <Tooltip 
                                                title="Investigasi Server" 
                                                description="Pindai webshell, rollback, & log forensik"
                                                variant="teal"
                                            >
                                                <a 
                                                    href={route('server-investigations.index', { site_id: site.id })}
                                                    className="action-btn"
                                                    style={{ color: '#0ea5a3', borderColor: 'rgba(14, 165, 163, 0.35)', background: 'rgba(14, 165, 163, 0.08)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <i className="bi bi-terminal-split"></i>
                                                </a>
                                            </Tooltip>
                                        )}

                                        {can?.update && (
                                            <Tooltip 
                                                title="Ubah Data" 
                                                description="Edit data & konfigurasi situs"
                                                variant="blue"
                                            >
                                                <button className="action-btn edit" onClick={() => onEdit(site)}>
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                            </Tooltip>
                                        )}

                                        {can?.delete && (
                                            <Tooltip 
                                                title="Hapus Situs" 
                                                description="Hapus pemantauan & riwayat situs"
                                                variant="danger"
                                            >
                                                <button 
                                                    className="action-btn danger" 
                                                    onClick={() => onDelete(site)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </Tooltip>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile card list */}
            <div className="mobile-cards">
                {!sites.data || sites.data.length === 0 ? (
                    <EmptyState 
                        icon="bi-globe"
                        title="Belum Ada Situs"
                        description="Daftar situs yang dipantau masih kosong. Daftarkan situs Anda untuk mulai memantau uptime secara real-time."
                        actionLabel={can?.create ? "Daftarkan Situs" : undefined}
                        onAction={can?.create ? onAddSite : undefined}
                    />
                ) : sites.data.map((site: any) => (
                    <div className="site-card-mobile" key={site.id}>
                        <div className="top-row">
                            {getSiteFavicon(site.category)}
                            <div className="flex-grow-1 min-w-0">
                                <p className="site-name">{site.name}</p>
                                <p className="site-url">{site.url}</p>
                            </div>
                            {getStatusChip(site.status, site.is_active)}
                        </div>
                        <div className="meta-row">
                            <span><span className="category-tag">{site.category}</span></span>
                            <span>Uptime {site.uptime}%</span>
                        </div>
                        <div className="d-flex justify-content-end align-items-center gap-1 mt-2">
                            {can?.check && (
                                <Tooltip 
                                    title={pingingSiteId === site.id ? "Memeriksa..." : "Ping Sekarang"} 
                                    description="Uji respon HTTP"
                                    variant="teal"
                                >
                                    <button 
                                        className="action-btn info" 
                                        onClick={() => onPing(site)}
                                        disabled={pingingSiteId === site.id}
                                    >
                                        <i className={`bi bi-arrow-repeat ${pingingSiteId === site.id ? 'spin-icon' : ''}`}></i>
                                    </button>
                                </Tooltip>
                            )}

                            <Tooltip 
                                title="Lihat Detail" 
                                description="Informasi situs"
                                variant="teal"
                            >
                                <button className="action-btn info" onClick={() => onViewDetail(site)}>
                                    <i className="bi bi-eye"></i>
                                </button>
                            </Tooltip>

                            {site.ssh_host && (
                                <Tooltip 
                                    title="Investigasi Server" 
                                    description="Pindai webshell & log"
                                    variant="teal"
                                >
                                    <a 
                                        href={route('server-investigations.index', { site_id: site.id })}
                                        className="action-btn"
                                        style={{ color: '#0ea5a3', borderColor: 'rgba(14, 165, 163, 0.35)', background: 'rgba(14, 165, 163, 0.08)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <i className="bi bi-terminal-split"></i>
                                    </a>
                                </Tooltip>
                            )}

                            {can?.update && (
                                <Tooltip 
                                    title="Ubah Data" 
                                    description="Edit data situs"
                                    variant="blue"
                                >
                                    <button className="action-btn edit" onClick={() => onEdit(site)}>
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                </Tooltip>
                            )}

                            {can?.delete && (
                                <Tooltip 
                                    title="Hapus Situs" 
                                    description="Hapus pemantauan"
                                    variant="danger"
                                >
                                    <button 
                                        className="action-btn danger"
                                        onClick={() => onDelete(site)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Reusable Pagination */}
            <Pagination meta={sites.meta} links={sites.links} itemLabel="situs" onPageChange={onPageChange} />
        </>
    );
}
