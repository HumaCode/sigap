import { Link } from '@inertiajs/react';
import React from 'react';
import '../../css/pagination.css';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    path?: string;
    per_page?: number;
}

export interface PaginationProps {
    links?: PaginationLink[];
    meta?: PaginationMeta;
    itemLabel?: string;
    className?: string;
    onPageChange?: (page: number) => void;
}

export default function Pagination({
    links,
    meta,
    itemLabel = 'entri',
    className = '',
    onPageChange
}: PaginationProps) {
    // If neither meta nor links provided, return null
    if (!meta && (!links || links.length === 0)) return null;

    // Normalize pagination state from either meta, unwrapped paginator, or links
    let currentPage = 1;
    let lastPage = 1;
    let from = 0;
    let to = 0;
    let total = 0;

    const sourceMeta: any = meta || (links as any)?.meta || (links as any);
    if (sourceMeta && typeof sourceMeta === 'object' && sourceMeta.total !== undefined) {
        currentPage = sourceMeta.current_page || 1;
        lastPage = sourceMeta.last_page || 1;
        from = sourceMeta.from || 0;
        to = sourceMeta.to || 0;
        total = sourceMeta.total || 0;
    } else if (meta) {
        currentPage = meta.current_page || 1;
        lastPage = meta.last_page || 1;
        from = meta.from || 0;
        to = meta.to || 0;
        total = meta.total || 0;
    } else if (links && links.length > 0) {
        // Extract active page from links
        const activeLink = links.find((l) => l.active);
        if (activeLink && !isNaN(Number(activeLink.label))) {
            currentPage = Number(activeLink.label);
        }
        // Extract max page
        const numericLabels = links
            .map((l) => Number(l.label))
            .filter((n) => !isNaN(n));
        lastPage = numericLabels.length > 0 ? Math.max(...numericLabels) : 1;
    }

    // Helper to generate smart sliding window [1, 2, 3, '...', 9, 10]
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const delta = 2; // number of pages around current page

        for (let i = 1; i <= lastPage; i++) {
            if (
                i === 1 ||
                i === lastPage ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }

        return pages;
    };

    const getPageUrl = (pageNumber: number) => {
        if (links && links.length > 0) {
            // Find url matching exact page label
            const match = links.find((l) => l.label === pageNumber.toString());
            if (match && match.url) return match.url;
        }

        // Fallback using URL query string
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('page', pageNumber.toString());
            return `${url.pathname}?${url.searchParams.toString()}`;
        }

        return '#';
    };

    const handleCleanUrl = () => {
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className={`sigap-pagination-container ${className}`}>
            <span className="sigap-pagination-info">
                {total > 0
                    ? `Menampilkan ${from}–${to} dari ${total} ${itemLabel}`
                    : `Menampilkan 0 dari 0 ${itemLabel}`}
            </span>

            <div className="sigap-pagination-controls">
                {/* Previous Button */}
                {currentPage > 1 ? (
                    onPageChange ? (
                        <button
                            type="button"
                            onClick={() => onPageChange(currentPage - 1)}
                            className="pg-btn"
                            title="Halaman Sebelumnya"
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                    ) : (
                        <Link
                            href={getPageUrl(currentPage - 1)}
                            className="pg-btn"
                            preserveScroll
                            preserveState
                            onSuccess={handleCleanUrl}
                            onFinish={handleCleanUrl}
                            title="Halaman Sebelumnya"
                        >
                            <i className="bi bi-chevron-left"></i>
                        </Link>
                    )
                ) : (
                    <button className="pg-btn opacity-50" disabled style={{ cursor: 'not-allowed' }}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                )}

                {/* Numbered Page Links */}
                {pageNumbers.map((page, idx) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${idx}`}
                                className="pg-btn-ellipsis"
                            >
                                ...
                            </span>
                        );
                    }

                    const pageNum = page as number;
                    const isActive = pageNum === currentPage;

                    if (onPageChange) {
                        return (
                            <button
                                key={`page-${pageNum}`}
                                type="button"
                                onClick={() => onPageChange(pageNum)}
                                className={`pg-btn ${isActive ? 'active' : ''}`}
                            >
                                {pageNum}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={`page-${pageNum}`}
                            href={getPageUrl(pageNum)}
                            className={`pg-btn ${isActive ? 'active' : ''}`}
                            preserveScroll
                            preserveState
                            onSuccess={handleCleanUrl}
                            onFinish={handleCleanUrl}
                        >
                            {pageNum}
                        </Link>
                    );
                })}

                {/* Next Button */}
                {currentPage < lastPage ? (
                    onPageChange ? (
                        <button
                            type="button"
                            onClick={() => onPageChange(currentPage + 1)}
                            className="pg-btn"
                            title="Halaman Selanjutnya"
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    ) : (
                        <Link
                            href={getPageUrl(currentPage + 1)}
                            className="pg-btn"
                            preserveScroll
                            preserveState
                            onSuccess={handleCleanUrl}
                            onFinish={handleCleanUrl}
                            title="Halaman Selanjutnya"
                        >
                            <i className="bi bi-chevron-right"></i>
                        </Link>
                    )
                ) : (
                    <button className="pg-btn opacity-50" disabled style={{ cursor: 'not-allowed' }}>
                        <i className="bi bi-chevron-right"></i>
                    </button>
                )}
            </div>
        </div>
    );
}
