import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from '@/Components/DynamicToast';
import ConfirmModal from '@/Components/ConfirmModal';

interface DeleteUserModalProps {
    show: boolean;
    onClose: () => void;
    user: any | null;
}

export default function DeleteUserModal({ show, onClose, user }: DeleteUserModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!show || !user) return null;

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(route('users.destroy', user.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Berhasil', `Akun pengguna "${user.name}" telah dihapus.`);
                setIsDeleting(false);
                onClose();
            },
            onError: (errs) => {
                const firstErr = Object.values(errs)[0];
                toast.error('Gagal Menghapus', typeof firstErr === 'string' ? firstErr : 'Terjadi kesalahan sistem.');
                setIsDeleting(false);
                onClose();
            }
        });
    };

    return (
        <ConfirmModal
            show={show}
            title="Hapus Akun Pengguna?"
            itemName={user.name}
            itemDetails={`@${user.username} • ${user.email} (${user.role_label || user.role_name})`}
            message="Data akun pengguna ini akan dihapus dari sistem SIGAP dan akses login akan dicabut seketika."
            confirmText="Ya, Hapus Pengguna"
            cancelText="Batal"
            size="xl"
            warningPoints={[
                "Seluruh hak akses peran (RBAC) dan izin login pengguna akan dicabut seketika.",
                "Riwayat aktivitas log tetap diarsipkan untuk kebutuhan audit sistem.",
                "Tindakan ini permanen dan tidak dapat dibatalkan."
            ]}
            onConfirm={handleDelete}
            onCancel={() => !isDeleting && onClose()}
            isProcessing={isDeleting}
        />
    );
}
