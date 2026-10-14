import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopupLoaderProps {
    isOpen: boolean;
    status: 'loading' | 'success';
    message: string;
    title?: string;
    icon?: ReactNode;
    badgeText?: string;
    maxWidth?: string | number;
}

export default function PopupLoader({
    isOpen,
    status = 'loading',
    message,
    title,
    icon,
    badgeText,
    maxWidth = '520px',
}: PopupLoaderProps) {
    const [mounted, setMounted] = useState(false);
    const [cardTransform, setCardTransform] = useState('');

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = -(y / rect.height) * 12;
        const rotateY = (x / rect.width) * 12;
        setCardTransform(`perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
    };

    const handleMouseLeave = () => {
        setCardTransform('');
    };

    if (!isOpen || !mounted) return null;

    const isSuccess = status === 'success';

    const computedMaxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;

    return createPortal(
        <div className="popup-loader-overlay">
            {/* Ambient glowing backdrop spots */}
            <div className="popup-ambient-glow" />
            <div className="popup-ambient-glow secondary" />

            <div
                className={`popup-loader-card ${isSuccess ? 'is-success' : 'is-loading'}`}
                style={{ transform: cardTransform, maxWidth: computedMaxWidth }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Header Badge */}
                <div className="popup-top-badge-wrap">
                    <span className={`popup-top-badge ${isSuccess ? 'badge-success' : 'badge-loading'}`}>
                        <span className="badge-pulse-dot" />
                        <span>
                            {badgeText || (isSuccess ? 'PROSES BERHASIL' : 'SISTEM KEAMANAN')}
                        </span>
                    </span>
                </div>

                {/* Title */}
                <h3 className="popup-title">
                    {title || (isSuccess ? 'Berhasil Terverifikasi' : 'Sedang Memproses...')}
                </h3>

                {/* Central Interactive Animation */}
                <div className="popup-animation-container">
                    {!isSuccess ? (
                        <div className="interactive-loader-orb">
                            {/* Radar ripple rings */}
                            <div className="orb-radar-wave wave-1" />
                            <div className="orb-radar-wave wave-2" />

                            {/* SVG Dual Rotating Orbital Rings */}
                            <svg className="orb-svg-rings" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="sigapLoaderGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#0ea5a3" />
                                        <stop offset="50%" stopColor="#2dd4bf" />
                                        <stop offset="100%" stopColor="#0284c7" />
                                    </linearGradient>
                                    <linearGradient id="sigapLoaderGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#38bdf8" />
                                        <stop offset="50%" stopColor="#0ea5a3" />
                                        <stop offset="100%" stopColor="#10b981" />
                                    </linearGradient>
                                </defs>

                                {/* Base static track */}
                                <circle cx="50" cy="50" r="42" className="orb-track" />
                                
                                {/* Outer ring with gradient */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    className="orb-outer-ring"
                                    stroke="url(#sigapLoaderGrad1)"
                                />

                                {/* Middle dashed ring (spinning counter-clockwise) */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="33"
                                    className="orb-mid-dashed-ring"
                                    stroke="url(#sigapLoaderGrad2)"
                                />

                                {/* Inner accent orbit */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="24"
                                    className="orb-inner-ring"
                                />
                            </svg>

                            {/* Center Core with Icon & Radar Beam */}
                            <div className="orb-center-core">
                                <div className="orb-radar-sweep" />
                                <div className="orb-core-icon">
                                    {icon || <i className="bi bi-shield-lock-fill" />}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="interactive-success-orb">
                            <div className="success-burst-wave wave-1" />
                            <div className="success-burst-wave wave-2" />
                            <div className="success-badge-core">
                                <svg className="checkmark-svg" viewBox="0 0 52 52">
                                    <circle className="checkmark-circle" cx="26" cy="26" r="24" />
                                    <path className="checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dynamic Message */}
                <div className="popup-message-wrap">
                    <p className="popup-message">
                        {message}
                    </p>
                </div>

                {/* Interactive Progress Bar & Meta Info */}
                <div className="popup-footer-interactive">
                    <div className="interactive-progress-track">
                        <div className={`interactive-progress-fill ${isSuccess ? 'fill-complete' : 'fill-loading'}`}>
                            <div className="interactive-progress-shimmer" />
                        </div>
                    </div>

                    <div className="popup-meta-info">
                        <div className="meta-left">
                            <i className="bi bi-cpu me-1" />
                            <span>Protokol Keamanan Aktif</span>
                        </div>
                        <div className="meta-right">
                            <span className="dot-blink" />
                            <span>{isSuccess ? '100% Selesai' : 'Enkripsi 256-Bit'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .popup-loader-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(8, 20, 32, 0.65);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: overlayFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    padding: 1rem;
                    perspective: 1000px;
                }

                .popup-ambient-glow {
                    position: absolute;
                    width: 480px;
                    height: 480px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(14, 165, 163, 0.25) 0%, rgba(14, 165, 163, 0) 70%);
                    pointer-events: none;
                    filter: blur(40px);
                    animation: ambientPulse 4s ease-in-out infinite alternate;
                }

                .popup-ambient-glow.secondary {
                    width: 380px;
                    height: 380px;
                    background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0) 70%);
                    animation: ambientPulse 4s ease-in-out infinite alternate-reverse;
                }

                .popup-loader-card {
                    position: relative;
                    background: rgba(255, 255, 255, 0.96);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 28px;
                    padding: 2.5rem 2.75rem 2rem 2.75rem;
                    width: 100%;
                    max-width: 540px;
                    text-align: center;
                    border: 1px solid rgba(14, 165, 163, 0.22);
                    box-shadow: 
                        0 25px 60px -15px rgba(10, 30, 45, 0.35),
                        0 0 0 1px rgba(255, 255, 255, 0.8) inset,
                        0 0 30px rgba(14, 165, 163, 0.12);
                    animation: cardPopIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    transition: transform 0.15s ease-out, box-shadow 0.25s ease;
                    transform-style: preserve-3d;
                    overflow: hidden;
                }

                .popup-loader-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #0ea5a3, #2dd4bf, #38bdf8, #0ea5a3);
                    background-size: 200% 100%;
                    animation: gradientBarMove 3s linear infinite;
                }

                .popup-loader-card.is-success::before {
                    background: linear-gradient(90deg, #10b981, #34d399, #059669);
                }

                .popup-top-badge-wrap {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 0.85rem;
                }

                .popup-top-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 12px;
                    border-radius: 999px;
                    font-size: 0.68rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-family: 'Poppins', sans-serif;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
                }

                .popup-top-badge.badge-loading {
                    background: rgba(14, 165, 163, 0.1);
                    color: #0d8b89;
                    border: 1px solid rgba(14, 165, 163, 0.25);
                }

                .popup-top-badge.badge-success {
                    background: rgba(16, 185, 129, 0.12);
                    color: #059669;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }

                .badge-pulse-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: currentColor;
                    position: relative;
                }

                .badge-pulse-dot::after {
                    content: '';
                    position: absolute;
                    inset: -3px;
                    border-radius: 50%;
                    background: currentColor;
                    opacity: 0.4;
                    animation: dotPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                .popup-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #0f2a3f;
                    font-family: 'Poppins', sans-serif;
                    margin: 0 auto 1.25rem auto;
                    max-width: 480px;
                    line-height: 1.4;
                    letter-spacing: -0.01em;
                }

                /* ANIMATION CONTAINER */
                .popup-animation-container {
                    height: 124px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    margin-bottom: 1.25rem;
                }

                /* ORB LOADER */
                .interactive-loader-orb {
                    position: relative;
                    width: 104px;
                    height: 104px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .orb-radar-wave {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 1.5px solid rgba(14, 165, 163, 0.4);
                    opacity: 0;
                    animation: radarRipple 2.2s cubic-bezier(0.1, 0.7, 0.1, 1) infinite;
                }

                .orb-radar-wave.wave-2 {
                    animation-delay: 1.1s;
                }

                .orb-svg-rings {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                }

                .orb-track {
                    fill: none;
                    stroke: rgba(14, 165, 163, 0.1);
                    stroke-width: 4;
                }

                .orb-outer-ring {
                    fill: none;
                    stroke-width: 4;
                    stroke-linecap: round;
                    stroke-dasharray: 200;
                    stroke-dashoffset: 80;
                    transform-origin: center;
                    animation: orbitSpinClockwise 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                .orb-mid-dashed-ring {
                    fill: none;
                    stroke-width: 2.5;
                    stroke-linecap: round;
                    stroke-dasharray: 12 18;
                    transform-origin: center;
                    animation: orbitSpinCounter 3.5s linear infinite;
                    opacity: 0.85;
                }

                .orb-inner-ring {
                    fill: none;
                    stroke: rgba(14, 165, 163, 0.18);
                    stroke-width: 1.5;
                    stroke-dasharray: 4 6;
                }

                .orb-center-core {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #e6fffa 0%, #ccfbf1 80%, #99f6e4 100%);
                    box-shadow: 
                        0 0 16px rgba(14, 165, 163, 0.35),
                        0 2px 6px rgba(14, 165, 163, 0.2) inset;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    animation: corePulse 2s ease-in-out infinite;
                }

                .orb-radar-sweep {
                    position: absolute;
                    inset: -50%;
                    background: conic-gradient(from 0deg, rgba(14, 165, 163, 0) 0deg, rgba(14, 165, 163, 0.3) 60deg, transparent 65deg);
                    animation: radarSweep 1.8s linear infinite;
                    pointer-events: none;
                }

                .orb-core-icon {
                    position: relative;
                    z-index: 2;
                    font-size: 1.35rem;
                    color: #0ea5a3;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    filter: drop-shadow(0 2px 4px rgba(14, 165, 163, 0.3));
                    animation: iconGentleBounce 2s ease-in-out infinite;
                }

                /* SUCCESS ORB */
                .interactive-success-orb {
                    position: relative;
                    width: 104px;
                    height: 104px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .success-burst-wave {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 2px solid rgba(16, 185, 129, 0.5);
                    opacity: 0;
                    animation: successWave 1.8s cubic-bezier(0.1, 0.7, 0.1, 1) infinite;
                }

                .success-burst-wave.wave-2 {
                    animation-delay: 0.9s;
                }

                .success-badge-core {
                    width: 68px;
                    height: 68px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 
                        0 10px 25px -4px rgba(16, 185, 129, 0.5),
                        0 0 20px rgba(16, 185, 129, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: successBadgePop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }

                .checkmark-svg {
                    width: 44px;
                    height: 44px;
                    display: block;
                }

                .checkmark-circle {
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    stroke-width: 2.5;
                    stroke: rgba(255, 255, 255, 0.4);
                    fill: none;
                    animation: checkStroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }

                .checkmark-check {
                    transform-origin: 50% 50%;
                    stroke-dasharray: 48;
                    stroke-dashoffset: 48;
                    stroke-width: 4;
                    stroke: #ffffff;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    animation: checkStroke 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.35s forwards;
                }

                /* MESSAGE */
                .popup-message-wrap {
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.25rem;
                }

                .popup-message {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: #475569;
                    font-family: 'Poppins', sans-serif;
                    line-height: 1.55;
                    margin: 0 auto;
                    max-width: 460px;
                    transition: color 0.3s ease;
                }

                /* PROGRESS BAR & FOOTER META */
                .popup-footer-interactive {
                    border-top: 1px solid rgba(14, 165, 163, 0.1);
                    padding-top: 0.9rem;
                }

                .interactive-progress-track {
                    width: 100%;
                    height: 6px;
                    background: rgba(14, 165, 163, 0.12);
                    border-radius: 999px;
                    overflow: hidden;
                    position: relative;
                    margin-bottom: 0.75rem;
                }

                .interactive-progress-fill {
                    height: 100%;
                    border-radius: 999px;
                    position: relative;
                    overflow: hidden;
                    transition: width 0.4s ease, background 0.4s ease;
                }

                .interactive-progress-fill.fill-loading {
                    width: 100%;
                    background: linear-gradient(90deg, #0ea5a3 0%, #2dd4bf 50%, #38bdf8 100%);
                    animation: progressPulse 2s ease-in-out infinite alternate;
                }

                .interactive-progress-fill.fill-complete {
                    width: 100%;
                    background: linear-gradient(90deg, #10b981, #34d399);
                }

                .interactive-progress-shimmer {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 100%);
                    animation: shimmerMove 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                .popup-meta-info {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 0.72rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .meta-left {
                    display: flex;
                    align-items: center;
                    color: #0d8b89;
                }

                .meta-right {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .dot-blink {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #10b981;
                    animation: dotBlink 1s ease-in-out infinite;
                }

                /* KEYFRAME ANIMATIONS */
                @keyframes overlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes ambientPulse {
                    from { transform: scale(0.9) translate(-10px, -10px); opacity: 0.6; }
                    to { transform: scale(1.15) translate(10px, 10px); opacity: 0.95; }
                }

                @keyframes cardPopIn {
                    0% {
                        opacity: 0;
                        transform: translateY(28px) scale(0.92);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes gradientBarMove {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }

                @keyframes dotPing {
                    75%, 100% {
                        transform: scale(2.4);
                        opacity: 0;
                    }
                }

                @keyframes radarRipple {
                    0% {
                        transform: scale(0.7);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.4);
                        opacity: 0;
                    }
                }

                @keyframes orbitSpinClockwise {
                    0% {
                        transform: rotate(0deg);
                        stroke-dashoffset: 160;
                    }
                    50% {
                        stroke-dashoffset: 60;
                    }
                    100% {
                        transform: rotate(360deg);
                        stroke-dashoffset: 160;
                    }
                }

                @keyframes orbitSpinCounter {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }

                @keyframes corePulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 16px rgba(14, 165, 163, 0.35);
                    }
                    50% {
                        transform: scale(1.08);
                        box-shadow: 0 0 24px rgba(14, 165, 163, 0.55);
                    }
                }

                @keyframes radarSweep {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes iconGentleBounce {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-2px) scale(1.05); }
                }

                @keyframes successWave {
                    0% {
                        transform: scale(0.8);
                        opacity: 0.9;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }

                @keyframes successBadgePop {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    60% {
                        transform: scale(1.15);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @keyframes checkStroke {
                    100% {
                        stroke-dashoffset: 0;
                    }
                }

                @keyframes progressPulse {
                    0% { opacity: 0.85; }
                    100% { opacity: 1; }
                }

                @keyframes shimmerMove {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                @keyframes dotBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>,
        document.body
    );
}
