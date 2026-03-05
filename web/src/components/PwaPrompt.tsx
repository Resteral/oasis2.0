"use client";
import { useState, useEffect } from 'react';

export default function PwaPrompt() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show after 5 seconds for simulation in this demo
        // In a real app, this would listen to BeforeInstallPromptEvent
        const timer = setTimeout(() => {
            // Only show if not already in standalone mode
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) {
                setIsVisible(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm animate-bounce-in">
            <div className="bg-gray-900/90 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 shadow-2xl flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg">
                        <img src="/logo.png" alt="Oasis" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <div className="text-white font-black text-xs uppercase tracking-widest italic group-hover:scale-105 transition-transform">Add to Home Screen</div>
                        <p className="text-gray-400 text-[10px] font-bold mt-1">Install Oasis United for the best local experience.</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all active:scale-95"
                    >
                        Install
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes bounce-in {
                    0% { transform: translate(-50%, 200%); opacity: 0; }
                    60% { transform: translate(-50%, -10%); opacity: 1; }
                    100% { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
}
