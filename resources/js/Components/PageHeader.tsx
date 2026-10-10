import { Link } from '@inertiajs/react';
import React from 'react';
import '../../css/page-header.css';

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: string;
    active?: boolean;
}

export interface BreadcrumbProps {
    items?: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
    if (!items || items.length === 0) return null;

    return (
        <nav aria-label="breadcrumb" className={`sigap-breadcrumbs ${className}`}>
            {items.map((item, index) => {
                const isLast = index === items.length - 1 || item.active;

                return (
                    <React.Fragment key={index}>
                        {isLast || !item.href ? (
                            <span className={`sigap-breadcrumb-item ${isLast ? 'active' : ''}`}>
                                {item.icon && <i className={`bi ${item.icon}`}></i>}
                                {item.label}
                            </span>
                        ) : (
                            <Link href={item.href} className="sigap-breadcrumb-item">
                                {item.icon && <i className={`bi ${item.icon}`}></i>}
                                {item.label}
                            </Link>
                        )}

                        {!isLast && (
                            <i className="bi bi-chevron-right sigap-breadcrumb-separator"></i>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}

export interface PageStatusPill {
    label?: string;
    value: string;
    icon?: string;
    type?: 'optimal' | 'warning' | 'danger';
}

export interface PageHeaderProps {
    title: React.ReactNode | string;
    subtitle?: React.ReactNode | string;
    icon?: string;
    iconGradient?: string;
    breadcrumbs?: BreadcrumbItem[];
    status?: PageStatusPill;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    subtitle,
    icon = 'bi-grid-fill',
    iconGradient = 'linear-gradient(135deg, var(--teal-1), var(--blue-1))',
    breadcrumbs,
    status,
    actions,
    children,
    className = '',
}: PageHeaderProps) {
    return (
        <div className={`sigap-page-header ${className}`}>
            <div className="sigap-page-header-left">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <Breadcrumb items={breadcrumbs} />
                )}

                <div className="sigap-page-title-row">
                    {icon && (
                        <div
                            className="sigap-page-icon"
                            style={{ background: iconGradient }}
                        >
                            <i className={`bi ${icon}`}></i>
                        </div>
                    )}
                    <div>
                        <h1 className="sigap-page-title">{title}</h1>
                        {subtitle && <p className="sigap-page-subtitle">{subtitle}</p>}
                    </div>
                </div>
            </div>

            {(status || actions || children) && (
                <div className="d-flex align-items-center gap-3">
                    {status && (
                        <div className={`sigap-status-pill sigap-status-${status.type || 'optimal'}`}>
                            <div className="sigap-status-text">
                                <span className="sigap-status-label">{status.label || 'Status Sistem'}</span>
                                <span className="sigap-status-value">
                                    <span className="sigap-status-dot"></span>
                                    {status.value}
                                </span>
                            </div>
                            <div className="sigap-status-icon-wrap">
                                <i className={`bi ${status.icon || 'bi-shield-check'}`}></i>
                            </div>
                        </div>
                    )}
                    {actions}
                    {children}
                </div>
            )}
        </div>
    );
}
