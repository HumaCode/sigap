import React from 'react';
import { Link } from '@inertiajs/react';
import Tooltip from '@/Components/Tooltip';

export interface NotificationItemData {
    id: string;
    type: string;
    title: string;
    message: string;
    severity: string;
    category: string;
    icon: string;
    site_name: string | null;
    action_url: string | null;
    meta?: any;
    read_at: string | null;
    is_read: boolean;
    created_at: string;
    created_at_human: string;
}

interface NotificationItemProps {
    notification: NotificationItemData;
    onMarkAsRead: (notification: NotificationItemData) => void;
    onDelete: (notification: NotificationItemData) => void;
}

export default function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
}: NotificationItemProps) {
    const isCritical = notification.severity === 'critical';
    const isWarning = notification.severity === 'warning';
    const isUnread = !notification.is_read;

    const getSeverityMeta = () => {
        if (isCritical) {
            return {
                bg: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                label: 'Kritis',
                icon: notification.icon || 'bi-shield-slash-fill',
                borderBadge: 'rgba(239, 68, 68, 0.3)',
            };
        }
        if (isWarning) {
            return {
                bg: 'rgba(245, 158, 11, 0.1)',
                color: '#d97706',
                label: 'Peringatan',
                icon: notification.icon || 'bi-shield-exclamation',
                borderBadge: 'rgba(245, 158, 11, 0.3)',
            };
        }
        return {
            bg: 'rgba(14, 165, 163, 0.1)',
            color: 'var(--teal-1)',
            label: 'Info',
            icon: notification.icon || 'bi-info-circle-fill',
            borderBadge: 'rgba(14, 165, 163, 0.3)',
        };
    };

    const meta = getSeverityMeta();

    return (
        <div
            className={`notif-item-card ${isUnread ? 'is-unread' : ''} ${
                isCritical ? 'is-critical' : isWarning ? 'is-warning' : ''
            }`}
        >
            <div className="d-flex align-items-start gap-3">
                {/* Severity Icon Badge */}
                <div
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: meta.bg,
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                    }}
                >
                    <i className={`bi ${meta.icon}`}></i>
                </div>

                {/* Content Area */}
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                        <div className="d-flex align-items-center gap-2">
                            {isUnread && <span className="unread-pulse-dot" title="Belum dibaca"></span>}
                            <h6
                                className="mb-0"
                                style={{
                                    fontSize: '0.92rem',
                                    fontWeight: isUnread ? 700 : 600,
                                    color: 'var(--ink-dark)',
                                }}
                            >
                                {notification.title}
                            </h6>
                            <span
                                style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '6px',
                                    background: meta.bg,
                                    color: meta.color,
                                    border: `1px solid ${meta.borderBadge}`,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.4px',
                                }}
                            >
                                {meta.label}
                            </span>
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 500,
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '6px',
                                    background: 'rgba(0,0,0,0.04)',
                                    color: 'var(--ink-soft)',
                                }}
                            >
                                {notification.category}
                            </span>
                        </div>

                        {/* Timestamp */}
                        <div className="d-flex align-items-center gap-1.5 text-secondary" style={{ fontSize: '0.74rem' }}>
                            <i className="bi bi-clock"></i>
                            <span>{notification.created_at_human}</span>
                            <span className="d-none d-md-inline" style={{ opacity: 0.6 }}>
                                • {notification.created_at}
                            </span>
                        </div>
                    </div>

                    {/* Message Body */}
                    <p
                        className="mb-2"
                        style={{
                            fontSize: '0.84rem',
                            color: 'var(--ink-soft)',
                            lineHeight: 1.5,
                            margin: 0,
                        }}
                    >
                        {notification.message}
                    </p>

                    {/* Footer Info & Actions */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2 pt-1">
                        {/* Site Badge */}
                        {notification.site_name ? (
                            <div
                                className="d-inline-flex align-items-center gap-1.5"
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--ink-soft)',
                                    background: 'rgba(0, 0, 0, 0.03)',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--line)',
                                }}
                            >
                                <i className="bi bi-globe2 text-secondary"></i>
                                <span className="text-truncate" style={{ maxWidth: '280px' }}>
                                    {notification.site_name}
                                </span>
                            </div>
                        ) : (
                            <div></div>
                        )}

                        {/* Action Buttons */}
                        <div className="d-flex align-items-center gap-1.5 ms-auto">
                            {notification.action_url && (
                                <Link
                                    href={notification.action_url}
                                    className="btn btn-sm d-flex align-items-center gap-1"
                                    style={{
                                        fontSize: '0.76rem',
                                        padding: '0.25rem 0.65rem',
                                        borderRadius: '8px',
                                        background: 'rgba(14, 165, 163, 0.08)',
                                        color: 'var(--teal-1)',
                                        fontWeight: 600,
                                        border: '1px solid rgba(14, 165, 163, 0.2)',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <span>Tinjau Detail</span>
                                    <i className="bi bi-arrow-right-short" style={{ fontSize: '1rem' }}></i>
                                </Link>
                            )}

                            {isUnread && (
                                <Tooltip title="Tandai Dibaca" description="Ubah status menjadi sudah dibaca" variant="blue">
                                    <button
                                        onClick={() => onMarkAsRead(notification)}
                                        className="btn btn-sm text-secondary d-flex align-items-center gap-1 border-0"
                                        style={{ fontSize: '0.76rem', padding: '0.25rem 0.5rem' }}
                                    >
                                        <i className="bi bi-check2"></i>
                                        <span>Tandai Dibaca</span>
                                    </button>
                                </Tooltip>
                            )}

                            <Tooltip title="Hapus Notifikasi" description="Hapus pesan notifikasi ini" variant="danger">
                                <button
                                    onClick={() => onDelete(notification)}
                                    className="btn btn-sm text-danger d-flex align-items-center border-0 p-1"
                                    style={{ fontSize: '0.85rem' }}
                                >
                                    <i className="bi bi-trash3"></i>
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
