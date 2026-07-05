import { Link } from '@inertiajs/react';
import React from 'react';

interface PaginationProps {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function Pagination({ links }: PaginationProps) {
    if (links.length <= 3) return null;

    return (
        <div className="pagination-footer">
            <div className="d-flex flex-wrap gap-2">
                {links.map((link, k) => (
                    link.url === null ? (
                        <button
                            type="button"
                            key={k}
                            className="pg-btn"
                            disabled
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <Link
                            key={k}
                            className={`pg-btn ${link.active ? 'active' : ''}`}
                            href={link.url}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            preserveScroll
                            preserveState
                        />
                    )
                ))}
            </div>
        </div>
    );
}
