import React from 'react';
import EmptyState from '@/Components/EmptyState';
import Pagination from '@/Components/Pagination';
import NotificationItem, { NotificationItemData } from './NotificationItem';

interface NotificationListProps {
    notifications: {
        data: NotificationItemData[];
        meta: any;
    };
    onMarkAsRead: (notification: NotificationItemData) => void;
    onDelete: (notification: NotificationItemData) => void;
}

export default function NotificationList({
    notifications,
    onMarkAsRead,
    onDelete,
}: NotificationListProps) {
    const data = notifications.data || [];

    if (data.length === 0) {
        return (
            <div className="glass-card p-5 text-center my-2">
                <EmptyState
                    icon="bi-bell-slash"
                    title="Tidak Ada Notifikasi"
                    description="Belum ada notifikasi atau peringatan yang sesuai dengan filter pencarian Anda saat ini."
                />
            </div>
        );
    }

    return (
        <div>
            <div className="notif-list-items">
                {data.map((item) => (
                    <NotificationItem
                        key={item.id}
                        notification={item}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {/* Pagination footer */}
            {notifications.meta && notifications.meta.total > 0 && (
                <div className="glass-card px-4 py-3 mt-3">
                    <Pagination meta={notifications.meta} itemLabel="notifikasi" />
                </div>
            )}
        </div>
    );
}
