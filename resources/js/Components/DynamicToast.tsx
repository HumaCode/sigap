import React, { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: number;
    type: ToastType;
    title: string;
    description?: string;
}

type Listener = (toast: ToastMessage) => void;
let listeners: Listener[] = [];
let nextId = 0;

export const toast = {
    show: (type: ToastType, title: string, description?: string) => {
        const message: ToastMessage = { id: nextId++, type, title, description };
        listeners.forEach(listener => listener(message));
    },
    success: (title: string, description?: string) => toast.show('success', title, description),
    error: (title: string, description?: string) => toast.show('error', title, description),
    warning: (title: string, description?: string) => toast.show('warning', title, description),
    info: (title: string, description?: string) => toast.show('info', title, description),
};

export default function DynamicToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const listener = (toastMessage: ToastMessage) => {
            setToasts(prev => [...prev, toastMessage]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toastMessage.id));
            }, 4000); // Hapus setelah 4 detik
        };
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            pointerEvents: 'none'
        }}>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes island-in {
                    0% { opacity: 0; transform: scale(0.6) translateY(30px); filter: blur(10px); }
                    40% { transform: scale(1.05) translateY(-5px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
                }
                @keyframes icon-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes icon-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                @keyframes icon-spin-smooth {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .dynamic-toast {
                    background: rgba(15, 42, 63, 0.95);
                    color: white;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 999px;
                    padding: 0.6rem;
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    min-width: 250px;
                    max-width: 450px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
                    animation: island-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    pointer-events: auto;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                }
                .dynamic-toast.expanded {
                    border-radius: 28px;
                    padding: 0.8rem;
                }
                .toast-icon-wrap {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-size: 1.25rem;
                }
                .toast-icon-success {
                    background: linear-gradient(135deg, #0ea5a3, #22c1a4);
                    box-shadow: 0 0 20px rgba(14, 165, 163, 0.4);
                }
                .toast-icon-success i { animation: icon-bounce 2s infinite cubic-bezier(0.4, 0, 0.2, 1); }
                
                .toast-icon-error {
                    background: linear-gradient(135deg, #ff7a6e, #e0453a);
                    box-shadow: 0 0 20px rgba(224, 69, 58, 0.4);
                }
                .toast-icon-error i { animation: icon-pulse 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1); }
                
                .toast-icon-warning {
                    background: linear-gradient(135deg, #ffb648, #f59e0b);
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
                }
                .toast-icon-warning i { animation: icon-bounce 2s infinite cubic-bezier(0.4, 0, 0.2, 1); }
                
                .toast-icon-info {
                    background: linear-gradient(135deg, #3b82f6, #60a5fa);
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
                }
                .toast-icon-info i { animation: icon-spin-smooth 6s linear infinite; }
                
                .toast-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                    flex: 1;
                    padding-right: 0.5rem;
                }
                .toast-title {
                    font-weight: 600;
                    font-size: 0.95rem;
                    letter-spacing: 0.2px;
                }
                .toast-desc {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.75);
                    line-height: 1.4;
                }
            `}} />
            
            {toasts.map(toast => {
                const getIcon = () => {
                    switch(toast.type) {
                        case 'success': return <i className="bi bi-check-lg"></i>;
                        case 'error': return <i className="bi bi-x-lg"></i>;
                        case 'warning': return <i className="bi bi-exclamation-triangle-fill"></i>;
                        case 'info': return <i className="bi bi-info-circle-fill"></i>;
                    }
                };

                return (
                    <div key={toast.id} className={`dynamic-toast ${toast.description ? 'expanded' : ''}`}>
                        <div className={`toast-icon-wrap toast-icon-${toast.type}`}>
                            {getIcon()}
                        </div>
                        <div className="toast-content">
                            <div className="toast-title">{toast.title}</div>
                            {toast.description && <div className="toast-desc">{toast.description}</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
