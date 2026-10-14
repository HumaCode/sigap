import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type CellStatusType = 'hc-full' | 'hc-mid' | 'hc-low' | 'hc-down';

export interface DayMeta {
    dayNumber: number;
    daysAgo: number;
    dayName: string;
    dateStr: string;
    relativeLabel: string;
    statusLabel: string;
    statusDesc: string;
    latency: string;
    badgeClass: string;
    dotColor: string;
    uptimePercent: string;
    type: CellStatusType;
}

export interface UptimeHeatmapProps {
    seed: string;
    status?: string;
    siteName?: string;
    onCellClick?: (cellMeta: DayMeta) => void;
    activeDayIndex?: number | null;
    showTooltip?: boolean;
}

// Deterministic cell calculation shared between list & modal
export function computeHeatmapCells(seed: string, status?: string): { index: number; type: CellStatusType }[] {
    const result: { index: number; type: CellStatusType }[] = [];
    let currentSeed = seed.length;
    for (let i = 0; i < 30; i++) {
        currentSeed = (currentSeed * 16807) % 2147483647;
        const r = (currentSeed - 1) / 2147483646;
        let c: CellStatusType = 'hc-full';

        if (status === 'down' && i >= 26) {
            c = 'hc-down';
        } else if (status === 'warn' && i >= 27) {
            c = 'hc-low';
        } else {
            if (r > 0.96) c = 'hc-down';
            else if (r > 0.91) c = 'hc-low';
            else if (r > 0.85) c = 'hc-mid';
        }

        result.push({ index: i, type: c });
    }
    return result;
}

// Compute metadata for any day
export function computeDayMeta(index: number, type: CellStatusType): DayMeta {
    const daysAgo = 29 - index;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);

    const dayName = targetDate.toLocaleDateString('id-ID', { weekday: 'long' });
    const dateStr = targetDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    let relativeLabel = '';
    if (daysAgo === 0) relativeLabel = 'Hari Ini';
    else if (daysAgo === 1) relativeLabel = 'Kemarin';
    else relativeLabel = `${daysAgo} hari lalu`;

    let statusLabel = '100% Online';
    let statusDesc = 'Ketersediaan optimal tanpa kendala';
    let latency = '~118ms';
    let badgeClass = 'status-online';
    let dotColor = '#10b981';
    let uptimePercent = '100%';

    if (type === 'hc-mid') {
        statusLabel = '99.8% Online';
        statusDesc = 'Operasional stabil & terpantau lancar';
        latency = '~175ms';
        badgeClass = 'status-mid';
        dotColor = '#0ea5a3';
        uptimePercent = '99.8%';
    } else if (type === 'hc-low') {
        statusLabel = 'Respon Lambat';
        statusDesc = 'Beban sistem tinggi, respon melambat';
        latency = '~1.4s';
        badgeClass = 'status-slow';
        dotColor = '#f59e0b';
        uptimePercent = '98.5%';
    } else if (type === 'hc-down') {
        statusLabel = 'Downtime Terdeteksi';
        statusDesc = 'Gangguan akses / koneksi HTTP 5xx';
        latency = 'Timeout';
        badgeClass = 'status-down';
        dotColor = '#ef4444';
        uptimePercent = '94.2%';
    }

    return {
        dayNumber: index + 1,
        daysAgo,
        dayName,
        dateStr,
        relativeLabel,
        statusLabel,
        statusDesc,
        latency,
        badgeClass,
        dotColor,
        uptimePercent,
        type,
    };
}

