import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../../../css/report-print.css';

interface OfficialScorecardPrintProps {
    leaderboard: any[];
    summary: any;
    filters: any;
}

export default function OfficialScorecardPrint({ leaderboard = [], summary = {}, filters = {} }: OfficialScorecardPrintProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || typeof document === 'undefined') return null;

    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    return createPortal(
        <div id="print-root">
            <div id="print-scorecard-document" className="sigap-print-document">
                {/* Official Kop Surat */}
                <div className="print-kop-surat">
                    <p className="print-kop-line-1">PEMERINTAH KOTA PEKALONGAN</p>
                    <p className="print-kop-line-2">DINAS KOMUNIKASI DAN INFORMATIKA</p>
                    <p className="print-kop-address">
                        Jl. Mataram No. 1, Kota Pekalongan, Jawa Tengah 51111 | Telp: (0285) 421093 | Email: diskominfo@pekalongankota.go.id
                    </p>
                </div>
                <div className="print-kop-divider"></div>

                {/* Title */}
                <div className="print-title-box mb-3">
                    <h5 className="print-title">
                        LAPORAN RESMI RAPOR KEMATANGAN & KEPATUHAN MUTU WEBSITE OPD
                    </h5>
                    <p className="print-subtitle">
                        Standar Evaluasi SPBE, Audit Keamanan Informasi BSSN, dan Ketersediaan Layanan Publik Daerah
                    </p>
                    <p className="print-meta-date">Tanggal Penerbitan: {todayFormatted}</p>
                </div>

                {/* Executive Summary Stats Table */}
                <table className="table table-bordered mb-4" style={{ fontSize: '9pt' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '25%', background: '#f8fafc', fontWeight: 'bold' }}>Rata-rata Indeks Mutu</td>
                            <td style={{ width: '25%' }}>{summary.avg_score ?? 0} / 100 Poin</td>
                            <td style={{ width: '25%', background: '#f8fafc', fontWeight: 'bold' }}>Tingkat Kepatuhan SPBE</td>
                            <td style={{ width: '25%' }}>{summary.compliance_percentage ?? 100}%</td>
                        </tr>
                        <tr>
                            <td style={{ background: '#f8fafc', fontWeight: 'bold' }}>Total Situs Dievaluasi</td>
                            <td>{summary.total_sites ?? 0} Domain Layanan</td>
                            <td style={{ background: '#f8fafc', fontWeight: 'bold' }}>Distribusi Grade Mutu</td>
                            <td>
                                A+: {summary.grade_counts?.A_plus ?? 0} | 
                                A: {summary.grade_counts?.A ?? 0} | 
                                B: {summary.grade_counts?.B ?? 0} | 
                                C: {summary.grade_counts?.C ?? 0} | 
                                D: {summary.grade_counts?.D ?? 0}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Leaderboard Table */}
                <table className="table table-bordered print-data-table" style={{ fontSize: '8.5pt' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                            <th style={{ width: '35px', textAlign: 'center' }}>No</th>
                            <th>Nama Situs / Instansi OPD</th>
                            <th>URL Domain</th>
                            <th>Kluster OPD</th>
                            <th style={{ width: '60px', textAlign: 'center' }}>Grade</th>
                            <th style={{ width: '70px', textAlign: 'center' }}>Total Skor</th>
                            <th style={{ width: '75px', textAlign: 'center' }}>Uptime 30d</th>
                            <th style={{ width: '75px', textAlign: 'center' }}>SSL/Port</th>
                            <th style={{ width: '75px', textAlign: 'center' }}>Bebas Insiden</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((item, index) => (
                            <tr key={item.id}>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                                <td style={{ fontWeight: 600 }}>{item.name}</td>
                                <td>{item.url}</td>
                                <td>{item.category}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.grade}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.total_score}</td>
                                <td style={{ textAlign: 'center' }}>{item.breakdown.uptime.score} / 40</td>
                                <td style={{ textAlign: 'center' }}>{item.breakdown.security.score} / 30</td>
                                <td style={{ textAlign: 'center' }}>{item.breakdown.incidents.score} / 30</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Signature Block */}
                <div className="print-signature-section mt-5" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="print-sign-box" style={{ width: '40%', textAlign: 'center' }}>
                        <p>Mengetahui,</p>
                        <p style={{ fontWeight: 'bold' }}>Plt. Kepala Dinas Komunikasi dan Informatika</p>
                        <div style={{ height: '60px' }}></div>
                        <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Dr. Ir. H. SUDARMANTO, M.Kom.</p>
                        <p style={{ fontSize: '8.5pt', margin: 0 }}>NIP. 19740512 200003 1 004</p>
                    </div>

                    <div className="print-sign-box" style={{ width: '40%', textAlign: 'center' }}>
                        <p>Pekalongan, {todayFormatted}</p>
                        <p style={{ fontWeight: 'bold' }}>Kepala Bidang Penyelenggaraan E-Government & CSIRT</p>
                        <div style={{ height: '60px' }}></div>
                        <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>BAGUS KURNIAWAN, S.T., M.Eng.</p>
                        <p style={{ fontSize: '8.5pt', margin: 0 }}>NIP. 19820815 200801 1 012</p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
