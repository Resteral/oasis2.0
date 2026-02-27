"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AiDiscoveryModal() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [query, setQuery] = useState('');
    const [distance, setDistance] = useState(5);
    const [delivery, setDelivery] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [aiInsight, setAiInsight] = useState('');

    const handleOpen = () => {
        setIsOpen(true);
        setStep(1);
    };

    const handleClose = () => setIsOpen(false);

    const handleNext = () => {
        if (step === 1 && query) {
            setStep(2);
        } else if (step === 2) {
            handleSearch();
        }
    };

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const res = await fetch('/api/ai/discover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, distance, delivery })
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.matches || []);
                setAiInsight(data.ai_insight || `We found ${data.matches?.length || 0} matches for "${query}"`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setStep(3);
            setIsSearching(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={handleOpen}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    backgroundColor: '#000',
                    color: '#fff',
                    padding: '1rem 2rem',
                    borderRadius: '50px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    zIndex: 1000,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
            >
                ✨ Ask AI
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                backgroundColor: '#fff',
                width: '90%',
                maxWidth: '500px',
                borderRadius: '16px',
                padding: '2rem',
                position: 'relative',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#999'
                    }}
                >
                    &times;
                </button>

                {step === 1 && (
                    <div>
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>What are you looking for?</h2>
                        <input
                            autoFocus
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="e.g. Sushi, Gym, Coffee..."
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1.2rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                marginBottom: '1.5rem'
                            }}
                            onKeyDown={e => e.key === 'Enter' && handleNext()}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {['Espresso', 'Yoga', 'Tacos', 'Haircut', 'Gifts'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setQuery(tag)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        border: '1px solid #eee',
                                        backgroundColor: query === tag ? '#000' : '#f9f9f9',
                                        color: query === tag ? '#fff' : '#000',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleNext}
                                disabled={!query}
                                className="btn btn-primary"
                                style={{ padding: '0.8rem 2rem', backgroundColor: '#000', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: query ? 1 : 0.5 }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h2 style={{ marginBottom: '1rem' }}>Preferences</h2>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>
                                How far are you willing to travel?
                                <span style={{ float: 'right', color: '#666' }}>{distance} miles</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={distance}
                                onChange={e => setDistance(Number(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={delivery}
                                    onChange={e => setDelivery(e.target.checked)}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <span style={{ fontSize: '1.1rem' }}>I want it delivered</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Back</button>
                            <button
                                onClick={handleSearch}
                                className="btn btn-primary"
                                style={{ padding: '0.8rem 2rem', backgroundColor: '#000', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                            >
                                {isSearching ? 'Thinking...' : 'Find Matches'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔮</div>
                        <h3>{aiInsight || `We found ${results.length} matches for "${query}"`}</h3>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>Within {distance} miles {delivery ? '(Delivery Available)' : ''}</p>

                        <div style={{ textAlign: 'left', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {results.length > 0 ? results.map((business, index) => (
                                <div
                                    key={business.id || index}
                                    style={{ padding: '1rem', border: '1px solid #eee', marginBottom: '1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#f9f9f9' }}
                                    onClick={() => router.push(`/shop/${business.slug || business.id}`)}
                                >
                                    <strong>{business.name}</strong>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                        {business.description ? `${business.description.substring(0, 50)}... ` : ''}
                                        • {business.location || 'Local'}
                                    </p>
                                </div>
                            )) : (
                                <p style={{ textAlign: 'center', color: '#666' }}>No exact matches found.</p>
                            )}
                        </div>

                        <button
                            onClick={handleClose}
                            style={{ padding: '0.8rem 2rem', backgroundColor: '#eee', color: '#000', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
