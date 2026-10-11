import React from 'react';
import SecurityRow from './SecurityRow';
import EmptyState from '@/Components/EmptyState';
import Pagination, { PaginationMeta, PaginationLink } from '@/Components/Pagination';

export interface CheckItem {
    key: string;
    title: string;
    status: 'ok' | 'fail' | 'warn';
    desc: string;
    fix?: string;
}

export interface SecurityData {
    id: string;
    site_id: string;
    site: {
        id: string;
        name: string;
        url: string;
        category: string;
    };
    score: number;
    grade: string;
    issues_count: number;
    checks: CheckItem[];
    last_scanned_at: string;
}

interface SecurityListProps {
    securities: {
        data: SecurityData[];
        links?: PaginationLink[];
        meta?: PaginationMeta;
    };
    canScan?: boolean;
    onOpenAi?: (incidentData: any) => void;
    onScanAll: () => void;
    onPageChange?: (page: number) => void;
}

export default function SecurityList({
    securities,
    canScan = true,
    onOpenAi,
    onScanAll,
    onPageChange,
}: SecurityListProps) {
    const list = securities?.data || [];

    return (
        <div>
            {/* Accordion List */}
            <div>
                {list.length > 0 ? (
                    list.map((security) => (
                        <SecurityRow 
                            key={security.id} 
                            security={security} 
                            onOpenAi={onOpenAi}
                        />
                    ))
                ) : (
                    <div className="p-5">
                        <EmptyState 
                            icon="bi-shield-slash"
                            title="Data Keamanan Situs Tidak Ditemukan"
                            description="Tidak ada laporan keamanan situs yang cocok dengan kata kunci atau filter terpilih."
                            actionLabel={canScan ? "Pindai Ulang Semua" : undefined}
                            onAction={canScan ? onScanAll : undefined}
                        />
                    </div>
                )}
            </div>

            {/* Pagination Component - Always rendered consistently */}
            <div className="pt-2 px-3 pb-3" style={{ borderTop: '1px solid var(--line)' }}>
                <Pagination 
                    meta={securities?.meta} 
                    links={securities?.links} 
                    itemLabel="laporan keamanan" 
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
}
