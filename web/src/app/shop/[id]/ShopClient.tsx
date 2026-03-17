"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Cart from '@/components/Cart';
import ChatInterface from '@/components/ChatInterface';
import ReviewModal from '@/components/ReviewModal';
import BusinessFeed from '@/components/BusinessFeed';
import { Business } from '@/types/legacy_types';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface ShopClientProps {
    business: Business;
    products: any[];
    posts: any[];
}

export default function ShopClient({ business, products, posts }: ShopClientProps) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const theme = business.theme || { primaryColor: '#000000', backgroundColor: '#ffffff' };
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        loadUser();
    }, []);

    useEffect(() => {
        const checkFollowStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('follows')
                .select('id')
                .eq('user_id', user.id)
                .eq('business_id', business.id)
                .single();

            if (data) setIsFollowing(true);
        };
        checkFollowStatus();
    }, [business.id]);

    const handleFollow = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please sign in to follow businesses!');
            return;
        }

        if (isFollowing) {
            await supabase
                .from('follows')
                .delete()
                .eq('user_id', user.id)
                .eq('business_id', business.id);
            setIsFollowing(false);
        } else {
            await supabase
                .from('follows')
                .insert({ user_id: user.id, business_id: business.id });
            setIsFollowing(true);
        }
    };

    const addToCart = (product: any) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
        });
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
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

            <div className="border-b pt-32 pb-16 px-8 text-center" style={{ borderColor: theme.primaryColor }}>
                <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-6xl font-black tracking-tighter uppercase italic">{business.name}</h1>
                    <p className="text-xl font-medium opacity-80 italic">{business.description || "Welcome to our store!"}</p>

                    {/* Oasis Delivery Banner */}
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl mb-8 border border-white/20 inline-flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">Oasis Delivery Service</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🚚</span>
                            <span className="text-sm font-bold text-white">Order by Phone: {business.integrations?.twilio?.phone || "(555) 000-0000"}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <button className="btn btn-primary" style={{ backgroundColor: theme.primaryColor }}>Start Order</button>
                        <button
                            className={`btn ${isFollowing ? 'btn-outline' : 'glass'}`}
                            onClick={handleFollow}
                            style={isFollowing ? { borderColor: theme.primaryColor, color: theme.primaryColor } : {}}
                        >
                            {isFollowing ? '✓ Following' : '+ Follow'}
                        </button>
                        <button className="btn glass" onClick={() => setIsMessageModalOpen(true)}>Contact Us</button>
                        <button
                            className="btn glass p-4 rounded-2xl flex items-center justify-center gap-2"
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: business.name,
                                        text: `Check out ${business.name} on Oasis United!`,
                                        url: window.location.href,
                                    }).catch(() => { });
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Link copied to clipboard!');
                                }
                            }}
                        >
                            <span className="text-lg">🔗</span> Share
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-20 space-y-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="aspect-video bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center">
                        <span className="font-black uppercase tracking-widest text-[10px] opacity-40">📍 {business.location || "Location not set"}</span>
                    </div>
                    <div className="space-y-6 flex flex-col justify-center">
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase">Visit Us</h3>
                        <p>{business.location}</p>
                        {business.delivery_settings?.selfDelivery && (
                            <p className="text-sm font-medium text-green-600">✓ We deliver locally ({business.delivery_settings.radius} miles)</p>
                        )}
                        <div className="flex flex-wrap gap-4 pt-6">
                            <button className="btn btn-outline" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>Call Now</button>
                            <button className="btn btn-outline" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }} onClick={() => setIsMessageModalOpen(true)}>Message</button>
                            {business.integrations?.facebook?.connected && business.integrations?.facebook?.id && (
                                <a
                                    href={`https://m.me/${business.integrations.facebook.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline"
                                    style={{ borderColor: '#1877F2', color: '#1877F2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>📘</span> Messenger
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Our <span className="text-primary">Menu</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {products.length > 0 ? products.map((product) => (
                        <div key={product.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] overflow-hidden flex flex-col group">
                            <div className="aspect-square relative bg-white/10" style={{ backgroundImage: `url(${product.image_url || 'https://via.placeholder.com/400'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {business.delivery_settings?.selfDelivery && (
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur shadow-sm p-1.5 px-3 rounded-full flex items-center gap-1.5 border border-white">
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">Oasis Order</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-8 flex-1 flex flex-col space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="max-w-[70%]">
                                        <h4 className="font-black text-xl italic uppercase tracking-tight">{product.name}</h4>
                                        <button
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setIsReviewModalOpen(true);
                                            }}
                                            className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 hover:text-amber-600 transition-colors"
                                        >
                                            ★ View Reviews
                                        </button>
                                    </div>
                                    <span className="text-2xl font-black italic tracking-tighter" style={{ color: theme.primaryColor }}>${product.price}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-400 italic line-clamp-3">{product.description}</p>
                                <div className="mt-auto">
                                    {product.stock > 0 ? (
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%', backgroundColor: theme.primaryColor }}
                                            onClick={() => addToCart(product)}
                                        >
                                            Add to Cart
                                        </button>
                                    ) : (
                                        <button className="btn" disabled style={{ width: '100%' }}>Out of Stock</button>
                                    )}
                                    {product.stock > 0 && product.stock < 10 && (
                                        <p className="text-[10px] text-red-500 mt-1 font-bold">Only {product.stock} left!</p>
                                    )}
                                </div>
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
                    <div className="space-y-12">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">Latest <span className="text-primary">News</span></h2>
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

                {/* Business Feed (Shoutouts) */}
                <BusinessFeed businessId={business.id} />
            </div>

            <Cart businessId={business.id} items={cartItems} setItems={setCartItems} />

            {isMessageModalOpen && currentUser && (
                <ChatInterface
                    customerId={currentUser.id}
                    businessId={business.id}
                    senderId={currentUser.id}
                    businessName={business.name}
                    onClose={() => setIsMessageModalOpen(false)}
                />
            )}

            {selectedProduct && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    businessId={business.id}
                    productId={selectedProduct.id}
                    productName={selectedProduct.name}
                    theme={theme}
                />
            )}
        </div>
    );
}
