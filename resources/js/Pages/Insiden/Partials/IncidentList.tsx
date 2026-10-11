import React from 'react';
import EmptyState from '@/Components/EmptyState';
import IncidentRow from './IncidentRow';

interface IncidentListProps {
    incidents: any[];
    onOpenDetail: (incident: any) => void;
    onOpenAi: (e: React.MouseEvent, incident: any) => void;
}

export default function IncidentList({
    incidents,
    onOpenDetail,
    onOpenAi,
}: IncidentListProps) {
    if (!incidents || incidents.length === 0) {
        return (
            <div className="py-5">
                <EmptyState
                    icon="bi-shield-check"
                    title="Sistem Aman & Terkendali"
                    description="Belum ada insiden keamanan yang terdeteksi dengan kriteria filter ini. Mesin pemantau terus bekerja secara real-time di latar belakang."
                />
            </div>
        );
    }

    return (
        <div className="incident-list-container">
            {incidents.map((incident) => (
                <IncidentRow
                    key={incident.id}
                    incident={incident}
                    onOpenDetail={onOpenDetail}
                    onOpenAi={onOpenAi}
                />
            ))}
        </div>
    );
}
