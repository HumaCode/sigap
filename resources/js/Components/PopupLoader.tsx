import { ReactNode } from 'react';

interface PopupLoaderProps {
    isOpen: boolean;
    status: 'loading' | 'success';
    message: string;
    icon?: ReactNode;
}

export default function PopupLoader({ isOpen, status, message, icon }: PopupLoaderProps) {
    if (!isOpen) return null;

    return (
        <div className="popup-loader-overlay">
            <div className={`popup-loader-card ${status}`}>
                <div className="popup-icon-top">
                    {icon || <i className="bi bi-shield-lock-fill"></i>}
                </div>
                
                <div className="popup-animation-container">
                    {status === 'loading' ? (
                        <div className="interactive-spinner"></div>
                    ) : (
                        <div className="success-checkmark">
                            <i className="bi bi-check-lg"></i>
                        </div>
                    )}
                </div>

                <div className="popup-message">
                    {message}
                </div>
            </div>
            
            <style>{`
                .popup-loader-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 42, 63, 0.4);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                }
                
                .popup-loader-card {
                    background: white;
                    border-radius: 24px;
                    padding: 2.5rem 2rem;
                    min-width: 320px;
                    text-align: center;
                    box-shadow: 0 20px 40px -10px rgba(15, 42, 63, 0.2);
                    transform: translateY(0) scale(1);
                    animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                .popup-icon-top {
                    font-size: 2rem;
                    color: var(--teal-1, #0ea5a3);
                    margin-bottom: 1.5rem;
                }
                
                .popup-animation-container {
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                }
                
                .interactive-spinner {
                    width: 60px;
                    height: 60px;
                    border: 4px solid rgba(14, 165, 163, 0.2);
                    border-top-color: var(--teal-1, #0ea5a3);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                .success-checkmark {
                    width: 60px;
                    height: 60px;
                    background: var(--teal-1, #0ea5a3);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                .popup-message {
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: var(--ink, #0f2a3f);
                    font-family: 'Poppins', sans-serif;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes popIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.9); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                @keyframes scaleIn {
                    0% { transform: scale(0); opacity: 0; }
                    70% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
