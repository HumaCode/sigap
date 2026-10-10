import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';
import ConfirmModal from '@/Components/ConfirmModal';
import { KeywordItem } from './KeywordTable';

interface DeleteKeywordModalProps {
    show: boolean;
    onClose: () => void;
    keyword: KeywordItem | null;
}

export default function DeleteKeywordModal({ show, onClose, keyword }: DeleteKeywordModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!show || !keyword) return null;

    const categoryMap: Record<string, string> = {
        'judol': 'Judi Online',
        'obat': 'Obat Terlarang',
        'hidden': 'Teks Tersembunyi',
        'newpage': 'Halaman Baru',
        'phising': 'Phising / Deface',
        'lainnya': 'Lainnya',
    };

    const handleDelete = () => {
        setIsDeleting(true);
        const keywordName = keyword.keyword;

        router.delete(route('keywords.destroy', keyword.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Berhasil Dihapus', `Kata kunci "${keywordName}" berhasil dihapus dari sistem.`);
                setIsDeleting(false);
                onClose();
                if (typeof window !== 'undefined') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0];
                toast.error('Gagal Menghapus', typeof firstErr === 'string' ? firstErr : 'Terjadi kesalahan sistem.');
                setIsDeleting(false);
                onClose();
            }
        });
    };

    const catLabel = categoryMap[keyword.category] || keyword.category;
    const typeLabel = keyword.type === 'regex' ? 'Pola Regex' : 'Teks Biasa';

    return (
        <ConfirmModal
            show={show}
            title="Hapus Kata Kunci?"
            itemName={keyword.keyword}
            itemDetails={`Kategori: ${catLabel} • Tipe: ${typeLabel} ${keyword.description ? `• "${keyword.description}"` : ''}`}
            message="Pola kata kunci ini akan dihapus secara permanen dari kamus deteksi mesin scanner SIGAP."
            confirmText="Ya, Hapus Kata Kunci"
            cancelText="Batal"
            size="xl"
            icon="bi bi-trash3-fill"
            variant="danger"
            warningPoints={[
                "Mesin pemindai otomatis tidak akan lagi mencari kata kunci ini pada jadwal pemindaian berikutnya.",
                "Konten halaman yang memuat pola ini tidak akan otomatis ditandai sebagai anomali/pelanggaran.",
                "Tindakan penghapusan ini bersifat permanen dan tidak dapat dibatalkan."
            ]}
            onConfirm={handleDelete}
            onCancel={() => !isDeleting && onClose()}
            isProcessing={isDeleting}
        />
    );
}
