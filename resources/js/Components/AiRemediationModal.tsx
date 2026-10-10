import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from '@/Components/DynamicToast';

export interface AiRemediationModalProps {
    show: boolean;
    onClose: () => void;
    incident: any;
    onResolved?: () => void;
}

export default function AiRemediationModal({ show, onClose, incident, onResolved }: AiRemediationModalProps) {
    const [extraContext, setExtraContext] = useState('');
    const [selectedModel, setSelectedModel] = useState('combo-maut');
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const availableModels = [
        { id: 'combo-maut', label: 'combo-maut', desc: '9router Combo Maut Multi-Engine Intelligence' },
        { id: 'classai', label: 'classai', desc: 'ClassAI High Speed Engine Model' },
        { id: 'dattio', label: 'dattio', desc: 'Dattio Advanced Intelligence Model' }
    ];

    useEffect(() => {
        if (show && incident?.id) {
            fetchHistory();
        } else {
            setConversations([]);
            setExtraContext('');
        }
    }, [show, incident?.id]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await axios.get(route('incidents.ai-history', incident.id));
            if (res.data && res.data.success) {
                setConversations(res.data.conversations || []);
            }
        } catch (err) {
            console.error('Failed to load AI conversation history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    if (!show || !incident) return null;

    const handleGenerate = async () => {
        const promptText = extraContext.trim();
        setIsGenerating(true);
        try {
            const res = await axios.post(route('incidents.ai-remediation'), {
                incident_id: incident.id,
                extra_context: promptText,
                model: selectedModel,
                title: incident.title,
                site_name: incident.site_name || incident.site?.name,
                site_url: incident.site_url || incident.site?.url,
                severity: incident.severity,
                type: incident.type,
                description: incident.description,
            });

            if (res.data && res.data.success) {
                setConversations(res.data.conversations || []);
                setExtraContext('');
                toast.success('Respon AI Diterima', 'Panduan perbaikan baru berhasil ditambahkan.');
            }
        } catch (err) {
            toast.error('Gagal', 'Terjadi kesalahan saat memicu AI Remediation.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleMarkResolved = () => {
        router.patch(route('incidents.update', incident.id), { status: 'resolved' }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Insiden Selesai', `Status insiden "${incident.title}" berhasil ditandai sebagai selesai.`);
                if (onResolved) {
                    onResolved();
                }
                onClose();
            }
        });
    };

    const handleCopyCode = (codeText: string, idxKey: string) => {
        navigator.clipboard.writeText(codeText);
        setCopiedIndex(idxKey);
        toast.info('Tersalin', 'Kode perintah berhasil disalin ke clipboard.');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const renderMarkdownContent = (content: string, convId: string | number) => {
        if (!content) return null;

        const lines = content.split('\n');
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeBuffer: string[] = [];
        let codeLang = '';

        lines.forEach((line, index) => {
            if (line.startsWith('```')) {
                if (inCodeBlock) {
                    const codeStr = codeBuffer.join('\n');
                    const codeKey = `${convId}-code-${index}`;
                    elements.push(
                        <div key={codeKey} className="my-3 position-relative" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(15,42,63,0.15)', background: '#0f2a3f', color: '#e2e8f0' }}>
                            <div className="d-flex justify-content-between align-items-center px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.08)', fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                                <span>{codeLang || 'bash / shell'}</span>
                                <button 
                                    onClick={() => handleCopyCode(codeStr, codeKey)}
                                    className="btn btn-sm text-light border-0 py-0 px-2 d-flex align-items-center gap-1"
                                    style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.1)' }}
                                >
                                    <i className={`bi ${copiedIndex === codeKey ? 'bi-check2 text-teal' : 'bi-clipboard'}`}></i>
                                    <span>{copiedIndex === codeKey ? 'Tersalin' : 'Salin Perintah'}</span>
                                </button>
                            </div>
                            <pre className="p-3 m-0" style={{ fontSize: '0.83rem', fontFamily: 'Fira Code, monospace', overflowX: 'auto', lineHeight: '1.5' }}>
                                <code>{codeStr}</code>
                            </pre>
                        </div>
                    );
                    codeBuffer = [];
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                    codeLang = line.replace('```', '').trim();
                }
                return;
            }

            if (inCodeBlock) {
                codeBuffer.push(line);
                return;
            }

            if (line.startsWith('### ')) {
                elements.push(<h4 key={index} className="mt-3 mb-2 fw-bold text-dark" style={{ fontSize: '1.02rem', color: 'var(--ink)' }}>{line.replace('### ', '')}</h4>);
            } else if (line.startsWith('#### ')) {
                elements.push(<h5 key={index} className="mt-2.5 mb-1.5 fw-semibold" style={{ fontSize: '0.92rem', color: '#0ea5a3' }}>{line.replace('#### ', '')}</h5>);
            } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
                const isChecked = line.startsWith('- [x] ');
                elements.push(
                    <div key={index} className="d-flex align-items-center gap-2 my-1" style={{ fontSize: '0.86rem' }}>
                        <i className={`bi ${isChecked ? 'bi-check-square-fill text-teal' : 'bi-square text-muted'}`}></i>
                        <span>{line.replace(/- \[[ x\]] /, '')}</span>
                    </div>
                );
            } else if (line.startsWith('- ')) {
                elements.push(
                    <li key={index} className="ms-3 my-1" style={{ fontSize: '0.86rem', color: 'var(--ink-dark)' }}>
                        {line.replace('- ', '')}
                    </li>
                );
            } else if (line.trim() === '---') {
                elements.push(<hr key={index} className="my-3 opacity-25" />);
            } else if (line.trim() !== '') {
                elements.push(<p key={index} className="mb-2" style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--ink)' }}>{line}</p>);
            }
        });

        return elements;
    };

    return (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(15,42,63,0.5)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-xxl modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '1100px' }}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    
                    {/* Modal Header */}
                    <div className="modal-header border-0 px-4 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)', color: '#fff' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                <i className="bi bi-robot"></i>
                            </div>
                            <div>
                                <h5 className="modal-title fw-bold m-0" style={{ fontSize: '1.25rem', fontFamily: 'Poppins, sans-serif' }}>
                                    AI Security Remediation Assistant
                                </h5>
                                <p className="m-0 opacity-75" style={{ fontSize: '0.82rem' }}>
                                    Diskusi & Riwayat Percakapan Solusi Penanganan Insiden Keamanan.
                                </p>
                            </div>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    {/* Modal Body */}
                    <div className="modal-body p-4" style={{ background: '#f8fafc', maxHeight: '72vh', overflowY: 'auto' }}>
                        
                        {/* Incident Context Banner */}
                        <div className="glass-card p-3 mb-4" style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid rgba(14,165,163,0.2)' }}>
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                <span className="fw-bold" style={{ fontSize: '1rem', color: 'var(--ink)' }}>{incident.title}</span>
                                <span className="badge" style={{ background: incident.severity === 'critical' ? '#c8332a' : '#ff7a6e', color: '#fff', fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '20px' }}>
                                    Urgensi: {incident.severity?.toUpperCase()}
                                </span>
                            </div>
                            <div className="d-flex gap-3 text-muted flex-wrap mb-2" style={{ fontSize: '0.8rem' }}>
                                <span><i className="bi bi-globe2 me-1"></i> {incident.site_name || incident.site?.name || 'Situs Terpantau'}</span>
                                <span><i className="bi bi-link-45deg me-1"></i> {incident.site_url || incident.site?.url || '-'}</span>
                                <span><i className="bi bi-clock me-1"></i> {incident.detected_at_human || 'Baru Saja'}</span>
                            </div>
                            {incident.description && (
                                <p className="mb-0 text-secondary" style={{ fontSize: '0.82rem', background: 'rgba(15,42,63,0.03)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                                    {incident.description}
                                </p>
                            )}
                        </div>

                        {/* Model Selector Card */}
                        <div className="glass-card p-3 mb-4" style={{ background: '#fff', borderRadius: '16px' }}>
                            <label className="form-label fw-semibold mb-2" style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
                                <i className="bi bi-cpu me-1 text-teal" style={{ color: 'var(--teal-1)' }}></i>
                                Pilih Engine AI Model:
                            </label>
                            <div className="row g-2">
                                {availableModels.map((m) => {
                                    const isSelected = selectedModel === m.id;
                                    return (
                                        <div className="col-12 col-md-4" key={m.id}>
                                            <div 
                                                onClick={() => setSelectedModel(m.id)}
                                                className="p-3 d-flex align-items-center justify-content-between h-100"
                                                style={{
                                                    borderRadius: '12px',
                                                    border: isSelected ? '2px solid var(--teal-1)' : '1px solid var(--line)',
                                                    background: isSelected ? 'rgba(14,165,163,0.06)' : 'rgba(255,255,255,0.8)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div className="d-flex align-items-center gap-2.5">
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '10px',
                                                        background: isSelected ? 'linear-gradient(135deg, var(--teal-1), var(--teal-2))' : '#f1f5f9',
                                                        color: isSelected ? '#fff' : '#64748b',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: '0.9rem',
                                                        flexShrink: 0
                                                    }}>
                                                        <i className="bi bi-layers-fill"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold" style={{ fontSize: '0.85rem', color: 'var(--ink-dark)' }}>{m.label}</div>
                                                        <div style={{ fontSize: '0.73rem', color: 'var(--ink-faint)' }}>{m.desc}</div>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="radio" 
                                                    name="ai_model" 
                                                    checked={isSelected} 
                                                    onChange={() => setSelectedModel(m.id)}
                                                    style={{ accentColor: 'var(--teal-1)', width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Conversation Chat History Stream */}
                        <div className="mb-4">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--ink)', fontSize: '0.95rem' }}>
                                <i className="bi bi-chat-left-text text-teal" style={{ color: 'var(--teal-1)' }}></i>
                                Riwayat Percakapan & Rekomendasi Solusi ({conversations.length})
                            </h6>

                            {isLoadingHistory ? (
                                <div className="text-center py-4 glass-card" style={{ background: '#fff', borderRadius: '16px' }}>
                                    <div className="spinner-border spinner-border-sm text-teal me-2" role="status"></div>
                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>Memuat riwayat percakapan...</span>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-4 p-3 glass-card" style={{ background: '#fff', borderRadius: '16px', border: '1px dashed var(--line)' }}>
                                    <i className="bi bi-chat-square-dots text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                        Belum ada riwayat percakapan untuk insiden ini. Klik <strong>Generate Solusi AI</strong> di bawah untuk memulai analisis.
                                    </p>
                                </div>
                            ) : (
                                conversations.map((conv, idx) => (
                                    <div key={conv.id || idx} className="mb-4">
                                        {/* User Bubble */}
                                        <div className="d-flex justify-content-end mb-2">
                                            <div style={{ maxWidth: '85%', background: 'linear-gradient(135deg, #0ea5a3, #0b8482)', color: '#fff', borderRadius: '16px 16px 2px 16px', padding: '0.75rem 1.1rem', boxShadow: '0 4px 12px rgba(14,165,163,0.15)' }}>
                                                <div className="d-flex align-items-center gap-1.5 mb-1" style={{ fontSize: '0.73rem', opacity: 0.85, fontWeight: 600 }}>
                                                    <i className="bi bi-person-circle"></i>
                                                    <span>Admin / Tim Keamanan</span>
                                                </div>
                                                <div style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                                                    {conv.user_message}
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Assistant Bubble */}
                                        <div className="d-flex justify-content-start">
                                            <div className="w-100 glass-card p-4" style={{ background: '#fff', borderRadius: '16px 16px 16px 2px', border: '1.5px solid rgba(14,165,163,0.25)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge" style={{ background: 'rgba(14,165,163,0.12)', color: 'var(--teal-1)', border: '1px solid rgba(14,165,163,0.3)', padding: '0.4rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem' }}>
                                                            <i className="bi bi-robot me-1"></i> {conv.provider || '9router AI'} ({conv.model_used || selectedModel})
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
                                                        <i className="bi bi-clock me-1"></i> {conv.created_at ? new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Baru Saja'}
                                                    </span>
                                                </div>

                                                <div className="ai-markdown-output">
                                                    {renderMarkdownContent(conv.ai_response, conv.id || idx)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {isGenerating && (
                                <div className="glass-card my-3 p-4 text-center position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ffffff, #f0fdfa)', borderRadius: '20px', border: '1.5px solid rgba(14,165,163,0.35)', boxShadow: '0 10px 30px -10px rgba(14,165,163,0.2)' }}>
                                    
                                    {/* Animated Glowing Ring & AI Pulsing Icon */}
                                    <div className="d-flex justify-content-center mb-3">
                                        <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px' }}>
                                            <div className="spinner-grow position-absolute w-100 h-100 text-teal opacity-25" style={{ color: 'var(--teal-1)' }} role="status"></div>
                                            <div style={{
                                                width: '58px', height: '58px', borderRadius: '18px',
                                                background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)',
                                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.8rem', boxShadow: '0 8px 20px rgba(14,165,163,0.3)',
                                                zIndex: 2
                                            }}>
                                                <i className="bi bi-cpu-fill spin-slow"></i>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Animated Thinking Text */}
                                    <h6 className="fw-bold mb-1" style={{ fontSize: '1rem', color: 'var(--ink-dark)' }}>
                                        Pakar AI SIGAP ({selectedModel}) Sedang Menganalisis...
                                    </h6>
                                    <p className="text-teal fw-medium mb-3" style={{ fontSize: '0.83rem', color: 'var(--teal-1)' }}>
                                        <i className="bi bi-shield-lock me-1"></i> Memproses celah keamanan & merumuskan perintah shell perbaikan
                                    </p>

                                    {/* Step Badges */}
                                    <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
                                        <span className="badge px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5" style={{ background: 'rgba(14,165,163,0.12)', color: '#0ea5a3', border: '1px solid rgba(14,165,163,0.3)', fontSize: '0.75rem' }}>
                                            <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px' }}></span> 1. Inspect Payload
                                        </span>
                                        <span className="badge px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.75rem' }}>
                                            <span className="spinner-grow spinner-grow-sm" style={{ width: '10px', height: '10px' }}></span> 2. Synthesize Fixes
                                        </span>
                                        <span className="badge px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.75rem' }}>
                                            <i className="bi bi-code-slash"></i> 3. Generate Shell Script
                                        </span>
                                    </div>

                                    {/* Shimmer Progress Line */}
                                    <div className="progress mx-auto" style={{ height: '5px', width: '60%', borderRadius: '10px', background: 'rgba(14,165,163,0.15)', overflow: 'hidden' }}>
                                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-teal w-100" style={{ background: 'linear-gradient(90deg, #0ea5a3, #6366f1)' }}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Box for Next Question / Context */}
                        <div className="glass-card p-3" style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid var(--line)' }}>
                            <label className="form-label fw-semibold" style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
                                <i className="bi bi-chat-quote me-1 text-teal" style={{ color: 'var(--teal-1)' }}></i>
                                Masukkan Pertanyaan / Catatan Tambahan Server & CMS:
                            </label>
                            <textarea 
                                className="form-control"
                                rows={2}
                                placeholder="Contoh: Menggunakan Nginx 1.24 + CMS WordPress 6.4. Bagaimana cara menutup celah upload skrip ini...?"
                                value={extraContext}
                                onChange={(e) => setExtraContext(e.target.value)}
                                style={{ borderRadius: '12px', fontSize: '0.84rem', border: '1.5px solid var(--line)', background: 'rgba(255,255,255,0.9)' }}
                            ></textarea>
                            
                            <div className="d-flex justify-content-end mt-3">
                                <button 
                                    className="btn d-flex align-items-center gap-2 text-white shadow-sm"
                                    style={{ background: 'linear-gradient(135deg, var(--teal-1), var(--blue-1))', borderRadius: '12px', padding: '0.55rem 1.4rem', fontSize: '0.85rem', fontWeight: 600 }}
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Mengirim ke AI ({selectedModel})...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send-fill" style={{ fontSize: '0.9rem' }}></i>
                                            <span>{conversations.length === 0 ? 'Generate Solusi AI' : 'Kirim Pertanyaan Lanjutan'} ({selectedModel})</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="modal-footer border-top px-4 py-3 bg-white d-flex justify-content-between align-items-center">
                        <button type="button" className="btn btn-light" onClick={onClose} style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500 }}>
                            Tutup
                        </button>

                        <button 
                            type="button" 
                            className="btn btn-success d-flex align-items-center gap-1.5"
                            style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, background: '#0ea5a3', borderColor: '#0ea5a3' }}
                            onClick={handleMarkResolved}
                        >
                            <i className="bi bi-check2-circle"></i>
                            <span>Tandai Insiden Selesai</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