export default function UptimeHeatmap({
    seed,
    status,
    siteName,
    onCellClick,
    activeDayIndex,
    showTooltip = true,
}: UptimeHeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredCell, setHoveredCell] = useState<{
        index: number;
        type: CellStatusType;
        rect: DOMRect;
    } | null>(null);

    // Compute 30 cells deterministically based on seed
    const cells = useMemo(() => computeHeatmapCells(seed, status), [seed, status]);

    // Handle scroll or resize to dismiss tooltip
    useEffect(() => {
        if (!hoveredCell) return;

        const handleScrollOrResize = () => {
            setHoveredCell(null);
        };

        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [hoveredCell]);

    // Metadata generation for hovered day
    const cellMeta = useMemo(() => {
        if (!hoveredCell) return null;
        return computeDayMeta(hoveredCell.index, hoveredCell.type);
    }, [hoveredCell]);

    // Tooltip position & bounds clamping
    const tooltipPos = useMemo(() => {
        if (!hoveredCell) return null;

        const rect = hoveredCell.rect;
        const tooltipWidth = 248;
        const tooltipHeight = 135;
        const margin = 8;
        const screenPadding = 12;

        const targetX = rect.left + rect.width / 2;
        let isTop = true;
        let top = rect.top - margin;

        // Flip to bottom if out of view on top
        if (rect.top - tooltipHeight - margin < screenPadding) {
            isTop = false;
            top = rect.bottom + margin;
        }

        // Horizontal positioning & clamping
        let left = targetX - tooltipWidth / 2;
        let arrowOffset = 0;

        if (left < screenPadding) {
            arrowOffset = left - screenPadding;
            left = screenPadding;
        } else if (left + tooltipWidth > window.innerWidth - screenPadding) {
            arrowOffset = (left + tooltipWidth) - (window.innerWidth - screenPadding);
            left = window.innerWidth - screenPadding - tooltipWidth;
        }

        return {
            top,
            left,
            isTop,
            arrowOffset,
            tooltipWidth,
        };
    }, [hoveredCell]);

    return (
        <div ref={containerRef} className="heatmap-30" onMouseLeave={() => setHoveredCell(null)}>
            {cells.map((cell) => {
                const isActive = activeDayIndex === cell.index;
                return (
                    <div
                        key={cell.index}
                        className={`heatmap-cell ${cell.type} ${isActive ? 'active-cell' : ''}`}
                        onClick={(e) => {
                            if (onCellClick) {
                                e.stopPropagation();
                                const meta = computeDayMeta(cell.index, cell.type);
                                onCellClick(meta);
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (!showTooltip) return;
                            setHoveredCell({
                                index: cell.index,
                                type: cell.type,
                                rect: e.currentTarget.getBoundingClientRect(),
                            });
                        }}
                    />
                );
            })}

            {/* Portal Floating Tooltip */}
            {showTooltip && hoveredCell && cellMeta && tooltipPos && typeof document !== 'undefined' && createPortal(
                <div
                    className={`sigap-heatmap-portal-tooltip ${tooltipPos.isTop ? 'pos-top' : 'pos-bottom'}`}
                    style={{
                        position: 'fixed',
                        top: `${tooltipPos.top}px`,
                        left: `${tooltipPos.left}px`,
                        width: `${tooltipPos.tooltipWidth}px`,
                        transform: tooltipPos.isTop ? 'translateY(-100%)' : 'none',
                        zIndex: 1070,
                        pointerEvents: 'none',
                    }}
                    role="tooltip"
                >
                    {/* Header */}
                    <div className="tooltip-head">
                        <div className="d-flex align-items-center gap-1">
                            <i className="bi bi-calendar3 me-1" style={{ fontSize: '0.72rem', color: '#94a3b8' }}></i>
                            <span className="tooltip-date">{cellMeta.dayName}, {cellMeta.dateStr}</span>
                        </div>
                        <span className={`tooltip-rel-pill ${cellMeta.daysAgo === 0 ? 'today' : ''}`}>
                            {cellMeta.relativeLabel}
                        </span>
                    </div>

                    {/* Status Banner */}
                    <div className={`tooltip-status-banner ${cellMeta.badgeClass}`}>
                        <div className="d-flex align-items-center gap-2">
                            <span className="status-dot" style={{ background: cellMeta.dotColor }}></span>
                            <span className="status-title">{cellMeta.statusLabel}</span>
                        </div>
                        <span className="day-count-badge">Hari #{cellMeta.dayNumber}</span>
                    </div>

                    {/* Body Details */}
                    <div className="tooltip-body">
                        <div className="status-detail-desc">{cellMeta.statusDesc}</div>
                        <div className="status-metric-grid">
                            <div className="metric-item">
                                <span className="metric-lbl">Uptime:</span>
                                <span className="metric-val" style={{ color: cellMeta.dotColor }}>{cellMeta.uptimePercent}</span>
                            </div>
                            <div className="metric-divider"></div>
                            <div className="metric-item">
                                <span className="metric-lbl">Respon:</span>
                                <span className="metric-val">{cellMeta.latency}</span>
                            </div>
                        </div>
                    </div>

                    {/* Caret Arrow */}
                    <div
                        className={`tooltip-arrow ${tooltipPos.isTop ? 'arrow-down' : 'arrow-up'}`}
                        style={{ left: `calc(50% + ${tooltipPos.arrowOffset}px)` }}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}
