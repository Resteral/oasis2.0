'use client';

import { useState, useEffect } from 'react';

const RECENT_PURCHASES = [
    { name: 'Sarah M.', item: 'Iced Oat Latte', time: '2 mins ago', location: 'Brooklyn' },
    { name: 'James L.', item: 'Yoga Session', time: '5 mins ago', location: 'Manhattan' },
    { name: 'Alex K.', item: 'Eco Tote Bag', time: '1 min ago', location: 'Queens' },
    { name: 'Maya R.', item: 'Handmade Mug', time: '8 mins ago', location: 'Williamsburg' }
];

export default function LiveSalesPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentSale, setCurrentSale] = useState(RECENT_PURCHASES[0]);

    useEffect(() => {
        const showTimeout = setTimeout(() => setIsVisible(true), 3000);

        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                const nextSale = RECENT_PURCHASES[Math.floor(Math.random() * RECENT_PURCHASES.length)];
                setCurrentSale(nextSale);
                setIsVisible(true);
            }, 1000);
        }, 10000);

        return () => {
            clearTimeout(showTimeout);
            clearInterval(interval);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: '2rem',
            zIndex: 1000,
            animation: 'slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transition: 'opacity 0.5s ease',
            opacity: isVisible ? 1 : 0
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                padding: '1rem 1.2rem',
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                maxWidth: '300px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                }}>
                    🛍️
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#1a1a1a' }}>
                        <span style={{ fontWeight: 'bold' }}>{currentSale.name}</span> just ordered
                        <span style={{ fontWeight: 'bold', color: '#6366f1' }}> {currentSale.item}</span>
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>
                        {currentSale.time} in {currentSale.location} • Verified ✅
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%) opacity(0); }
                    to { transform: translateY(0) opacity(1); }
                }
            `}</style>
        </div>
    );
}
