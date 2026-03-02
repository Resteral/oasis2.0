"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AisRecommendations() {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                // For recommendations, we can search for generic "trending" or "premium" terms
                const response = await fetch('/api/search/v2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: 'premium unique high quality', distance: 50 })
                });
                const data = await response.json();
                if (data.results) {
                    setRecommendations(data.results.slice(0, 4));
                }
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    if (isLoading) return null;
    if (recommendations.length === 0) return null;

    return (
        <section style={{ marginTop: '6rem', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <div style={{
                    padding: '0.8rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    fontSize: '1.2rem'
                }}>✨</div>
                <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>AI Recommendations</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Curated matches based on your premium taste.</p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '2rem'
            }}>
                {recommendations.map((item) => (
                    <Link
                        href={`/shop/${item.business_slug || item.business_id}`}
                        key={item.id}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s ease'
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                            }}
                        >
                            <div style={{
                                height: '160px',
                                marginBottom: '1.2rem',
                                borderRadius: '12px',
                                backgroundImage: `url(${item.image_url || 'https://via.placeholder.com/400'})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }} />
                            <h4 style={{ marginBottom: '0.5rem' }}>{item.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 'bold', marginBottom: '1rem' }}>
                                {item.business_name}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1rem', fontWeight: '800' }}>${item.price}</span>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                                    ✨ {Math.round(item.similarity * 100)}% Match
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
