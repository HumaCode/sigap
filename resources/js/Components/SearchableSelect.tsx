import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
    value: string;
    label: string;
    subLabel?: string;
    badge?: string;
    icon?: string;
}

interface SearchableSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    required?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Pilih salah satu...',
    searchPlaceholder = 'Ketik untuk mencari...',
    disabled = false,
    required = false,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Selected option object
    const selectedOption = options.find((opt) => opt.value === value);

    // Filter options based on search query
    const filteredOptions = options.filter((opt) => {
        const q = searchQuery.toLowerCase();
        return (
            opt.label.toLowerCase().includes(q) ||
            (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
            (opt.badge && opt.badge.toLowerCase().includes(q))
        );
    });

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="position-relative" ref={containerRef} style={{ width: '100%' }}>
            {/* Main Toggle Trigger */}
            <div
                className={`form-control d-flex align-items-center justify-content-between ${disabled ? 'bg-light text-muted' : ''}`}
                style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    borderRadius: '12px',
                    padding: '0.65rem 1rem',
                    border: isOpen ? '1px solid #0ea5a3' : '1px solid #cbd5e1',
                    boxShadow: isOpen ? '0 0 0 3px rgba(14,165,163,0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
                    background: '#ffffff',
                    minHeight: '44px',
                    userSelect: 'none',
                    transition: 'all 0.2s',
                }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="d-flex align-items-center gap-2 text-truncate" style={{ flex: 1, minWidth: 0 }}>
                    {selectedOption ? (
                        <>
                            <i className={selectedOption.icon || 'bi bi-globe2'} style={{ color: '#0ea5a3', fontSize: '1rem', flexShrink: 0 }}></i>
                            <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.88rem' }}>
                                {selectedOption.label}
                            </span>
                            {selectedOption.badge && (
                                <span 
                                    className="badge ms-1 text-truncate" 
                                    style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: 600, border: '1px solid #e2e8f0' }}
                                >
                                    {selectedOption.badge}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-muted" style={{ fontSize: '0.88rem' }}>
                            {placeholder}
                        </span>
                    )}
                </div>

                <div className="d-flex align-items-center gap-1.5 ms-2 text-muted">
                    <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '0.8rem' }}></i>
                </div>
            </div>

            {/* Dropdown Menu (Select2 Style) */}
            {isOpen && (
                <div
                    className="position-absolute shadow-lg border"
                    style={{
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        borderRadius: '14px',
                        zIndex: 1070,
                        overflow: 'hidden',
                        borderColor: '#e2e8f0',
                    }}
                >
                    {/* Search Input Box */}
                    <div className="p-2 border-bottom" style={{ background: '#f8fafc' }}>
                        <div className="position-relative">
                            <i
                                className="bi bi-search position-absolute top-50 translate-middle-y text-muted"
                                style={{ left: '12px', fontSize: '0.85rem' }}
                            ></i>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="form-control"
                                style={{
                                    paddingLeft: '34px',
                                    paddingRight: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.84rem',
                                    background: '#ffffff',
                                }}
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div
                        style={{
                            maxHeight: '230px',
                            overflowY: 'auto',
                            padding: '4px',
                        }}
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = opt.value === value;
                                return (
                                    <div
                                        key={opt.value}
                                        className="d-flex align-items-center justify-content-between p-2.5 rounded-3 transition-all"
                                        style={{
                                            cursor: 'pointer',
                                            background: isSelected ? 'rgba(14,165,163,0.1)' : 'transparent',
                                            color: isSelected ? '#0f766e' : '#1e293b',
                                            marginBottom: '2px',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                        }}
                                        onClick={() => handleSelect(opt.value)}
                                    >
                                        <div className="d-flex align-items-center gap-2 text-truncate" style={{ flex: 1, minWidth: 0 }}>
                                            <i 
                                                className={opt.icon || 'bi bi-globe2'} 
                                                style={{ color: isSelected ? '#0ea5a3' : '#64748b', fontSize: '0.95rem', flexShrink: 0 }}
                                            ></i>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                    <span className={`text-truncate ${isSelected ? 'fw-bold' : 'fw-semibold'}`} style={{ fontSize: '0.85rem' }}>
                                                        {opt.label}
                                                    </span>
                                                    {opt.badge && (
                                                        <span 
                                                            className="badge" 
                                                            style={{ 
                                                                background: isSelected ? '#ccfbf1' : '#f1f5f9', 
                                                                color: isSelected ? '#0f766e' : '#64748b', 
                                                                fontSize: '0.7rem' 
                                                            }}
                                                        >
                                                            {opt.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {opt.subLabel && (
                                                    <div style={{ fontSize: '0.74rem', color: '#64748b' }} className="text-truncate">
                                                        {opt.subLabel}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <i className="bi bi-check2 text-teal fw-bold fs-5 ms-2" style={{ color: '#0ea5a3' }}></i>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-3 text-center text-muted" style={{ fontSize: '0.82rem' }}>
                                <i className="bi bi-search me-1 text-muted"></i> Tidak ada situs yang cocok dengan "{searchQuery}"
                            </div>
                        )}
                    </div>

                    {/* Result Footer Count */}
                    <div className="px-3 py-1.5 border-top d-flex justify-content-between align-items-center bg-light" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        <span>Total: {options.length} situs</span>
                        {searchQuery && <span>Ditemukan: {filteredOptions.length}</span>}
                    </div>
                </div>
            )}
        </div>
    );
}
