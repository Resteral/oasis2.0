"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AiDiscoveryModal from '@/components/AiDiscoveryModal';
import AisRecommendations from '@/components/AisRecommendations';
import LiveSalesPopup from '@/components/LiveSalesPopup';

interface MarketplaceClientProps {
    initialProducts: any[];
}

export default function MarketplaceClient({ initialProducts }: MarketplaceClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState(initialProducts);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery) {
            setResults(initialProducts);
            return;
        }

        setIsSearching(true);
        try {
            // Track the search event (Phase 23)
            const response = await fetch('/api/search/v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery })
            });
            const data = await response.json();
            if (data.results) {
                setResults(data.results);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Premium Hero / Search Section */}
            <section style={{
                padding: '8rem 2rem 4rem',
                background: 'radial-gradient(circle at top right, #1a1a3a 0%, #050510 60%)',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(to right, #fff, #a5a5ff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Discover Your Oasis
                    </h1>
                    <p style={{
                        fontSize: '1.2rem',
                        color: 'rgba(255,255,255,0.7)',
                        maxWidth: '600px',
                        margin: '0 auto 3rem'
                    }}>
                        Unified commerce for the modern era. Find local favorites or explore new horizons with AI-powered discovery.
                    </p>

                    {/* AI Search Bar */}
                    <form onSubmit={handleSearch} style={{
                        maxWidth: '700px',
                        margin: '0 auto',
                        position: 'relative',
                        display: 'flex',
                        gap: '1rem'
                    }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Try 'best espresso' or 'nearby yoga'..."
                                style={{
                                    width: '100%',
                                    padding: '1.2rem 1.5rem',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: '#fff',
                                    fontSize: '1.1rem',
                                    backdropFilter: 'blur(10px)',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            {isSearching && (
                                <div style={{
                                    position: 'absolute',
                                    right: '1.5rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#6366f1'
                                }}>
                                    ✨
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            style={{
                                padding: '0 2rem',
                                borderRadius: '16px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                color: '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Search
                        </button>
                    </form>
                </div>
            </section>

            {/* Content Results */}
            <section className="container" style={{ marginTop: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.8rem' }}>
                        {searchQuery ? `Results for "${searchQuery}"` : 'Trending Now'}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['All', 'Retail', 'Coffee', 'Fitness'].map(cat => (
                            <button key={cat} style={{
                                padding: '0.5rem 1.2rem',
                                borderRadius: '50px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: cat === 'All' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: '#fff',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}>{cat}</button>
                        ))}
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '2rem'
                }}>
                    {results.map((product) => (
                        <Link
                            href={`/shop/${product.business?.slug || product.business_slug || product.business_id}`}
                            key={product.id}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                overflow: 'hidden',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                backdropFilter: 'blur(10px)'
                            }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-10px)';
                                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                }}
                            >
                                <div style={{
                                    height: '200px',
                                    backgroundColor: '#1a1a2e',
                                    backgroundImage: `url(${product.image_url || 'https://via.placeholder.com/400'})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }} />
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            color: '#6366f1',
                                            fontWeight: 'bold'
                                        }}>
                                            {product.business?.name || product.business_name || 'Business'}
                                        </span>
                                        <span style={{ color: '#fff', fontWeight: 'bold' }}>${product.price}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                                    <p style={{
                                        fontSize: '0.9rem',
                                        color: 'rgba(255,255,255,0.5)',
                                        lineHeight: '1.4',
                                        marginBottom: '1rem',
                                        height: '2.8rem',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                    }}>
                                        {product.description}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                            📍 {product.business?.location || product.business_location || 'Nearby'}
                                        </span>
                                        <button style={{
                                            padding: '0.4rem 1rem',
                                            borderRadius: '50px',
                                            border: 'none',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}>
                                            View Store
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <AisRecommendations />

            <AiDiscoveryModal />
            <LiveSalesPopup />
        </div>
    );
}
