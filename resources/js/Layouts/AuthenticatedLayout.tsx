import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { usePage, Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import Sidebar from './Partials/Sidebar';
import Topbar from './Partials/Topbar';
import Footer from './Partials/Footer';
import DynamicToast from '@/Components/DynamicToast';
import '../../css/global.css';
import '../global.js';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage<PageProps>().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        document.body.classList.add('authenticated-body');
        return () => {
            document.body.classList.remove('authenticated-body');
        };
    }, []);

    return (
        <>
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet" />
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />
            </Head>

            <div className="ambient">
                <div className="blob blob-a"></div>
                <div className="blob blob-b"></div>
                <div className="grid-texture"></div>
                <div className="float-deco fd-1"><i className="bi bi-shield-check"></i></div>
                <div className="float-deco fd-2"><i className="bi bi-activity"></i></div>
                <div className="float-deco fd-3"><i className="bi bi-broadcast"></i></div>
                <div className="float-deco fd-4"><i className="bi bi-globe2"></i></div>
            </div>

            <div className="app-shell">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} />

                <div className="main-col">
                    <Topbar setSidebarOpen={setSidebarOpen} />

                    <div className="content-area">
                        {children}
                    </div>

                    <Footer />
                </div>
            </div>
            <DynamicToast />
        </>
    );
}
