"use client";
import { useState } from 'react';
import styles from './page.module.css';
import Cart from '@/components/Cart';
import MessageModal from '@/components/MessageModal';
import { Business } from '@/lib/types';

interface ShopClientProps {
    business: Business;
    products: any[];
    posts: any[];
}

export default function ShopClient({ business, products, posts }: ShopClientProps) {
    const theme = business.theme || { primaryColor: '#000000', backgroundColor: '#ffffff' };
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

    // Derived styles for dynamic theme
    const sectionStyle = {
        '--primary': theme.primaryColor,
        '--bg-color': theme.backgroundColor,
    } as React.CSSProperties;

    return (
        <div className={styles.container} style={{ backgroundColor: theme.backgroundColor }}>
            {/* Custom Style Injection */}
            <style jsx global>{`
                :root {
                    --primary: ${theme.primaryColor};
                }
                .btn-primary {
                    background-color: ${theme.primaryColor} !important;
                    border-color: ${theme.primaryColor} !important;
                }
                .text-primary {
                    color: ${theme.primaryColor} !important;
                }
            `}</style>

            {/* Hero Section */}
            <div className={styles.hero} style={{ borderColor: theme.primaryColor }}>
                <div className={styles.heroContent}>
                    <h1 className={styles.businessName}>{business.name}</h1>
                    <p className={styles.tagline}>{business.description || "Welcome to our store!"}</p>
                    <div className={styles.heroActions}>
                        <button className="btn btn-primary" style={{ backgroundColor: theme.primaryColor }}>Start Order</button>
                        <button className="btn glass" onClick={() => setIsMessageModalOpen(true)}>Contact Us</button>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Info & Map */}
                <div className={styles.infoSection}>
                    <div className={styles.mapPlaceholder}>
                        <span>📍 {business.location || "Location not set"}</span>
                    </div>
                    <div className={styles.details}>
                        <h3>Visit Us</h3>
                        <p>{business.location}</p>
                        {/* Delivery Info */}
                        {business.delivery_settings?.selfDelivery && (
                            <p className="text-sm font-medium text-green-600">✓ We deliver locally ({business.delivery_settings.radius} miles)</p>
                        )}
                        <div className={styles.contactMethods}>
                            <button className="btn btn-outline" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>Call Now</button>
                            <button className="btn btn-outline" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }} onClick={() => setIsMessageModalOpen(true)}>Message</button>
                        </div>
                    </div>
                </div>

                {/* Products */}
                <h2 className={styles.sectionTitle}>Our Menu</h2>
                <div className={styles.productGrid}>
                    {products.length > 0 ? products.map((product) => (
                        <div key={product.id} className={styles.productCard}>
                            <div className={styles.productImage} style={{ backgroundImage: `url(${product.image_url || 'https://via.placeholder.com/400'})` }}></div>
                            <div className={styles.productInfo}>
                                <div className={styles.productHeader}>
                                    <h4>{product.name}</h4>
                                    <span className={styles.price} style={{ color: theme.primaryColor }}>${product.price}</span>
                                </div>
                                <p className={styles.description}>{product.description}</p>
                                <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', backgroundColor: theme.primaryColor }}>Add to Cart</button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                            <p>No products added yet.</p>
                        </div>
                    )}
                </div>

                {/* News & Events Section */}
                {posts && posts.length > 0 && (
                    <div className={styles.postsSection} style={{ marginTop: '3rem', marginBottom: '3rem' }}>
                        <h2 className={styles.sectionTitle}>Latest News & Events</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {posts.map((post: any) => (
                                <div key={post.id} style={{
                                    padding: '1.5rem',
                                    border: '1px solid #eee',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{
                                            textTransform: 'uppercase',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            color: theme.primaryColor,
                                            border: `1px solid ${theme.primaryColor}`,
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            {post.type}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: '#888' }}>
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {post.event_date && (
                                        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#e91e63' }}>
                                            📅 {new Date(post.event_date).toLocaleString()}
                                        </div>
                                    )}
                                    <p style={{ lineHeight: '1.5', color: '#444' }}>{post.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Cart />

            <MessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                businessId={business.id}
                businessName={business.name}
                theme={theme}
            />
        </div>
    );
}
