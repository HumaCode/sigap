import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';
import ConfirmModal from '@/Components/ConfirmModal';
import { KeywordItem } from './KeywordTable';

interface ToggleKeywordModalProps {
    show: boolean;
    onClose: () => void;
    keyword: KeywordItem | null;
}

export default function ToggleKeywordModal({ show, onClose, keyword }: ToggleKeywordModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!show || !keyword) return null;

    const categoryMap: Record<string, string> = {
        'judol': 'Judi Online',
        'obat': 'Obat Terlarang',
        'hidden': 'Teks Tersembunyi',
        'newpage': 'Halaman Baru',
        'phising': 'Phising / Deface',
        'lainnya': 'Lainnya',
    };

    const isCurrentlyActive = Boolean(keyword.is_active);
    const nextStatus = !isCurrentlyActive;
    const catLabel = categoryMap[keyword.category] || keyword.category;
    const typeLabel = keyword.type === 'regex' ? 'Pola Regex' : 'Teks Biasa';

    const handleConfirm = () => {
        setIsProcessing(true);
        const keywordName = keyword.keyword;

        router.patch(route('keywords.update', keyword.id), {
            keyword: keyword.keyword,
            category: keyword.category,
            type: keyword.type,
            description: keyword.description || '',
            is_active: nextStatus,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    nextStatus ? 'Kata Kunci Diaktifkan' : 'Kata Kunci Dinonaktifkan',
                    `Kata kunci "${keywordName}" berhasil ${nextStatus ? 'diaktifkan kembali untuk pemindaian.' : 'dinonaktifkan sementara.'}`
                );
                setIsProcessing(false);
                onClose();
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            },
            onError: (errs: any) => {
                const firstErr = Object.values(errs)[0];
                toast.error('Gagal', typeof firstErr === 'string' ? firstErr : 'Terjadi kesalahan sistem saat mengubah status.');
                setIsProcessing(false);
            }
        });
    };

    if (isCurrentlyActive) {
        // Will be DEACTIVATED
        return (
            <ConfirmModal
                show={show}
                title="Nonaktifkan Kata Kunci?"
                itemName={keyword.keyword}
                itemDetails={`Kategori: ${catLabel} • Tipe: ${typeLabel} ${keyword.description ? `• "${keyword.description}"` : ''}`}
                message="Kata kunci ini akan dinonaktifkan dari scanner pemindai dan sementara dilewati saat pemindaian situs."
                confirmText="Ya, Nonaktifkan"
                cancelText="Batal"
                size="xl"
                icon="bi bi-pause-circle-fill"
                variant="warning"
                warningTitle="Informasi & dampak penonaktifan:"
                warningPoints={[
                    "Mesin pemindai otomatis tidak akan mencari kata kunci ini pada jadwal pemindaian berikutnya.",
                    "Konten halaman yang memuat pola ini tidak akan ditandai sebagai indikasi anomali/pelanggaran.",
                    "Anda dapat mengaktifkannya kembali sewaktu-waktu tanpa kehilangan data."
                ]}
                onConfirm={handleConfirm}
                onCancel={() => !isProcessing && onClose()}
                isProcessing={isProcessing}
            />
        );
    }

    // Will be ACTIVATED
    return (
        <ConfirmModal
            show={show}
            title="Aktifkan Kata Kunci?"
            itemName={keyword.keyword}
            itemDetails={`Kategori: ${catLabel} • Tipe: ${typeLabel} ${keyword.description ? `• "${keyword.description}"` : ''}`}
            message="Kata kunci ini akan diaktifkan kembali untuk memindai konten website dari indikasi sisipan konten berbahaya."
            confirmText="Ya, Aktifkan Kata Kunci"
            cancelText="Batal"
            size="xl"
            icon="bi bi-check-circle-fill"
            variant="primary"
            warningTitle="Informasi & dampak aktivasi:"
            warningPoints={[
                "Mesin scanner akan otomatis menyertakan kata kunci ini pada jadwal pemindaian website mendatang.",
                "Setiap kemunculan teks atau pola ini pada halaman situs akan dicatat ke dalam log deteksi anomali."
            ]}
            onConfirm={handleConfirm}
            onCancel={() => !isProcessing && onClose()}
            isProcessing={isProcessing}
        />
    );
}
