import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const getAppName = (): string => {
    if (typeof window !== 'undefined') {
        if ((window as any).__APP_NAME__) {
            return (window as any).__APP_NAME__;
        }
        const meta = document.querySelector('meta[name="app-name"]');
        if (meta) {
            const content = meta.getAttribute('content');
            if (content) return content;
        }
    }
    return import.meta.env.VITE_APP_NAME || 'SIGAP';
};

// Listen to page navigations to keep appName updated if changed
if (typeof window !== 'undefined') {
    router.on('navigate', (event) => {
        const dynamicName = (event.detail.page.props as any)?.app_name;
        if (dynamicName) {
            (window as any).__APP_NAME__ = dynamicName;
        }
    });
}

createInertiaApp({
    title: (title) => {
        const app = getAppName();
        return title ? `${title} - ${app}` : app;
    },
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        if (props.initialPage?.props?.app_name) {
            (window as any).__APP_NAME__ = props.initialPage.props.app_name;
        }
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#0ea5a3',
    },
});
