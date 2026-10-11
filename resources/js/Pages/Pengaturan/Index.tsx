import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from '@/Components/DynamicToast';
import PopupLoader from '@/Components/PopupLoader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import '../../../css/settings.css';

import ActivityLogTab from './Partials/ActivityLogTab';
import GeneralTab from './Partials/GeneralTab';
import NineRouterTab from './Partials/NineRouterTab';
import SeoTab from './Partials/SeoTab';
import SettingsHeader from './Partials/SettingsHeader';
import type { SettingsTabKey } from './Partials/SettingsTabsNav';
import SettingsTabsNav from './Partials/SettingsTabsNav';

interface SettingsData {
    ninerouter: {
        endpoint: string;
        api_key: string;
        model: string;
        available_models: any[];
        has_api_key?: boolean;
    };
    seo: {
        meta_title: string;
        meta_description: string;
        meta_keywords: string;
        author: string;
        robots_index: boolean;
        google_verification: string;
    };
    activity_log: {
        retention_days: number;
        log_level: string;
        auto_prune: boolean;
    };
    general: {
        app_name: string;
        pic_contact_email: string;
        pic_contact_wa: string;
        telegram_bot_token: string;
        telegram_chat_id: string;
        has_telegram_token?: boolean;
    };
}

interface SettingsIndexProps extends PageProps {
    settings: SettingsData;
}

export default function Index({ settings }: SettingsIndexProps) {
    const pageProps = usePage<PageProps>().props;

    // Detect tab from URL parameter if available
    const getInitialTab = (): SettingsTabKey => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab') as SettingsTabKey;

            if (['ninerouter', 'seo', 'activity_log', 'general'].includes(tabParam)) {
                return tabParam;
            }
        }

        return 'ninerouter';
    };

    const [activeTab, setActiveTab] = useState<SettingsTabKey>(getInitialTab);
    const [isSaving, setIsSaving] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('Menyimpan pengaturan...');

    // Flash notifications (cegah pemicu ganda dengan ref)
    const lastFlashRef = useRef<string | null>(null);
    useEffect(() => {
        const success = pageProps.flash?.success;
        const error = pageProps.flash?.error;
        const key = `${success || ''}#${error || ''}`;

        if (key === '#') {
return;
}

        if (lastFlashRef.current === key) {
return;
}

        lastFlashRef.current = key;

        if (success) {
            toast.success('Berhasil', success);
        } else if (error) {
            toast.error('Peringatan', error);
        }
    }, [pageProps.flash?.success, pageProps.flash?.error]);

    const handleTabChange = (tab: SettingsTabKey) => {
        setActiveTab(tab);

        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handleSaveGroup = (groupKey: SettingsTabKey, groupData: Record<string, any>) => {
        setLoaderMessage('Menyimpan perubahan pengaturan...');
        setIsSaving(true);

        router.post(
            route('settings.update'),
            {
                group: groupKey,
                settings: groupData,
            },
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    setIsSaving(false);

                    if (page?.props?.flash?.error) {
                        return;
                    }

                    if (!page?.props?.flash?.success) {
                        toast.success('Berhasil', 'Pengaturan berhasil diperbarui.');
                    }
                },
                onError: (errs) => {
                    setIsSaving(false);
                    const firstErr = Object.values(errs)[0];
                    toast.error('Gagal Menyimpan', typeof firstErr === 'string' ? firstErr : 'Periksa kembali isian formulir.');
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pengaturan Sistem" />

            {/* Header */}
            <SettingsHeader />

            {/* Tab Navigation */}
            <SettingsTabsNav activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Tab Contents */}
            <div className="tab-content">
                {activeTab === 'ninerouter' && (
                    <NineRouterTab
                        data={settings.ninerouter}
                        onSave={(data) => handleSaveGroup('ninerouter', data)}
                        isSaving={isSaving}
                    />
                )}

                {activeTab === 'seo' && (
                    <SeoTab
                        data={settings.seo}
                        onSave={(data) => handleSaveGroup('seo', data)}
                        isSaving={isSaving}
                    />
                )}

                {activeTab === 'activity_log' && (
                    <ActivityLogTab
                        data={settings.activity_log}
                        onSave={(data) => handleSaveGroup('activity_log', data)}
                        isSaving={isSaving}
                    />
                )}

                {activeTab === 'general' && (
                    <GeneralTab
                        data={settings.general}
                        onSave={(data) => handleSaveGroup('general', data)}
                        isSaving={isSaving}
                    />
                )}
            </div>

            {/* Fullscreen Loader */}
            <PopupLoader isOpen={isSaving} status="loading" message={loaderMessage} />
        </AuthenticatedLayout>
    );
}
