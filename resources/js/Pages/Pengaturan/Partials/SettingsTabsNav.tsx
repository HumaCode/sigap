import React from 'react';

export type SettingsTabKey = 'ninerouter' | 'sso' | 'seo' | 'activity_log' | 'general';

interface SettingsTabsNavProps {
    activeTab: SettingsTabKey;
    onTabChange: (tab: SettingsTabKey) => void;
}

export default function SettingsTabsNav({ activeTab, onTabChange }: SettingsTabsNavProps) {
    const tabs: Array<{ key: SettingsTabKey; label: string; icon: string }> = [
        { key: 'ninerouter', label: '9Router AI Engine', icon: 'bi-cpu-fill' },
        { key: 'sso', label: 'SSO HumaCode', icon: 'bi-shield-lock-fill' },
        { key: 'seo', label: 'Optimasi SEO', icon: 'bi-search' },
        { key: 'activity_log', label: 'Log Aktivitas & Audit', icon: 'bi-journal-text' },
        { key: 'general', label: 'Preferensi Umum', icon: 'bi-sliders' },
    ];

    return (
        <div className="settings-tabs-wrapper mb-4">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                    <button
                        key={tab.key}
                        type="button"
                        className={`settings-tab-btn ${isActive ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.key)}
                    >
                        <i className={`bi ${tab.icon}`}></i>
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
