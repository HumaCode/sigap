import React, { useState, useEffect, useRef, useMemo } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from '@/Components/DynamicToast';

export interface AiRemediationModalProps {
    show: boolean;
    onClose: () => void;
    incident: any;
    onResolved?: () => void;
}

interface ActiveJobState {
    incidentKey: string;
    promptText: string;
    selectedModel: string;
    startedAt: number;
    completed: boolean;
    result?: any;
    error?: any;
    listeners: Set<(job: ActiveJobState) => void>;
}

// Global in-memory job tracker that survives modal mount/unmount
const globalAiJobs = new Map<string, ActiveJobState>();

const getJobKey = (incident: any) => {
    if (!incident) return '';
    return String(incident.id || incident.title || '');
};

export default function AiRemediationModal({ show, onClose, incident, onResolved }: AiRemediationModalProps) {
    const [extraContext, setExtraContext] = useState('');
    const [selectedModel, setSelectedModel] = useState('ag/gemini-3.8-flash');
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [actualIncidentId, setActualIncidentId] = useState<number | string | null>(null);
    const [scanStage, setScanStage] = useState(1);
    const [scanSubtextIndex, setScanSubtextIndex] = useState(0);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const quickPrompts = [
        { label: 'Langkah Bertahap', icon: 'bi-list-ol', text: 'Tolong jelaskan langkah demi langkah perbaikan ini secara terstruktur dan berurutan.' },
        { label: 'Skrip Otomatisasi', icon: 'bi-terminal-fill', text: 'Berikan skrip bash / konfigurasi server lengkap untuk mengatasi insiden ini.' },
        { label: 'Saya Bingung', icon: 'bi-patch-question-fill', text: 'Saya masih awam dan bingung, tolong sederhanakan penjelasannya dengan bahasa yang mudah dipahami.' },
        { label: 'Uji & Verifikasi', icon: 'bi-check-circle-fill', text: 'Bagaimana cara mengecek apakah perbaikan yang saya lakukan sudah berhasil dan aman?' }
    ];

    const handleQuickFill = (promptText: string) => {
        setExtraContext(promptText);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const scanSubtexts = [
        'Membedah struktur HTTP headers & konfigurasi server...',
        'Mencocokkan CVE & OWASP database mitigasi insiden...',
        'Menyusun skrip otomatisasi bash & Nginx hardened block...',
        'Memvalidasi command safety & rollback protection...'
    ];

    useEffect(() => {
        let stageTimer: any;
        let subtextTimer: any;
        if (isGenerating) {
            setScanStage(1);
            setScanSubtextIndex(0);

            stageTimer = setInterval(() => {
                setScanStage((prev) => (prev < 3 ? prev + 1 : 1));
            }, 2400);

            subtextTimer = setInterval(() => {
                setScanSubtextIndex((prev) => (prev + 1) % 4);
            }, 1800);
        }
        return () => {
            clearInterval(stageTimer);
            clearInterval(subtextTimer);
        };
    }, [isGenerating]);

    const [historyLoadStep, setHistoryLoadStep] = useState(1);
    const [historyProgress, setHistoryProgress] = useState(28);
    const [activeTipIndex, setActiveTipIndex] = useState(0);

    const historyTips = [
        'Tips SIGAP: Anda dapat langsung menanyakan mitigasi spesifik server seperti Ubuntu, Nginx, Apache, atau cPanel.',
        'Tips SIGAP: Perintah terminal di dalam respon dapat langsung disalin bersih tanpa karakter "$" yang memicu syntax error.',
        'Tips SIGAP: Klik tombol "Export Laporan" di banner atas untuk mencetak dokumen format resmi Pemkot Pekalongan & Diskominfo.',
        'Tips SIGAP: Gunakan chip prompt cepat di bawah jika Anda memerlukan skrip otomatisasi atau langkah bertahap.'
    ];

    useEffect(() => {
        let stepInterval: any;
        let progressInterval: any;
        let tipInterval: any;

        if (isLoadingHistory) {
            setHistoryLoadStep(1);
            setHistoryProgress(28);

            stepInterval = setInterval(() => {
                setHistoryLoadStep((prev) => (prev < 3 ? prev + 1 : 1));
            }, 1200);

            progressInterval = setInterval(() => {
                setHistoryProgress((prev) => (prev < 90 ? prev + 16 : 94));
            }, 450);

            tipInterval = setInterval(() => {
                setActiveTipIndex((prev) => (prev + 1) % historyTips.length);
            }, 3500);
        } else {
            setHistoryProgress(100);
        }

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
            clearInterval(tipInterval);
        };
    }, [isLoadingHistory]);

    const defaultFallbackModels = [
        { id: 'ag/gemini-3.8-flash', label: 'Gemini 3.8 Flash (Paling Cepat & Responsif)', desc: 'Kecepatan tinggi, analisis kontekstual & responsif' },
        { id: 'ag/claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (Expert Cyber Security)', desc: 'Penalaran analisis insiden mendalam & presisi' },
        { id: 'ag/gemini-3-flash', label: 'Gemini 3 Flash (Ringan & Cepat)', desc: 'Eksekusi instruksi perbaikan instan' }
    ];

    const [availableModels, setAvailableModels] = useState(defaultFallbackModels);
    const [modelSearch, setModelSearch] = useState('');

    const filteredModels = useMemo(() => {
        if (!modelSearch.trim()) return availableModels;
        const q = modelSearch.toLowerCase().trim();
        return availableModels.filter(m => 
            m.label.toLowerCase().includes(q) || 
            m.id.toLowerCase().includes(q) || 
            (m.desc && m.desc.toLowerCase().includes(q))
        );
    }, [availableModels, modelSearch]);

    const activeQuickFilters = useMemo(() => {
        const filters = [
            { label: 'Semua', value: '' },
            { label: 'Gemini', value: 'gemini' },
            { label: 'Claude', value: 'claude' },
            { label: 'Flash', value: 'flash' },
            { label: 'Combo', value: 'combo' },
            { label: 'DeepSeek', value: 'deepseek' },
            { label: 'GPT', value: 'gpt' },
        ];
        return filters.filter(f => 
            !f.value || availableModels.some(m => 
                m.id.toLowerCase().includes(f.value) || 
                m.label.toLowerCase().includes(f.value)
            )
        );
    }, [availableModels]);

    useEffect(() => {
        if (!show) {
            setModelSearch('');
            return;
        }
        axios.get('/incidents/ai-models')
            .then(res => {
                if (res.data?.success && Array.isArray(res.data.models) && res.data.models.length > 0) {
                    const mapped = res.data.models.map((m: any) => ({
                        id: m.id,
                        label: m.id + (m.owned_by ? ` (${m.owned_by})` : ''),
                        desc: m.has_reasoning ? 'Model penalaran cerdas & reasoning' : (m.has_vision ? 'Mendukung analisis visual & teks' : 'Model komputasi 9Router Gateway')
                    }));
                    setAvailableModels(mapped);
                    if (res.data.default_model) {
                        setSelectedModel(res.data.default_model);
                    }
                }
            })
            .catch(() => {});
    }, [show]);

    useEffect(() => {
        if (!show || !incident?.id) {
            setConversations([]);
            setExtraContext('');
            setActualIncidentId(null);
            setIsGenerating(false);
            return;
        }

        const incKey = getJobKey(incident);
        const activeJob = globalAiJobs.get(incKey);

        // Check sessionStorage in case of page reload while generating
        let hasPersistedJob = false;
        try {
            const raw = sessionStorage.getItem('sigap_ai_job_' + incKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.startedAt < 180000) {
                    hasPersistedJob = true;
                } else {
                    sessionStorage.removeItem('sigap_ai_job_' + incKey);
                }
            }
        } catch (e) {}

        // Scenario 1: Active job is still generating in background!
        if (activeJob && !activeJob.completed) {
            setIsGenerating(true);

            const handleJobUpdate = (job: ActiveJobState) => {
                setIsGenerating(false);
                globalAiJobs.delete(incKey);
                if (job.result && job.result.success) {
                    setConversations(job.result.conversations || []);
                    if (job.result.incident_id) {
                        setActualIncidentId(job.result.incident_id);
                    }
                    toast.success('Respon AI Diterima', 'Panduan perbaikan baru berhasil disintesis.');
                } else if (job.error) {
                    toast.error('Gagal', 'Terjadi kesalahan saat memproses rekomendasi AI.');
                }
            };

            activeJob.listeners.add(handleJobUpdate);
            fetchHistory();

            return () => {
                activeJob.listeners.delete(handleJobUpdate);
            };
        } 
        // Scenario 2: Active job finished while modal was closed!
        else if (activeJob && activeJob.completed) {
            setIsGenerating(false);
            globalAiJobs.delete(incKey);
            if (activeJob.result && activeJob.result.success) {
                setConversations(activeJob.result.conversations || []);
                if (activeJob.result.incident_id) {
                    setActualIncidentId(activeJob.result.incident_id);
                }
            } else {
                fetchHistory();
            }
        }
        // Scenario 3: Reload happened while generating; poll backend history until response arrives
        else if (hasPersistedJob) {
            setIsGenerating(true);
            let pollTicks = 0;
            const pollTimer = setInterval(async () => {
                pollTicks++;
                try {
                    const res = await axios.get(route('incidents.ai-history', incident.id), {
                        params: {
                            title: incident.title,
                            site_name: incident.site_name || incident.site?.name,
                        }
                    });
                    if (res.data && res.data.success && res.data.conversations?.length > 0) {
                        setConversations(res.data.conversations);
                        if (res.data.incident_id) {
                            setActualIncidentId(res.data.incident_id);
                        }
                        setIsGenerating(false);
                        sessionStorage.removeItem('sigap_ai_job_' + incKey);
                        clearInterval(pollTimer);
                    }
                } catch (e) {}

                if (pollTicks >= 25) {
                    setIsGenerating(false);
                    sessionStorage.removeItem('sigap_ai_job_' + incKey);
                    clearInterval(pollTimer);
                }
            }, 2500);

            return () => clearInterval(pollTimer);
        } 
        // Scenario 4: Normal open, load existing conversation history
        else {
            setIsGenerating(false);
            fetchHistory();
        }
    }, [show, incident?.id]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await axios.get(route('incidents.ai-history', incident.id), {
                params: {
                    title: incident.title,
                    site_name: incident.site_name || incident.site?.name,
                }
            });
            if (res.data && res.data.success) {
                setConversations(res.data.conversations || []);
                if (res.data.incident_id) {
                    setActualIncidentId(res.data.incident_id);
                }
            }
        } catch (err) {
            console.error('Failed to load AI conversation history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSafeClose = () => {
        if (isGenerating) {
            toast.info('AI Masih Memproses', 'AI sedang menganalisis di latar belakang. Anda dapat membuka kembali modal ini kapan saja untuk melihat progres atau jawaban.');
        }
        onClose();
    };

    if (!show || !incident) return null;

    const handleGenerate = async () => {
        const promptText = extraContext.trim();
        const incKey = getJobKey(incident);
        if (!incKey) return;

        setIsGenerating(true);
        setExtraContext('');

        // Register job in module-level global tracker so closing modal never aborts it
        const job: ActiveJobState = {
            incidentKey: incKey,
            promptText,
            selectedModel,
            startedAt: Date.now(),
            completed: false,
            listeners: new Set(),
        };
        globalAiJobs.set(incKey, job);

        try {
            sessionStorage.setItem('sigap_ai_job_' + incKey, JSON.stringify({
                startedAt: Date.now(),
                model: selectedModel,
                promptText,
            }));
        } catch (e) {}

        const postData = {
            incident_id: actualIncidentId || incident.id,
            extra_context: promptText,
            model: selectedModel,
            title: incident.title,
            site_name: incident.site_name || incident.site?.name,
            site_url: incident.site_url || incident.site?.url,
            severity: incident.severity,
            type: incident.type,
            description: incident.description,
        };

        axios.post(route('incidents.ai-remediation'), postData)
            .then((res) => {
                job.completed = true;
                job.result = res.data;
                try {
                    sessionStorage.removeItem('sigap_ai_job_' + incKey);
                } catch (e) {}

                // If modal is currently mounted and active, apply result immediately
                setIsGenerating(false);
                globalAiJobs.delete(incKey);

                if (res.data && res.data.success) {
                    setConversations(res.data.conversations || []);
                    if (res.data.incident_id) {
                        setActualIncidentId(res.data.incident_id);
                    }
                    toast.success('Respon AI Diterima', 'Panduan perbaikan baru berhasil disintesis.');
                }

                // Notify background listeners
                job.listeners.forEach((listener) => listener(job));
            })
            .catch((err) => {
                job.completed = true;
                job.error = err;
                try {
                    sessionStorage.removeItem('sigap_ai_job_' + incKey);
                } catch (e) {}

                setIsGenerating(false);
                globalAiJobs.delete(incKey);
                toast.error('Gagal', 'Terjadi kesalahan saat memicu AI Remediation.');

                job.listeners.forEach((listener) => listener(job));
            });
    };

    const handleMarkResolved = () => {
        const targetId = actualIncidentId || incident.id;
        router.patch(route('incidents.update', targetId), { status: 'resolved' }, {
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

    const handleExportReport = () => {
        if (!conversations || conversations.length === 0) {
            toast.info('Belum Ada Percakapan', 'Belum ada riwayat dialog solusi untuk diekspor. Silakan ajukan pertanyaan atau generate solusi terlebih dahulu.');
            return;
        }

        const todayFormatted = new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(new Date());

        const siteName = incident.site_name || incident.site?.name || 'Situs Terpantau';
        const siteUrl = incident.site_url || incident.site?.url || '-';
        const incidentTitle = incident.title || 'Insiden Keamanan';
        const severity = (incident.severity || 'high').toUpperCase();
        const docNumber = `SIGAP/AI-INC/${String(actualIncidentId || incident.id || '001').padStart(4, '0')}/${new Date().getFullYear()}`;

        // Format markdown text to clean official print HTML
        const formatPrintContent = (text: string) => {
            if (!text) return '';
            const lines = text.split(/\r?\n/);
            let html = '';
            let inCode = false;
            let codeLines: string[] = [];
            let codeLang = '';

            lines.forEach((l) => {
                const tr = l.trim();
                if (tr.startsWith('```')) {
                    if (inCode) {
                        const cleanCode = codeLines
                            .map(c => c.trim().startsWith('$ ') ? c.trim().slice(2) : c)
                            .join('\n');
                        html += `<div class="terminal-box">
                            <div class="terminal-bar">${codeLang ? codeLang.toUpperCase() : 'BASH'} • root@sigap-server:~#</div>
                            <pre><code>${cleanCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                        </div>`;
                        codeLines = [];
                        inCode = false;
                        codeLang = '';
                    } else {
                        inCode = true;
                        codeLang = tr.replace(/^```+/, '').trim();
                    }
                    return;
                }

                if (inCode) {
                    codeLines.push(l);
                    return;
                }

                if (tr.startsWith('### ')) {
                    html += `<h4 class="section-title">${tr.replace('### ', '')}</h4>`;
                } else if (tr.startsWith('#### ')) {
                    html += `<h5 class="sub-title">${tr.replace('#### ', '')}</h5>`;
                } else if (tr.startsWith('- [ ] ') || tr.startsWith('- [x] ')) {
                    const checked = tr.startsWith('- [x] ') ? '☑' : '☐';
                    html += `<div class="check-item"><span class="chk">${checked}</span> ${tr.replace(/- \[[ x\]] /, '')}</div>`;
                } else if (tr.startsWith('- ') || tr.startsWith('* ')) {
                    html += `<li class="bullet-item">${tr.slice(2)}</li>`;
                } else if (tr.match(/^(\d+)\.\s+(.*)$/)) {
                    const m = tr.match(/^(\d+)\.\s+(.*)$/);
                    if (m) {
                        html += `<div class="num-item"><span class="num-badge">${m[1]}.</span> <span>${m[2]}</span></div>`;
                    }
                } else if (tr === '---') {
                    html += `<hr class="divider" />`;
                } else if (tr.startsWith('Pilihan ') || tr.startsWith('**Pilihan ')) {
                    html += `<div class="option-title">⚙️ ${tr.replace(/\*\*/g, '')}</div>`;
                } else if (tr !== '') {
                    let formatted = tr
                        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
                        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
                    html += `<p class="paragraph">${formatted}</p>`;
                }
            });

            if (inCode && codeLines.length > 0) {
                html += `<div class="terminal-box"><pre><code>${codeLines.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></div>`;
            }

            return html;
        };

        const dialogHtml = conversations.map((conv, idx) => {
            const timeStr = conv.created_at ? new Date(conv.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
            return `
                <div class="dialog-item">
                    <div class="dialog-header">
                        <span class="dialog-badge">PERCAKAPAN #${idx + 1}</span>
                        <span class="dialog-time">${timeStr} WIB</span>
                    </div>
                    <div class="user-query-box">
                        <div class="query-sender"><strong>Pertanyaan Tim Keamanan / Admin:</strong></div>
                        <div class="query-text">${(conv.user_message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    </div>
                    <div class="ai-solution-box">
                        <div class="ai-sender">
                            <strong>Rekomendasi Pemulihan (${conv.provider || '9router AI Engine'} - ${conv.model_used || selectedModel}):</strong>
                        </div>
                        <div class="solution-body">
                            ${formatPrintContent(conv.ai_response || '')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const printWindow = window.open('', '_blank', 'width=920,height=900');
        if (!printWindow) {
            toast.error('Gagal Membuka Jendela Cetak', 'Izinkan pop-up pada browser Anda untuk mengekspor dokumen laporan.');
            return;
        }

        const reportHtml = `<!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Remediasi Insiden - ${siteName}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 8mm 12mm 8mm 12mm;
                }
                * {
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    color: #1e293b;
                    line-height: 1.45;
                    font-size: 9.3pt;
                    margin: 0;
                    padding: 12px 16px;
                    background: #fff;
                }
                .kop-surat {
                    text-align: center;
                    padding-bottom: 2px;
                }
                .kop-line-1 {
                    font-size: 11pt;
                    font-weight: bold;
                    letter-spacing: 0.5px;
                    margin: 0;
                    text-transform: uppercase;
                }
                .kop-line-2 {
                    font-size: 13pt;
                    font-weight: 800;
                    letter-spacing: 0.8px;
                    margin: 1px 0;
                    text-transform: uppercase;
                    color: #0f172a;
                }
                .kop-address {
                    font-size: 8pt;
                    color: #475569;
                    margin: 2px 0 4px 0;
                }
                .kop-divider {
                    border-top: 2.2px solid #0f172a;
                    border-bottom: 1px solid #0f172a;
                    height: 3px;
                    margin-bottom: 10px;
                }
                .doc-title-bar {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .doc-title {
                    font-size: 11pt;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin: 0 0 2px 0;
                    color: #0e8280;
                }
                .doc-number {
                    font-size: 8.5pt;
                    color: #64748b;
                    margin: 0;
                }
                .meta-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 10px;
                    font-size: 9pt;
                    background: #f8fafc;
                    border: 1px solid #cbd5e1;
                }
                .meta-table td {
                    padding: 4px 10px;
                    border: 1px solid #e2e8f0;
                }
                .meta-label {
                    width: 28%;
                    font-weight: bold;
                    color: #334155;
                    background: #f1f5f9;
                }
                .urgency-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 8pt;
                    color: #fff;
                    background: ${severity === 'CRITICAL' ? '#dc2626' : '#ea580c'};
                }
                .section-heading {
                    font-size: 10pt;
                    font-weight: bold;
                    margin: 12px 0 6px 0;
                    color: #0f172a;
                    border-bottom: 1.5px solid #0ea5a3;
                    padding-bottom: 3px;
                    break-after: avoid;
                    page-break-after: avoid;
                }
                .desc-box {
                    background: #f8fafc;
                    border-left: 3.5px solid #0ea5a3;
                    padding: 6px 10px;
                    font-size: 9pt;
                    color: #334155;
                    margin-bottom: 10px;
                }
                .dialog-item {
                    margin-bottom: 10px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #ffffff;
                    break-inside: auto;
                    page-break-inside: auto;
                }
                .dialog-header {
                    background: #f1f5f9;
                    padding: 5px 10px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 8.5pt;
                    font-weight: bold;
                    color: #475569;
                    border-bottom: 1px solid #cbd5e1;
                    break-after: avoid;
                    page-break-after: avoid;
                }
                .dialog-badge {
                    color: #0e8280;
                }
                .user-query-box {
                    background: #f8fafc;
                    padding: 6px 10px;
                    border-bottom: 1px dashed #cbd5e1;
                    break-after: avoid;
                    page-break-after: avoid;
                }
                .query-sender {
                    font-size: 8pt;
                    color: #0284c7;
                    margin-bottom: 2px;
                }
                .query-text {
                    font-size: 9.2pt;
                    color: #0f172a;
                    font-weight: 500;
                }
                .ai-solution-box {
                    padding: 8px 12px;
                    background: #ffffff;
                }
                .ai-sender {
                    font-size: 8pt;
                    color: #0e8280;
                    margin-bottom: 6px;
                }
                .section-title {
                    font-size: 9.5pt;
                    font-weight: bold;
                    color: #0f172a;
                    margin: 8px 0 3px 0;
                    break-after: avoid;
                    page-break-after: avoid;
                }
                .sub-title {
                    font-size: 9pt;
                    font-weight: bold;
                    color: #0e8280;
                    margin: 6px 0 3px 0;
                    break-after: avoid;
                    page-break-after: avoid;
                }
                .option-title {
                    font-size: 9pt;
                    font-weight: bold;
                    color: #0e8280;
                    margin: 6px 0 3px 0;
                    break-after: avoid;
                    page-break-after: avoid;
                }
                .paragraph {
                    margin: 0 0 5px 0;
                    font-size: 9pt;
                    color: #334155;
                    line-height: 1.45;
                }
                .terminal-box {
                    background: #0f172a;
                    color: #38bdf8;
                    border-radius: 6px;
                    padding: 6px 10px;
                    margin: 6px 0;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 8.3pt;
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                .terminal-bar {
                    color: #94a3b8;
                    font-size: 7.2pt;
                    border-bottom: 1px solid #334155;
                    padding-bottom: 3px;
                    margin-bottom: 4px;
                }
                .terminal-box pre {
                    margin: 0;
                    white-space: pre-wrap;
                }
                .inline-code {
                    background: #f1f5f9;
                    color: #0f766e;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-family: monospace;
                    font-size: 8.5pt;
                    border: 1px solid #cbd5e1;
                }
                .num-item {
                    display: flex;
                    gap: 6px;
                    margin-bottom: 4px;
                    font-size: 9pt;
                }
                .num-badge {
                    font-weight: bold;
                    color: #0e8280;
                }
                .check-item {
                    font-size: 9pt;
                    margin-bottom: 3px;
                }
                .bullet-item {
                    margin-left: 14px;
                    margin-bottom: 3px;
                    font-size: 9pt;
                }
                .divider {
                    border: 0;
                    border-top: 1px dashed #cbd5e1;
                    margin: 8px 0;
                }
                .sign-section {
                    margin-top: 18px;
                    break-inside: avoid;
                    page-break-inside: avoid;
                    display: flex;
                    justify-content: space-between;
                    font-size: 9pt;
                }
                .sign-box {
                    width: 45%;
                    text-align: center;
                }
                .sign-space {
                    height: 38px;
                }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="margin-bottom: 18px; text-align: right; background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <span style="float: left; font-size: 9pt; color: #64748b; line-height: 2;">
                    💡 Tips: Pilih <strong>"Save as PDF"</strong> pada opsi Printer jika ingin menyimpan dokumen.
                </span>
                <button onclick="window.print()" style="background: #0ea5a3; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 9.5pt;">
                    🖨️ Cetak / Simpan PDF
                </button>
                <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 9.5pt; margin-left: 8px;">
                    Tutup
                </button>
            </div>

            <div class="kop-surat">
                <p class="kop-line-1">Pemerintah Kota Pekalongan</p>
                <p class="kop-line-2">Dinas Komunikasi dan Informatika</p>
                <p class="kop-address">Jl. Mataram No. 1, Kota Pekalongan, Jawa Tengah 51111 | Telp: (0285) 421093 | Email: diskominfo@pekalongankota.go.id</p>
            </div>
            <div class="kop-divider"></div>

            <div class="doc-title-bar">
                <h2 class="doc-title">Laporan Rekomendasi Remediasi Insiden Keamanan Siber</h2>
                <p class="doc-number">Nomor Dokumen: ${docNumber}</p>
            </div>

            <table class="meta-table">
                <tr>
                    <td class="meta-label">Insiden / Temuan Masalah</td>
                    <td><strong>${incidentTitle}</strong></td>
                </tr>
                <tr>
                    <td class="meta-label">Target Situs / Domain</td>
                    <td><strong>${siteName}</strong> (https://${siteUrl})</td>
                </tr>
                <tr>
                    <td class="meta-label">Tingkat Urgensi</td>
                    <td><span class="urgency-badge">${severity}</span></td>
                </tr>
                <tr>
                    <td class="meta-label">Tanggal Pelaporan & Audit</td>
                    <td>${todayFormatted}</td>
                </tr>
                <tr>
                    <td class="meta-label">Engine Rekomendasi AI</td>
                    <td>${selectedModel} (SIGAP Cyber Intelligence)</td>
                </tr>
            </table>

            ${incident.description ? `
            <div class="section-heading">I. Deskripsi Temuan Masalah</div>
            <div class="desc-box">${incident.description}</div>
            ` : ''}

            <div class="section-heading">II. Kronologi Konsultasi & Riwayat Rekomendasi Solusi Pemulihan</div>
            ${dialogHtml}

            <div class="sign-section">
                <div class="sign-box">
                    <p>Mengetahui,<br><strong>Penanggung Jawab Situs Web</strong></p>
                    <div class="sign-space"></div>
                    <p>( .................................................... )</p>
                </div>
                <div class="sign-box">
                    <p>Kota Pekalongan, ${todayFormatted}<br><strong>Incident Responder CSIRT</strong></p>
                    <div class="sign-space"></div>
                    <p><strong>Admin Keamanan SIGAP</strong><br><span style="font-size: 8.5pt; color: #64748b;">Diskominfo Kota Pekalongan</span></p>
                </div>
            </div>

            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 400);
                };
            </script>
        </body>
        </html>`;

        printWindow.document.open();
        printWindow.document.write(reportHtml);
        printWindow.document.close();
    };

    const handleCopyCode = (codeText: string, idxKey: string) => {
        // Strip leading shell prompt characters ($ ) so copied command can be directly pasted into terminal without errors
        const cleanToCopy = codeText
            .split('\n')
            .map(line => line.trim().startsWith('$ ') ? line.trim().slice(2) : line)
            .join('\n');

        navigator.clipboard.writeText(cleanToCopy);
        setCopiedIndex(idxKey);
        toast.info('Tersalin', 'Kode perintah bersih dari prompt ($) berhasil disalin ke clipboard.');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const parseInlineFormatting = (text: string) => {
        if (!text) return text;
        const parts: React.ReactNode[] = [];
        const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            const m = match[0];
            if (m.startsWith('**') && m.endsWith('**')) {
                parts.push(
                    <strong key={`b-${match.index}`} style={{ fontWeight: 650, color: 'var(--ink-dark, #0f2a3f)' }}>
                        {m.slice(2, -2)}
                    </strong>
                );
            } else if (m.startsWith('`') && m.endsWith('`')) {
                parts.push(
                    <code key={`c-${match.index}`} style={{ 
                        background: 'rgba(14, 165, 163, 0.08)', 
                        color: '#0e8280', 
                        padding: '0.15rem 0.45rem', 
                        borderRadius: '6px', 
                        fontSize: '0.88em',
                        fontFamily: 'Fira Code, monospace',
                        fontWeight: 600,
                        border: '1px solid rgba(14, 165, 163, 0.25)'
                    }}>
                        {m.slice(1, -1)}
                    </code>
                );
            } else if (m.startsWith('*') && m.endsWith('*')) {
                parts.push(<em key={`i-${match.index}`}>{m.slice(1, -1)}</em>);
            }
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    const renderTerminalBlock = (codeText: string, lang: string, key: string) => {
        const rawLang = (lang || '').toLowerCase().trim();
        const isShell = !rawLang || ['bash', 'sh', 'shell', 'zsh', 'terminal', 'cmd'].includes(rawLang);
        const displayLang = rawLang ? rawLang.toUpperCase() : 'BASH';
        const lines = codeText.split('\n');

        return (
            <div 
                key={key} 
                className="my-3.5 shadow-sm position-relative" 
                style={{ 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    border: '1.5px solid rgba(14, 165, 163, 0.35)', 
                    background: '#090e17', 
                    boxShadow: '0 8px 26px rgba(10, 20, 35, 0.28)' 
                }}
            >
                {/* Terminal Header Bar */}
                <div 
                    className="d-flex justify-content-between align-items-center px-3.5 py-2" 
                    style={{ 
                        background: '#131c2c', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
                        fontSize: '0.78rem' 
                    }}
                >
                    {/* Window Controls & Session Label */}
                    <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center gap-1.5 me-2">
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                        </div>
                        <div className="d-flex align-items-center gap-1.5" style={{ color: '#94a3b8', fontFamily: 'Fira Code, monospace', fontSize: '0.76rem' }}>
                            <i className="bi bi-terminal-fill" style={{ color: '#0ea5a3' }}></i>
                            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{displayLang}</span>
                            <span style={{ opacity: 0.4 }}>•</span>
                            <span style={{ color: '#cbd5e1', opacity: 0.85 }}>{isShell ? 'root@sigap-server:~#' : 'configuration block'}</span>
                        </div>
                    </div>

                    {/* Copy Button */}
                    <button 
                        type="button"
                        onClick={() => handleCopyCode(codeText, key)}
                        className="btn btn-sm d-inline-flex align-items-center gap-1.5 text-white border-0 py-1 px-2.5 transition-all"
                        style={{ 
                            fontSize: '0.76rem', 
                            background: copiedIndex === key ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.12)', 
                            color: copiedIndex === key ? '#34d399' : '#e2e8f0',
                            borderRadius: '8px',
                            border: copiedIndex === key ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                            fontWeight: 500
                        }}
                        title="Salin perintah bersih tanpa karakter prompt ($)"
                    >
                        <i className={`bi ${copiedIndex === key ? 'bi-check2 text-success fw-bold' : 'bi-clipboard'}`}></i>
                        <span>{copiedIndex === key ? 'Tersalin' : 'Salin Perintah'}</span>
                    </button>
                </div>

                {/* Terminal Screen Code Lines */}
                <div 
                    className="p-3.5" 
                    style={{ 
                        overflowX: 'auto', 
                        fontSize: '0.88rem', 
                        fontFamily: 'Fira Code, Consolas, Monaco, monospace', 
                        lineHeight: '1.65',
                        background: '#090e17' 
                    }}
                >
                    {lines.map((l, lIdx) => {
                        const trimmedLine = l.trim();
                        const isComment = trimmedLine.startsWith('#');
                        const hasShellPrompt = trimmedLine.startsWith('$ ');
                        const cleanContent = hasShellPrompt ? trimmedLine.slice(2) : l;

                        return (
                            <div key={lIdx} className="d-flex align-items-start gap-2" style={{ whiteSpace: 'pre' }}>
                                {isShell && !isComment && (
                                    <span style={{ 
                                        color: '#0ea5a3', 
                                        userSelect: 'none', 
                                        fontWeight: 700,
                                        opacity: 0.85
                                    }}>$</span>
                                )}
                                {isComment ? (
                                    <span style={{ color: '#64748b', fontStyle: 'italic' }}>{l}</span>
                                ) : (
                                    <span style={{ color: isShell ? '#38bdf8' : '#e2e8f0' }}>{cleanContent}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderMarkdownContent = (content: string, convId: string | number) => {
        if (!content) return null;

        const lines = content.split(/\r?\n/);
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeBuffer: string[] = [];
        let codeLang = '';

        const flushCodeBlock = (index: number) => {
            if (codeBuffer.length === 0) return;
            const codeStr = codeBuffer.join('\n');
            const codeKey = `${convId}-code-${index}`;
            elements.push(renderTerminalBlock(codeStr, codeLang, codeKey));
            codeBuffer = [];
            inCodeBlock = false;
            codeLang = '';
        };

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // Detect code block fences (``` or ```bash, ```nginx, etc.) even if indented
            if (trimmed.startsWith('```')) {
                if (inCodeBlock) {
                    flushCodeBlock(index);
                } else {
                    inCodeBlock = true;
                    codeLang = trimmed.replace(/^```+/, '').trim();
                }
                return;
            }

            if (inCodeBlock) {
                codeBuffer.push(line);
                return;
            }

            // Headings
            if (trimmed.startsWith('### ')) {
                elements.push(
                    <h4 key={index} className="mt-3.5 mb-2 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '1.08rem', color: 'var(--ink-dark, #0f2a3f)' }}>
                        <i className="bi bi-chevron-right text-teal" style={{ fontSize: '0.88rem', color: '#0ea5a3' }}></i>
                        <span>{parseInlineFormatting(trimmed.replace('### ', ''))}</span>
                    </h4>
                );
                return;
            }
            if (trimmed.startsWith('#### ')) {
                elements.push(
                    <h5 key={index} className="mt-3 mb-1.5 fw-semibold" style={{ fontSize: '0.98rem', color: '#0ea5a3' }}>
                        {parseInlineFormatting(trimmed.replace('#### ', ''))}
                    </h5>
                );
                return;
            }

            // Numbered list items (e.g. "1. ", "2. ", "3. ")
            const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
            if (numMatch) {
                elements.push(
                    <div key={index} className="d-flex align-items-start gap-2.5 my-2" style={{ fontSize: '0.93rem', lineHeight: '1.6' }}>
                        <span className="badge rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '22px', height: '22px', background: 'rgba(14,165,163,0.14)', color: '#0ea5a3', fontWeight: 700, fontSize: '0.75rem', marginTop: '3px' }}>
                            {numMatch[1]}
                        </span>
                        <div className="flex-grow-1" style={{ color: 'var(--ink-dark, #1e293b)' }}>
                            {parseInlineFormatting(numMatch[2])}
                        </div>
                    </div>
                );
                return;
            }

            // Task / Checklist items
            if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
                const isChecked = trimmed.startsWith('- [x] ');
                elements.push(
                    <div key={index} className="d-flex align-items-center gap-2.5 my-2" style={{ fontSize: '0.92rem' }}>
                        <i className={`bi ${isChecked ? 'bi-check-square-fill text-teal' : 'bi-square text-muted'}`} style={{ color: isChecked ? '#0ea5a3' : undefined }}></i>
                        <span>{parseInlineFormatting(trimmed.replace(/- \[[ x\]] /, ''))}</span>
                    </div>
                );
                return;
            }

            // Bullet list items
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                elements.push(
                    <li key={index} className="ms-3 my-1.5" style={{ fontSize: '0.92rem', color: 'var(--ink-dark, #1e293b)', lineHeight: '1.6' }}>
                        {parseInlineFormatting(trimmed.slice(2))}
                    </li>
                );
                return;
            }

            // Horizontal rule
            if (trimmed === '---') {
                elements.push(<hr key={index} className="my-3.5 opacity-25" />);
                return;
            }

            // Options / Section titles like "Pilihan A: Jika Menggunakan Nginx"
            if (trimmed.startsWith('Pilihan ') || trimmed.startsWith('**Pilihan ')) {
                elements.push(
                    <div key={index} className="mt-3.5 mb-2 fw-bold d-flex align-items-center gap-2" style={{ color: '#0ea5a3', fontSize: '0.98rem' }}>
                        <i className="bi bi-gear-wide-connected"></i>
                        <span>{parseInlineFormatting(trimmed)}</span>
                    </div>
                );
                return;
            }

            // Regular paragraph
            if (trimmed !== '') {
                elements.push(
                    <p key={index} className="mb-2.5" style={{ fontSize: '0.94rem', lineHeight: '1.7', color: 'var(--ink, #334155)' }}>
                        {parseInlineFormatting(line)}
                    </p>
                );
            }
        });

        // Flush any unclosed code block if stream finished without ending ```
        if (inCodeBlock) {
            flushCodeBlock(lines.length);
        }

        return elements;
    };

    return (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(15,42,63,0.5)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '1480px', width: '95vw', height: '92vh', margin: '1.5rem auto' }}>
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Modal Header */}
                    <div className="modal-header border-0 px-4 px-lg-5 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)', color: '#fff' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.65rem' }}>
                                <i className="bi bi-robot"></i>
                            </div>
                            <div>
                                <h5 className="modal-title fw-bold m-0" style={{ fontSize: '1.35rem', fontFamily: 'Poppins, sans-serif' }}>
                                    AI Security Remediation Assistant
                                </h5>
                                <p className="m-0 opacity-75" style={{ fontSize: '0.88rem' }}>
                                    Diskusi & Riwayat Percakapan Solusi Penanganan Insiden Keamanan.
                                </p>
                            </div>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={handleSafeClose}></button>
                    </div>

                    {/* Modal Body */}
                    <div className="modal-body px-4 px-lg-5 py-4" style={{ background: '#f8fafc', flex: '1 1 auto', overflowY: 'auto' }}>
                        
                        {/* Incident Context Banner */}
                        <div className="glass-card p-3 mb-4" style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid rgba(14,165,163,0.2)' }}>
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                <span className="fw-bold" style={{ fontSize: '1.02rem', color: 'var(--ink)' }}>{incident.title}</span>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge" style={{ background: incident.severity === 'critical' ? '#c8332a' : '#ff7a6e', color: '#fff', fontSize: '0.75rem', padding: '0.38rem 0.8rem', borderRadius: '20px' }}>
                                        Urgensi: {incident.severity?.toUpperCase()}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleExportReport}
                                        className="btn btn-sm d-inline-flex align-items-center gap-1.5 transition-all shadow-xs"
                                        style={{
                                            borderRadius: '10px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            background: 'linear-gradient(135deg, rgba(14,165,163,0.12), rgba(37,99,235,0.08))',
                                            color: '#0e8280',
                                            border: '1.2px solid rgba(14, 165, 163, 0.35)',
                                            padding: '0.36rem 0.95rem',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#0ea5a3';
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.borderColor = '#0ea5a3';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(14,165,163,0.12), rgba(37,99,235,0.08))';
                                            e.currentTarget.style.color = '#0e8280';
                                            e.currentTarget.style.borderColor = 'rgba(14, 165, 163, 0.35)';
                                            e.currentTarget.style.transform = 'none';
                                        }}
                                        title="Ekspor seluruh riwayat percakapan & panduan pemulihan ke format Laporan Resmi PDF"
                                    >
                                        <i className="bi bi-file-earmark-arrow-down-fill text-teal" style={{ fontSize: '0.9rem' }}></i>
                                        <span>Export Laporan</span>
                                    </button>
                                </div>
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
                        <div className="glass-card p-3 mb-4" style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                            {/* Header: Title, Count Badge, & Search Bar */}
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2.5 mb-2.5 pb-2 border-bottom border-light">
                                <div className="d-flex align-items-center gap-2">
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        background: 'rgba(14, 165, 163, 0.12)',
                                        color: 'var(--teal-1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.9rem'
                                    }}>
                                        <i className="bi bi-cpu-fill"></i>
                                    </div>
                                    <div>
                                        <span className="fw-bold" style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>
                                            Pilih Engine AI Model:
                                        </span>
                                        <span className="badge ms-2 rounded-pill" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
                                            {modelSearch.trim() ? `${filteredModels.length} dari ${availableModels.length}` : `${availableModels.length}`} Model
                                        </span>
                                    </div>
                                </div>

                                {/* Live Search Input */}
                                <div className="position-relative" style={{ minWidth: '220px', maxWidth: '320px', flex: '1 1 auto' }}>
                                    <i 
                                        className="bi bi-search position-absolute top-50 translate-middle-y text-muted" 
                                        style={{ left: '12px', fontSize: '0.8rem', pointerEvents: 'none' }}
                                    ></i>
                                    <input 
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Cari model (gemini, claude, flash)..."
                                        value={modelSearch}
                                        onChange={(e) => setModelSearch(e.target.value)}
                                        style={{
                                            paddingLeft: '32px',
                                            paddingRight: modelSearch ? '30px' : '12px',
                                            borderRadius: '10px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '0.82rem',
                                            background: '#f8fafc',
                                            boxShadow: 'none',
                                            height: '34px',
                                        }}
                                    />
                                    {modelSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setModelSearch('')}
                                            className="btn btn-link position-absolute top-50 translate-middle-y p-0 text-muted"
                                            style={{ right: '10px', textDecoration: 'none', fontSize: '0.85rem', lineHeight: 1 }}
                                            title="Hapus pencarian"
                                        >
                                            <i className="bi bi-x-circle-fill"></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Filter Pills */}
                            {activeQuickFilters.length > 1 && (
                                <div className="d-flex align-items-center gap-1.5 flex-wrap mb-2.5" style={{ fontSize: '0.75rem' }}>
                                    <span className="text-muted me-1" style={{ fontSize: '0.73rem' }}>
                                        <i className="bi bi-funnel me-1"></i>Filter Cepat:
                                    </span>
                                    {activeQuickFilters.map(f => {
                                        const isActive = (!f.value && !modelSearch) || (f.value && modelSearch.toLowerCase() === f.value);
                                        return (
                                            <button
                                                key={f.label}
                                                type="button"
                                                onClick={() => setModelSearch(isActive && f.value ? '' : f.value)}
                                                className="btn btn-sm py-0.5 px-2.5 rounded-pill transition-all"
                                                style={{
                                                    fontSize: '0.74rem',
                                                    border: isActive ? '1px solid var(--teal-1)' : '1px solid #e2e8f0',
                                                    background: isActive ? 'var(--teal-1)' : '#ffffff',
                                                    color: isActive ? '#ffffff' : '#475569',
                                                    fontWeight: isActive ? 600 : 400,
                                                }}
                                            >
                                                {f.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Notice if the currently selected model is outside the search query */}
                            {modelSearch.trim() && !filteredModels.some(m => m.id === selectedModel) && (
                                <div 
                                    className="p-2 px-3 mb-2.5 d-flex align-items-center justify-content-between rounded-3"
                                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#166534' }}
                                >
                                    <div className="d-flex align-items-center gap-2 text-truncate">
                                        <i className="bi bi-check-circle-fill text-success"></i>
                                        <span className="text-truncate">
                                            Model terpilih saat ini: <strong>{availableModels.find(m => m.id === selectedModel)?.label || selectedModel}</strong>
                                        </span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setModelSearch('')}
                                        className="btn btn-sm btn-link p-0 text-decoration-none fw-semibold flex-shrink-0 ms-2"
                                        style={{ fontSize: '0.75rem', color: 'var(--teal-1)' }}
                                    >
                                        Tampilkan Semua
                                    </button>
                                </div>
                            )}

                            {/* Models Grid with Scrollable Container */}
                            <div 
                                style={{ 
                                    maxHeight: '280px', 
                                    overflowY: 'auto', 
                                    paddingRight: '4px',
                                    scrollbarWidth: 'thin'
                                }}
                            >
                                {filteredModels.length > 0 ? (
                                    <div className="row g-2">
                                        {filteredModels.map((m) => {
                                            const isSelected = selectedModel === m.id;
                                            return (
                                                <div className="col-12 col-md-4" key={m.id}>
                                                    <div 
                                                        onClick={() => setSelectedModel(m.id)}
                                                        className="p-2.5 px-3 d-flex align-items-center justify-content-between h-100"
                                                        style={{
                                                            borderRadius: '12px',
                                                            border: isSelected ? '2px solid var(--teal-1)' : '1px solid var(--line)',
                                                            background: isSelected ? 'rgba(14,165,163,0.06)' : 'rgba(255,255,255,0.85)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.18s ease'
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center gap-2.5 overflow-hidden me-2">
                                                            <div style={{
                                                                width: '34px', height: '34px', borderRadius: '10px',
                                                                background: isSelected ? 'linear-gradient(135deg, var(--teal-1), var(--teal-2))' : '#f1f5f9',
                                                                color: isSelected ? '#fff' : '#64748b',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 700, fontSize: '0.85rem',
                                                                flexShrink: 0
                                                            }}>
                                                                <i className="bi bi-layers-fill"></i>
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <div className="fw-bold text-truncate" style={{ fontSize: '0.82rem', color: 'var(--ink-dark)' }} title={m.label}>
                                                                    {m.label}
                                                                </div>
                                                                <div className="text-truncate" style={{ fontSize: '0.71rem', color: 'var(--ink-faint)' }}>
                                                                    {m.desc}
                                                                </div>
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
                                ) : (
                                    <div className="text-center py-4 px-3" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                        <i className="bi bi-search text-muted mb-2 d-block" style={{ fontSize: '1.6rem', opacity: 0.5 }}></i>
                                        <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                                            Tidak ada model yang cocok dengan "{modelSearch}"
                                        </div>
                                        <p className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                                            Coba gunakan kata kunci lain atau klik tombol reset di bawah.
                                        </p>
                                        <button 
                                            type="button" 
                                            onClick={() => setModelSearch('')}
                                            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Pencarian
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Conversation Chat History Stream */}
                        <div className="mb-4">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--ink)', fontSize: '0.95rem' }}>
                                <i className="bi bi-chat-left-text text-teal" style={{ color: 'var(--teal-1)' }}></i>
                                Riwayat Percakapan & Rekomendasi Solusi ({conversations.length})
                            </h6>

                            {/* Conversation List */}
                            {isLoadingHistory ? (
                                <div className="glass-card p-4 p-md-4.5 mb-4 position-relative overflow-hidden" style={{
                                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 55%, #f0fdfa 100%)',
                                    borderRadius: '24px',
                                    border: '1.5px solid rgba(14, 165, 163, 0.28)',
                                    boxShadow: '0 12px 35px -10px rgba(14, 165, 163, 0.12)'
                                }}>
                                    {/* Style for Skeleton Shimmer Animations */}
                                    <style>{`
                                        @keyframes shimmerEffect {
                                            0% { background-position: -450px 0; }
                                            100% { background-position: 450px 0; }
                                        }
                                        .skeleton-box {
                                            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
                                            background-size: 800px 100%;
                                            animation: shimmerEffect 1.5s infinite ease-in-out;
                                            border-radius: 8px;
                                        }
                                        @keyframes pulseBadge {
                                            0%, 100% { transform: scale(1); opacity: 1; }
                                            50% { transform: scale(1.08); opacity: 0.85; }
                                        }
                                        @keyframes radarPulse {
                                            0% { transform: scale(0.6); opacity: 0.9; }
                                            50% { transform: scale(1.3); opacity: 0.35; }
                                            100% { transform: scale(1.7); opacity: 0; }
                                        }
                                        @keyframes ringRotate {
                                            from { transform: rotate(0deg); }
                                            to { transform: rotate(360deg); }
                                        }
                                    `}</style>

                                    {/* Top Interactive Status Bar & Progress */}
                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3.5 pb-3 border-bottom border-light">
                                        <div className="d-flex align-items-center gap-2.5">
                                            {/* Radar Icon Core */}
                                            <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    border: '2px dashed #0ea5a3',
                                                    animation: 'ringRotate 8s linear infinite'
                                                }} />
                                                <div style={{
                                                    position: 'absolute',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: 'rgba(14, 165, 163, 0.2)',
                                                    animation: 'radarPulse 2s ease-out infinite'
                                                }} />
                                                <div style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #0ea5a3, #0f2a3f)',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.82rem',
                                                    boxShadow: '0 2px 8px rgba(14,165,163,0.35)'
                                                }}>
                                                    <i className="bi bi-hdd-network-fill"></i>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                                    <span className="badge rounded-pill d-inline-flex align-items-center gap-1.5" style={{
                                                        background: 'rgba(14, 165, 163, 0.12)',
                                                        color: '#0ea5a3',
                                                        fontWeight: 700,
                                                        fontSize: '0.74rem',
                                                        padding: '0.35rem 0.65rem'
                                                    }}>
                                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0ea5a3', animation: 'pulseBadge 1.2s infinite' }}></span>
                                                        SINKRONISASI AKTIF
                                                    </span>
                                                    <span className="fw-bold" style={{ fontSize: '0.88rem', color: '#0f2a3f' }}>
                                                        {historyLoadStep === 1 && 'Menghubungkan ke Repositori Insiden...'}
                                                        {historyLoadStep === 2 && 'Mengambil Riwayat Dialog & Solusi...'}
                                                        {historyLoadStep === 3 && 'Menyusun Workspace & Format Perintah...'}
                                                    </span>
                                                </div>
                                                <div className="text-muted mt-0.5" style={{ fontSize: '0.76rem' }}>
                                                    Target: <strong className="text-teal">{incident.site_name || incident.site?.name || 'Situs Terpantau'}</strong> • ID: <code>{incident.id}</code>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Refresh Button if slow */}
                                        <button
                                            type="button"
                                            onClick={() => fetchHistory()}
                                            className="btn btn-sm d-inline-flex align-items-center gap-1.5"
                                            style={{
                                                background: '#fff',
                                                border: '1px solid rgba(14,165,163,0.3)',
                                                color: '#0ea5a3',
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                borderRadius: '10px',
                                                padding: '0.35rem 0.75rem',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <i className="bi bi-arrow-clockwise"></i>
                                            <span>Muat Ulang</span>
                                        </button>
                                    </div>

                                    {/* Animated Progress Meter */}
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b' }}>
                                            <span className="d-flex align-items-center gap-1.5">
                                                <i className="bi bi-cpu text-teal"></i>
                                                Tahap {historyLoadStep} dari 3
                                            </span>
                                            <span className="text-teal font-monospace fw-bold">{historyProgress}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px', borderRadius: '10px', background: 'rgba(14, 165, 163, 0.1)', overflow: 'hidden' }}>
                                            <div 
                                                className="progress-bar progress-bar-striped progress-bar-animated" 
                                                role="progressbar" 
                                                style={{ 
                                                    width: `${historyProgress}%`,
                                                    background: 'linear-gradient(90deg, #0ea5a3 0%, #6366f1 100%)',
                                                    transition: 'width 0.35s ease'
                                                }} 
                                            />
                                        </div>
                                    </div>

                                    {/* Interactive Tips Banner with Next Tip Button */}
                                    <div 
                                        className="p-3 mb-4 d-flex align-items-center justify-content-between gap-3"
                                        style={{
                                            background: 'rgba(14, 165, 163, 0.06)',
                                            border: '1px solid rgba(14, 165, 163, 0.18)',
                                            borderRadius: '14px',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div className="d-flex align-items-start gap-2.5">
                                            <div style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '8px',
                                                background: '#0ea5a3',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.88rem',
                                                flexShrink: 0
                                            }}>
                                                <i className="bi bi-lightbulb-fill"></i>
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: '#1e293b', lineHeight: '1.45' }}>
                                                <span className="fw-bold text-teal d-block mb-0.5" style={{ fontSize: '0.74rem', letterSpacing: '0.5px' }}>INFO & PANDUAN PENGGUNA</span>
                                                <span>{historyTips[activeTipIndex]}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTipIndex((prev) => (prev + 1) % historyTips.length)}
                                            className="btn btn-sm btn-light border-0 d-flex align-items-center gap-1 flex-shrink-0 text-muted"
                                            style={{ fontSize: '0.74rem', fontWeight: 600, borderRadius: '8px', padding: '0.25rem 0.55rem' }}
                                            title="Ganti tips panduan"
                                        >
                                            <i className="bi bi-arrow-repeat"></i>
                                            <span>Ganti Tips</span>
                                        </button>
                                    </div>

                                    {/* Realistic Interactive Skeleton Feed Preview */}
                                    <div className="opacity-75">
                                        {/* Skeleton: User Bubble */}
                                        <div className="d-flex justify-content-end align-items-start gap-2.5 mb-3.5">
                                            <div style={{ maxWidth: '75%', width: '380px' }}>
                                                <div className="p-3 rounded-4" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <div className="skeleton-box" style={{ width: '90px', height: '14px' }}></div>
                                                        <div className="skeleton-box" style={{ width: '45px', height: '12px' }}></div>
                                                    </div>
                                                    <div className="skeleton-box mb-1.5" style={{ width: '95%', height: '14px' }}></div>
                                                    <div className="skeleton-box" style={{ width: '60%', height: '14px' }}></div>
                                                </div>
                                            </div>
                                            <div className="skeleton-box rounded-circle flex-shrink-0" style={{ width: '36px', height: '36px' }}></div>
                                        </div>

                                        {/* Skeleton: AI Response Card with Terminal Mock */}
                                        <div className="d-flex justify-content-start align-items-start gap-2.5">
                                            <div className="skeleton-box rounded-circle flex-shrink-0" style={{ width: '36px', height: '36px' }}></div>
                                            <div className="flex-grow-1 p-3.5 rounded-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                                                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-light">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="skeleton-box" style={{ width: '130px', height: '16px' }}></div>
                                                        <div className="skeleton-box rounded-pill" style={{ width: '80px', height: '18px' }}></div>
                                                    </div>
                                                    <div className="skeleton-box" style={{ width: '60px', height: '14px' }}></div>
                                                </div>

                                                <div className="skeleton-box mb-2" style={{ width: '90%', height: '14px' }}></div>
                                                <div className="skeleton-box mb-3" style={{ width: '75%', height: '14px' }}></div>

                                                {/* Mini Terminal Skeleton */}
                                                <div className="rounded-3 p-3" style={{ background: '#0b1329', border: '1px solid #1e293b' }}>
                                                    <div className="d-flex align-items-center justify-content-between mb-2.5">
                                                        <div className="d-flex gap-1.5">
                                                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                                                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#eab308', display: 'inline-block' }}></span>
                                                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                                                        </div>
                                                        <div className="skeleton-box" style={{ width: '110px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>
                                                    </div>
                                                    <div className="skeleton-box mb-1.5" style={{ width: '80%', height: '13px', background: 'rgba(255,255,255,0.12)' }}></div>
                                                    <div className="skeleton-box" style={{ width: '55%', height: '13px', background: 'rgba(255,255,255,0.12)' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-5 p-4 glass-card" style={{ background: '#fff', borderRadius: '20px', border: '1.5px dashed var(--line)' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(14,165,163,0.08)', color: '#0ea5a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1rem' }}>
                                        <i className="bi bi-chat-square-dots"></i>
                                    </div>
                                    <h6 className="fw-bold mb-1" style={{ color: 'var(--ink-dark)' }}>Belum Ada Riwayat Percakapan</h6>
                                    <p className="text-muted mb-0 mx-auto" style={{ fontSize: '0.88rem', maxWidth: '520px' }}>
                                        Mulai konsultasikan mitigasi insiden ini dengan AI. Klik <strong>Generate Solusi AI</strong> di bawah atau masukkan pertanyaan spesifik server Anda.
                                    </p>
                                </div>
                            ) : (
                                conversations.map((conv, idx) => (
                                    <div key={conv.id || idx} className="mb-4">
                                        
                                        {/* User Message Row */}
                                        <div className="d-flex justify-content-end align-items-start gap-2.5 mb-3.5">
                                            <div style={{ maxWidth: '82%' }}>
                                                <div 
                                                    style={{ 
                                                        background: 'linear-gradient(135deg, #0f2a3f 0%, #0ea5a3 100%)', 
                                                        color: '#fff', 
                                                        borderRadius: '20px 20px 4px 20px', 
                                                        padding: '0.9rem 1.35rem', 
                                                        boxShadow: '0 4px 15px rgba(14,165,163,0.18)',
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center justify-content-between gap-3 mb-1.5 pb-1 border-bottom border-white border-opacity-10">
                                                        <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                                                            <i className="bi bi-shield-person"></i>
                                                            <span>Admin / Tim Keamanan</span>
                                                        </div>
                                                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                                                            {conv.created_at ? new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pertanyaan'}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.94rem', lineHeight: '1.55', fontWeight: 400 }}>
                                                        {conv.user_message}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* User Avatar Circle */}
                                            <div 
                                                style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, #0ea5a3, #0284c7)',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.05rem',
                                                    boxShadow: '0 4px 10px rgba(14,165,163,0.25)',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <i className="bi bi-person-fill"></i>
                                            </div>
                                        </div>

                                        {/* AI Assistant Message Row */}
                                        <div className="d-flex justify-content-start align-items-start gap-3 mb-4">
                                            {/* AI Bot Avatar Circle */}
                                            <div 
                                                style={{
                                                    width: '42px',
                                                    height: '42px',
                                                    borderRadius: '14px',
                                                    background: 'linear-gradient(135deg, #0ea5a3 0%, #0f2a3f 100%)',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.25rem',
                                                    boxShadow: '0 6px 14px rgba(14,165,163,0.3)',
                                                    border: '2px solid rgba(255,255,255,0.8)',
                                                    flexShrink: 0,
                                                    marginTop: '2px'
                                                }}
                                            >
                                                <i className="bi bi-robot"></i>
                                            </div>

                                            {/* AI Message Card */}
                                            <div className="flex-grow-1" style={{ maxWidth: 'calc(100% - 56px)' }}>
                                                <div 
                                                    className="glass-card" 
                                                    style={{ 
                                                        background: '#ffffff', 
                                                        borderRadius: '4px 22px 22px 22px', 
                                                        border: '1.5px solid rgba(14,165,163,0.22)', 
                                                        boxShadow: '0 6px 22px rgba(15,42,63,0.05)',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {/* AI Header Bar */}
                                                    <div 
                                                        className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-4 py-2.5"
                                                        style={{ 
                                                            background: 'linear-gradient(90deg, rgba(14,165,163,0.06) 0%, rgba(248,250,252,0.8) 100%)',
                                                            borderBottom: '1px solid rgba(14,165,163,0.14)'
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span 
                                                                className="badge d-inline-flex align-items-center gap-1.5"
                                                                style={{ 
                                                                    background: 'rgba(14,165,163,0.14)', 
                                                                    color: 'var(--teal-1, #0ea5a3)', 
                                                                    border: '1px solid rgba(14,165,163,0.3)', 
                                                                    padding: '0.42rem 0.85rem', 
                                                                    borderRadius: '20px', 
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 600
                                                                }}
                                                            >
                                                                <i className="bi bi-shield-check"></i>
                                                                <span>{conv.provider || 'SIGAP Security Knowledge Base'} ({conv.model_used || selectedModel})</span>
                                                            </span>
                                                        </div>

                                                        <div className="d-flex align-items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(conv.ai_response);
                                                                    toast.info('Tersalin', 'Seluruh isi rekomendasi solusi berhasil disalin.');
                                                                }}
                                                                className="btn btn-sm btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-1"
                                                                style={{ fontSize: '0.78rem', color: '#64748b' }}
                                                                title="Salin seluruh teks jawaban"
                                                            >
                                                                <i className="bi bi-clipboard"></i>
                                                                <span>Salin Solusi</span>
                                                            </button>

                                                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                                <i className="bi bi-clock me-1"></i>
                                                                {conv.created_at ? new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Baru Saja'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* AI Content */}
                                                    <div className="p-4 p-md-4.5">
                                                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom border-light">
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(14,165,163,0.12)', color: '#0ea5a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                                                                <i className="bi bi-chat-quote-fill"></i>
                                                            </div>
                                                            <h6 className="m-0 fw-bold" style={{ fontSize: '0.98rem', color: 'var(--ink-dark, #0f2a3f)' }}>
                                                                Rekomendasi Pemulihan Insiden Keamanan
                                                            </h6>
                                                        </div>

                                                        <div className="ai-markdown-output" style={{ color: 'var(--ink, #334155)' }}>
                                                            {renderMarkdownContent(conv.ai_response, conv.id || idx)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {isGenerating && (
                                <div className="cyber-scanner-card my-3 p-4 p-md-5 text-center position-relative overflow-hidden" style={{
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 45%, #f5f3ff 100%)',
                                    borderRadius: '24px',
                                    border: '1.5px solid rgba(14,165,163,0.4)',
                                    animation: 'cyberBorderGlow 4s ease-in-out infinite',
                                    position: 'relative'
                                }}>
                                    
                                    {/* Embedded Cyber Animation Keyframes */}
                                    <style>{`
                                        @keyframes cyberRotateCw {
                                            from { transform: rotate(0deg); }
                                            to { transform: rotate(360deg); }
                                        }
                                        @keyframes cyberRotateCcw {
                                            from { transform: rotate(360deg); }
                                            to { transform: rotate(0deg); }
                                        }
                                        @keyframes cyberPulseWave {
                                            0% { transform: scale(0.7); opacity: 0.9; }
                                            50% { transform: scale(1.35); opacity: 0.3; }
                                            100% { transform: scale(1.7); opacity: 0; }
                                        }
                                        @keyframes laserScanSweep {
                                            0% { top: 0%; opacity: 0; }
                                            20% { opacity: 0.85; }
                                            80% { opacity: 0.85; }
                                            100% { top: 100%; opacity: 0; }
                                        }
                                        @keyframes equalizerWave {
                                            0%, 100% { height: 6px; }
                                            50% { height: 26px; }
                                        }
                                        @keyframes cyberBorderGlow {
                                            0%, 100% {
                                                box-shadow: 0 10px 35px -10px rgba(14, 165, 163, 0.28), 0 0 0 1px rgba(14, 165, 163, 0.3);
                                            }
                                            50% {
                                                box-shadow: 0 15px 45px -8px rgba(99, 102, 241, 0.32), 0 0 0 1.5px rgba(99, 102, 241, 0.45);
                                            }
                                        }
                                        @keyframes blinkCursor {
                                            0%, 49% { opacity: 1; }
                                            50%, 100% { opacity: 0; }
                                        }
                                        @keyframes shimmerRun {
                                            0% { transform: translateX(-100%); }
                                            100% { transform: translateX(250%); }
                                        }
                                        @keyframes floatIcon {
                                            0%, 100% { transform: translateY(0px) scale(1); }
                                            50% { transform: translateY(-4px) scale(1.05); }
                                        }
                                    `}</style>

                                    {/* Sweeping Laser Scan Line */}
                                    <div 
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            height: '2.5px',
                                            background: 'linear-gradient(90deg, transparent, #0ea5a3, #6366f1, #0ea5a3, transparent)',
                                            boxShadow: '0 0 14px 2px rgba(14, 165, 163, 0.75)',
                                            animation: 'laserScanSweep 3s ease-in-out infinite',
                                            pointerEvents: 'none',
                                            zIndex: 2
                                        }} 
                                    />

                                    {/* Concentric Holographic HUD Core */}
                                    <div className="d-flex justify-content-center mb-3">
                                        <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                            
                                                {/* Outer Dashed Rotating Ring */}
                                                <div 
                                                    style={{
                                                        position: 'absolute',
                                                        width: '98px',
                                                        height: '98px',
                                                        borderRadius: '50%',
                                                        border: '2px dashed rgba(14, 165, 163, 0.5)',
                                                        animation: 'cyberRotateCw 10s linear infinite'
                                                    }}
                                                />

                                                {/* Middle Dotted Counter-Rotating Ring */}
                                                <div 
                                                    style={{
                                                        position: 'absolute',
                                                        width: '82px',
                                                        height: '82px',
                                                        borderRadius: '50%',
                                                        border: '2px dotted rgba(99, 102, 241, 0.55)',
                                                        animation: 'cyberRotateCcw 7s linear infinite'
                                                    }}
                                                />

                                                {/* Expanding Radar Pulse Ring */}
                                                <div 
                                                    style={{
                                                        position: 'absolute',
                                                        width: '74px',
                                                        height: '74px',
                                                        borderRadius: '50%',
                                                        border: '2px solid rgba(14, 165, 163, 0.6)',
                                                        animation: 'cyberPulseWave 2.2s ease-out infinite'
                                                    }}
                                                />

                                                {/* Central AI Glowing Core Orb */}
                                                <div style={{
                                                    width: '62px',
                                                    height: '62px',
                                                    borderRadius: '20px',
                                                    background: 'linear-gradient(135deg, #0ea5a3 0%, #0f2a3f 100%)',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.9rem',
                                                    boxShadow: '0 8px 25px rgba(14, 165, 163, 0.45), inset 0 0 15px rgba(255,255,255,0.25)',
                                                    animation: 'floatIcon 2.5s ease-in-out infinite',
                                                    zIndex: 3
                                                }}>
                                                    {scanStage === 1 && <i className="bi bi-shield-lock-fill"></i>}
                                                    {scanStage === 2 && <i className="bi bi-cpu-fill"></i>}
                                                    {scanStage === 3 && <i className="bi bi-terminal-fill"></i>}
                                                </div>
                                        </div>
                                    </div>

                                    {/* Neural Frequency Equalizer Bars */}
                                    <div className="d-flex align-items-center justify-content-center gap-1.5 mb-3" style={{ height: '28px' }}>
                                        {[0.1, 0.45, 0.2, 0.6, 0.25, 0.5, 0.15].map((delay, i) => (
                                            <div 
                                                key={i} 
                                                style={{
                                                    width: '3.5px',
                                                    borderRadius: '4px',
                                                    background: i % 2 === 0 ? 'linear-gradient(180deg, #0ea5a3, #0284c7)' : 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                                                    animation: `equalizerWave 1.1s ease-in-out infinite ${delay}s`
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Main Title */}
                                    <h5 className="fw-bold mb-1.5" style={{ fontSize: '1.18rem', color: 'var(--ink-dark)' }}>
                                        Pakar AI SIGAP ({selectedModel}) Sedang Menganalisis...
                                    </h5>

                                    {/* Animated Live Subtext */}
                                    <p className="fw-medium mb-3 d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '0.92rem', color: 'var(--teal-1)', transition: 'all 0.3s ease' }}>
                                        <i className="bi bi-shield-check"></i>
                                        <span>{scanSubtexts[scanSubtextIndex]}</span>
                                    </p>

                                    {/* Interactive Dynamic Step Badges */}
                                    <div className="d-flex justify-content-center gap-2.5 flex-wrap mb-3.5">
                                        {/* Step 1 */}
                                        <span 
                                            className="badge px-3.5 py-2 rounded-pill d-inline-flex align-items-center gap-2 transition-all"
                                            style={{ 
                                                background: scanStage === 1 ? 'rgba(14,165,163,0.18)' : scanStage > 1 ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.04)',
                                                color: scanStage === 1 ? '#0ea5a3' : scanStage > 1 ? '#10b981' : '#94a3b8',
                                                border: scanStage === 1 ? '1.5px solid #0ea5a3' : scanStage > 1 ? '1.5px solid #10b981' : '1px solid rgba(0,0,0,0.08)',
                                                boxShadow: scanStage === 1 ? '0 0 14px rgba(14,165,163,0.35)' : 'none',
                                                fontSize: '0.82rem',
                                                fontWeight: scanStage === 1 ? 700 : 500
                                            }}
                                        >
                                            {scanStage === 1 ? (
                                                <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                                            ) : scanStage > 1 ? (
                                                <i className="bi bi-check-circle-fill text-success"></i>
                                            ) : (
                                                <i className="bi bi-circle"></i>
                                            )}
                                            1. Inspect Payload
                                        </span>

                                        {/* Step 2 */}
                                        <span 
                                            className="badge px-3.5 py-2 rounded-pill d-inline-flex align-items-center gap-2 transition-all"
                                            style={{ 
                                                background: scanStage === 2 ? 'rgba(99,102,241,0.18)' : scanStage > 2 ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.04)',
                                                color: scanStage === 2 ? '#6366f1' : scanStage > 2 ? '#10b981' : '#94a3b8',
                                                border: scanStage === 2 ? '1.5px solid #6366f1' : scanStage > 2 ? '1.5px solid #10b981' : '1px solid rgba(0,0,0,0.08)',
                                                boxShadow: scanStage === 2 ? '0 0 14px rgba(99,102,241,0.35)' : 'none',
                                                fontSize: '0.82rem',
                                                fontWeight: scanStage === 2 ? 700 : 500
                                            }}
                                        >
                                            {scanStage === 2 ? (
                                                <span className="spinner-grow spinner-grow-sm" style={{ width: '12px', height: '12px' }}></span>
                                            ) : scanStage > 2 ? (
                                                <i className="bi bi-check-circle-fill text-success"></i>
                                            ) : (
                                                <i className="bi bi-circle"></i>
                                            )}
                                            2. Synthesize Fixes
                                        </span>

                                        {/* Step 3 */}
                                        <span 
                                            className="badge px-3.5 py-2 rounded-pill d-inline-flex align-items-center gap-2 transition-all"
                                            style={{ 
                                                background: scanStage === 3 ? 'rgba(16,185,129,0.18)' : 'rgba(0,0,0,0.04)',
                                                color: scanStage === 3 ? '#10b981' : '#94a3b8',
                                                border: scanStage === 3 ? '1.5px solid #10b981' : '1px solid rgba(0,0,0,0.08)',
                                                boxShadow: scanStage === 3 ? '0 0 14px rgba(16,185,129,0.35)' : 'none',
                                                fontSize: '0.82rem',
                                                fontWeight: scanStage === 3 ? 700 : 500
                                            }}
                                        >
                                            {scanStage === 3 ? (
                                                <i className="bi bi-lightning-charge-fill text-warning"></i>
                                            ) : (
                                                <i className="bi bi-code-slash"></i>
                                            )}
                                            3. Generate Shell Script
                                        </span>
                                    </div>

                                    {/* High-Tech Terminal Console Ticker */}
                                    <div 
                                        className="mx-auto mb-3 px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-2"
                                        style={{
                                            background: 'rgba(15, 42, 63, 0.88)',
                                            color: '#67e8f9',
                                            fontFamily: 'Fira Code, monospace',
                                            fontSize: '0.78rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                                            border: '1px solid rgba(14,165,163,0.35)',
                                            maxWidth: '92%'
                                        }}
                                    >
                                        <span style={{ color: '#10b981' }}>●</span>
                                        <span className="text-teal" style={{ color: '#0ea5a3' }}>[SEC-AI]</span>
                                        <span className="text-light text-truncate">
                                            {scanStage === 1 && `Scanning HTTP vectors & payload signatures...`}
                                            {scanStage === 2 && `Synthesizing CVE mitigation rules & security headers...`}
                                            {scanStage === 3 && `Compiling bash hardening script & rollback tests...`}
                                        </span>
                                        <span style={{ animation: 'blinkCursor 0.8s infinite', color: '#67e8f9', fontWeight: 'bold' }}>▌</span>
                                    </div>

                                    {/* Shimmer Laser Progress Line */}
                                    <div className="position-relative mx-auto" style={{ height: '6px', width: '70%', maxWidth: '480px', borderRadius: '10px', background: 'rgba(14,165,163,0.12)', overflow: 'hidden' }}>
                                        <div 
                                            className="w-100 h-100" 
                                            style={{ 
                                                background: 'linear-gradient(90deg, #0ea5a3, #6366f1, #10b981)',
                                                borderRadius: '10px',
                                                opacity: 0.9
                                            }} 
                                        />
                                        <div 
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                bottom: 0,
                                                width: '70px',
                                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
                                                boxShadow: '0 0 16px 4px rgba(255,255,255,0.85)',
                                                animation: 'shimmerRun 1.8s ease-in-out infinite'
                                            }}
                                        />
                                    </div>

                                </div>
                            )}
                        </div>

                        {/* Interactive Modern AI Prompt Composer Card */}
                        <div 
                            className="prompt-composer-card p-3.5 mb-2 transition-all position-relative" 
                            style={{ 
                                background: isInputFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.98)', 
                                borderRadius: '22px', 
                                border: isInputFocused 
                                    ? '1.8px solid #0ea5a3' 
                                    : '1.5px solid rgba(14, 165, 163, 0.28)', 
                                boxShadow: isInputFocused 
                                    ? '0 12px 36px -4px rgba(14, 165, 163, 0.22), 0 0 0 3px rgba(14, 165, 163, 0.12)' 
                                    : '0 6px 22px rgba(15, 42, 63, 0.04)',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        >
                            {/* Card Header & Shortcuts */}
                            <div className="d-flex justify-content-between align-items-center mb-2.5 flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2">
                                    <span 
                                        className="d-inline-flex align-items-center justify-content-center text-teal rounded-circle" 
                                        style={{ 
                                            width: '24px', 
                                            height: '24px', 
                                            background: 'rgba(14, 165, 163, 0.12)', 
                                            color: '#0ea5a3',
                                            fontSize: '0.85rem' 
                                        }}
                                    >
                                        <i className="bi bi-chat-left-dots-fill"></i>
                                    </span>
                                    <span className="fw-bold" style={{ fontSize: '0.9rem', color: 'var(--ink-dark, #0f2a3f)' }}>
                                        Konsultasi Lanjutan & Perintah Teknis
                                    </span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    {extraContext.length > 0 && (
                                        <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                            {extraContext.length}/1000
                                        </span>
                                    )}
                                    <span className="text-muted fw-normal d-none d-sm-inline" style={{ fontSize: '0.74rem' }}>
                                        Tekan <kbd style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.12rem 0.4rem', borderRadius: '5px', fontSize: '0.7rem' }}>Enter ↵</kbd> untuk kirim
                                    </span>
                                </div>
                            </div>

                            {/* Contextual Interactive Quick Prompt Chips */}
                            <div className="d-flex align-items-center gap-2 mb-2.5 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                <span className="text-muted d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                                    <i className="bi bi-stars text-teal" style={{ color: '#0ea5a3' }}></i>
                                    <span>Bantuan Cepat:</span>
                                </span>
                                {quickPrompts.map((qp, qIdx) => (
                                    <button
                                        key={qIdx}
                                        type="button"
                                        onClick={() => handleQuickFill(qp.text)}
                                        className="btn btn-sm text-nowrap d-inline-flex align-items-center gap-1.5 py-1 px-2.5 transition-all"
                                        style={{
                                            fontSize: '0.76rem',
                                            borderRadius: '20px',
                                            background: extraContext === qp.text ? 'rgba(14,165,163,0.15)' : '#f8fafc',
                                            color: extraContext === qp.text ? '#0ea5a3' : '#475569',
                                            border: extraContext === qp.text ? '1px solid #0ea5a3' : '1px solid #e2e8f0',
                                            fontWeight: 500,
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(14,165,163,0.12)';
                                            e.currentTarget.style.color = '#0ea5a3';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (extraContext !== qp.text) {
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.color = '#475569';
                                            }
                                            e.currentTarget.style.transform = 'none';
                                        }}
                                    >
                                        <i className={`bi ${qp.icon}`} style={{ fontSize: '0.75rem' }}></i>
                                        <span>{qp.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Textarea Input with Inside Clear Button */}
                            <div className="position-relative">
                                <textarea 
                                    ref={textareaRef}
                                    className="form-control"
                                    rows={3}
                                    placeholder="Tanyakan detail teknis, perintah konfigurasi, atau kendala server Anda... (Contoh: Webserver Nginx 1.24 + OS Ubuntu 22.04)"
                                    value={extraContext}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)}
                                    onChange={(e) => setExtraContext(e.target.value)}
                                    maxLength={1000}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (!isGenerating && (extraContext.trim() || conversations.length === 0)) {
                                                handleGenerate();
                                            }
                                        }
                                    }}
                                    style={{ 
                                        borderRadius: '16px', 
                                        fontSize: '0.92rem', 
                                        border: isInputFocused ? '1.5px solid #0ea5a3' : '1.5px solid #e2e8f0', 
                                        background: isInputFocused ? '#ffffff' : '#f8fafc', 
                                        padding: '0.85rem 1.1rem', 
                                        paddingRight: extraContext ? '2.5rem' : '1.1rem',
                                        lineHeight: '1.6',
                                        resize: 'none',
                                        transition: 'all 0.2s ease',
                                        color: '#1e293b'
                                    }}
                                ></textarea>

                                {/* Clear Input Button */}
                                {extraContext.length > 0 && !isGenerating && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setExtraContext('');
                                            if (textareaRef.current) textareaRef.current.focus();
                                        }}
                                        className="btn btn-sm btn-link text-muted position-absolute p-0 d-flex align-items-center justify-content-center"
                                        style={{
                                            top: '12px',
                                            right: '12px',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: '#e2e8f0',
                                            color: '#64748b',
                                            fontSize: '0.75rem',
                                            textDecoration: 'none'
                                        }}
                                        title="Kosongkan input"
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}
                            </div>
                            
                            {/* Action Bar: Model Capsule & Animated Send Button */}
                            <div className="d-flex justify-content-between align-items-center mt-3 pt-1 flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <div 
                                        className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill shadow-xs" 
                                        style={{ 
                                            background: '#f1f5f9', 
                                            border: '1px solid #e2e8f0',
                                            transition: 'border-color 0.2s ease'
                                        }}
                                    >
                                        <span 
                                            style={{ 
                                                width: '8px', 
                                                height: '8px', 
                                                borderRadius: '50%', 
                                                background: '#10b981', 
                                                display: 'inline-block', 
                                                boxShadow: '0 0 8px #10b981' 
                                            }}
                                        ></span>
                                        <span className="text-muted fw-semibold" style={{ fontSize: '0.76rem' }}>Model:</span>
                                        <select 
                                            className="form-select form-select-sm border-0 p-0 fw-bold" 
                                            style={{ 
                                                fontSize: '0.78rem', 
                                                width: 'auto', 
                                                background: 'transparent', 
                                                color: '#0f2a3f',
                                                cursor: 'pointer',
                                                boxShadow: 'none'
                                            }}
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            disabled={isGenerating}
                                        >
                                            {availableModels.map(m => (
                                                <option key={m.id} value={m.id}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <span className="text-muted d-none d-md-inline" style={{ fontSize: '0.73rem' }}>
                                        <i className="bi bi-shield-check text-teal me-1" style={{ color: '#0ea5a3' }}></i>
                                        Sesi Terenkripsi & Guardrail Aktif
                                    </span>
                                </div>

                                <button 
                                    className="btn d-inline-flex align-items-center gap-2 text-white shadow-sm transition-all"
                                    style={{ 
                                        background: isGenerating 
                                            ? 'linear-gradient(135deg, #64748b, #475569)' 
                                            : 'linear-gradient(135deg, #0ea5a3 0%, #2563eb 100%)', 
                                        borderRadius: '14px', 
                                        padding: '0.68rem 1.7rem', 
                                        fontSize: '0.9rem', 
                                        fontWeight: 600,
                                        border: 'none',
                                        boxShadow: isGenerating ? 'none' : '0 6px 18px rgba(14, 165, 163, 0.35)',
                                        transform: isInputFocused ? 'scale(1.02)' : 'scale(1)',
                                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                            <span>Menganalisis...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send-fill" style={{ fontSize: '0.92rem', transform: 'rotate(5deg)' }}></i>
                                            <span>{conversations.length === 0 ? 'Generate Solusi AI' : 'Kirim Pertanyaan'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="modal-footer border-top px-4 px-lg-5 py-3.5 bg-white d-flex justify-content-between align-items-center">
                        <button type="button" className="btn btn-light" onClick={handleSafeClose} style={{ borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500, padding: '0.6rem 1.4rem' }}>
                            Tutup
                        </button>

                        <button 
                            type="button" 
                            className="btn btn-success d-flex align-items-center gap-2"
                            style={{ borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, background: '#0ea5a3', borderColor: '#0ea5a3', padding: '0.6rem 1.5rem' }}
                            onClick={handleMarkResolved}
                        >
                            <i className="bi bi-check2-circle" style={{ fontSize: '1.05rem' }}></i>
                            <span>Tandai Insiden Selesai</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
