import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../../css/tooltip.css';

export type TooltipVariant = 
    | 'dark'
    | 'info' 
    | 'teal' 
    | 'edit' 
    | 'primary'
    | 'blue' 
    | 'danger' 
    | 'red' 
    | 'warning' 
    | 'amber' 
    | 'yellow'
    | 'success' 
    | 'green';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
    title: ReactNode;
    description?: ReactNode;
    variant?: TooltipVariant;
    position?: TooltipPosition;
    icon?: string;
    className?: string;
    children: ReactNode;
}

export default function Tooltip({
    title,
    description,
    variant = 'dark',
    position = 'top',
    icon,
    className = '',
    children
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; arrowOffset?: number }>({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipEl = tooltipRef.current;

        const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 160;
        const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 44;
        const margin = 8;
        const padding = 12; // Safety margin from screen edge

        let top = 0;
        let left = 0;
        let arrowOffset = 0;

        if (position === 'top') {
            top = triggerRect.top - tooltipHeight - margin;
            // Target center of trigger
            const targetCenterX = triggerRect.left + triggerRect.width / 2;
            let idealLeft = targetCenterX - tooltipWidth / 2;

            // Boundary clamping
            if (idealLeft + tooltipWidth > window.innerWidth - padding) {
                const shift = (idealLeft + tooltipWidth) - (window.innerWidth - padding);
                idealLeft -= shift;
                arrowOffset = shift;
            } else if (idealLeft < padding) {
                const shift = padding - idealLeft;
                idealLeft += shift;
                arrowOffset = -shift;
            }

            left = idealLeft;

            // Flip to bottom if out of screen at the top
            if (top < padding) {
                top = triggerRect.bottom + margin;
            }
        } else if (position === 'bottom') {
            top = triggerRect.bottom + margin;
            const targetCenterX = triggerRect.left + triggerRect.width / 2;
            let idealLeft = targetCenterX - tooltipWidth / 2;

            if (idealLeft + tooltipWidth > window.innerWidth - padding) {
                const shift = (idealLeft + tooltipWidth) - (window.innerWidth - padding);
                idealLeft -= shift;
                arrowOffset = shift;
            } else if (idealLeft < padding) {
                const shift = padding - idealLeft;
                idealLeft += shift;
                arrowOffset = -shift;
            }

            left = idealLeft;
        } else if (position === 'left') {
            left = triggerRect.left - tooltipWidth - margin;
            top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        } else if (position === 'right') {
            left = triggerRect.right + margin;
            top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        }

        setCoords({ top, left, arrowOffset });
    };

    const handleMouseEnter = () => {
        // Do not show tooltip if modal or popup loader is active
        const hasOpenModal = document.querySelector('.modal.show, .custom-modal-overlay.show');
        if (hasOpenModal) {
            setIsVisible(false);
            return;
        }
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const handleClick = () => {
        // Immediately dismiss tooltip on click/action trigger
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            const timer = setTimeout(updatePosition, 10);
            
            const handleGlobalScrollOrClick = () => {
                updatePosition();
            };

            window.addEventListener('scroll', handleGlobalScrollOrClick, true);
            window.addEventListener('resize', handleGlobalScrollOrClick);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('scroll', handleGlobalScrollOrClick, true);
                window.removeEventListener('resize', handleGlobalScrollOrClick);
            };
        }
    }, [isVisible, title, description]);

    if (!title && !description) {
        return <>{children}</>;
    }

    return (
        <div 
            ref={triggerRef} 
            className={`sigap-tooltip-wrapper ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleMouseEnter}
            onBlur={handleMouseLeave}
            onClick={handleClick}
            onMouseDown={handleClick}
        >
            {children}

            {isVisible && typeof document !== 'undefined' && createPortal(
                <div 
                    ref={tooltipRef}
                    className={`sigap-portal-tooltip sigap-tooltip-${variant} sigap-tooltip-${position}`}
                    style={{
                        position: 'fixed',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        zIndex: 1040, // Below modal backdrop (1050+)
                    }}
                    role="tooltip"
                >
                    <div className="sigap-tooltip-title">
                        {icon && <i className={`${icon} me-1`}></i>}
                        {title}
                    </div>
                    {description && (
                        <div className="sigap-tooltip-desc">
                            {description}
                        </div>
                    )}
                    <div 
                        className="sigap-tooltip-arrow" 
                        style={coords.arrowOffset ? { transform: `translateX(calc(-50% + ${coords.arrowOffset}px))` } : undefined}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}
