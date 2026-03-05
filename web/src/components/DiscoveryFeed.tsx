"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function DiscoveryFeed() {
    const [feedItems, setFeedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    useEffect(() => {
        async function loadFeed() {
            setLoading(true);

            // 1. Get New Arrivals (Decentralized Discovery)
            const { data: products } = await supabase
                .from('products')
                .select('*, businesses(name, location, logo_url)')
                .order('created_at', { ascending: false })
                .limit(8);

            // 2. Mix in "New Boutique" alerts
            const { data: boutiques } = await supabase
                .from('businesses')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(2);

            // 3. AI Personalization (Semantic Matches)
            const { data: { user } } = await supabase.auth.getUser();
            const recRes = await fetch(`/api/recommendations${user ? `?userId=${user.id}` : ''}`);
            const recData = await recRes.json();
            if (recData.success) setRecommendations(recData.recommendations);

            const mixed = [
                ...(products?.map(p => ({ ...p, feedType: 'product' })) || []),
                ...(boutiques?.map(b => ({ ...b, feedType: 'boutique' })) || [])
            ].sort(() => Math.random() - 0.5);

            setFeedItems(mixed);
            setLoading(false);
        }
        loadFeed();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-white/5 rounded-[3rem] animate-pulse"></div>
            ))}
        </div>
    );

    return (
        <div className="space-y-16">
            {/* AI Personalization Hub */}
            {recommendations.length > 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black italic tracking-tighter">Matched <span className="text-indigo-500">For You.</span></h2>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Semantic AI Discovery</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {recommendations.map((item) => (
                            <Link key={`rec-${item.id}`} href={`/shop/${item.business_id}`} className="group bg-gradient-to-br from-indigo-500/10 to-transparent rounded-[3rem] overflow-hidden border border-indigo-500/10 hover:border-indigo-500/30 transition-all p-2">
                                <div className="aspect-square relative overflow-hidden rounded-[2.5rem]">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl bg-indigo-950/20">💎</div>
                                    )}
                                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">
                                        {Math.round(item.similarity * 100)}% Match
                                    </div>
                                </div>
                                <div className="p-8 space-y-2">
                                    <p className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{item.name}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400/40">Highly Relevant Discovery</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Global Marketplace Stream */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {feedItems.map((item, idx) => {
                    if (item.feedType === 'boutique') {
                        return (
                            <Link key={`b-${item.id}`} href={`/shop/${item.id}`} className="lg:col-span-2 group bg-indigo-600 rounded-[3rem] p-12 flex flex-col justify-center items-center text-center space-y-6 shadow-2xl shadow-indigo-900/40 relative overflow-hidden transition-all hover:scale-[1.02]">
                                <div className="absolute top-0 right-0 p-8 opacity-10 grayscale group-hover:grayscale-0 transition-all duration-700">
                                    <span className="text-8xl italic font-black">✨</span>
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div className="text-[10px] font-black uppercase text-indigo-300 tracking-[0.4em]">New Boutique</div>
                                    <h3 className="text-4xl font-black italic tracking-tighter">{item.name}</h3>
                                    <p className="text-indigo-100/60 font-medium text-sm max-w-xs mx-auto italic">{item.description || 'Welcome the newest independent oasis to the network.'}</p>
                                    <div className="pt-4">
                                        <span className="px-8 py-3 bg-white text-indigo-600 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl">Explore Boutique</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link key={`p-${item.id}`} href={`/shop/${item.business_id}`} className="group bg-[#121215] rounded-[3rem] overflow-hidden border border-white/5 hover:bg-white/10 transition-all">
                            <div className="aspect-square relative overflow-hidden">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-[#1a1a1e]">🛍️</div>
                                )}
                                <div className="absolute top-6 left-6 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                                    Just Dropped
                                </div>
                            </div>
                            <div className="p-8 space-y-2">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-gray-200 group-hover:text-indigo-400 transition-colors truncate max-w-[120px]">{item.name}</p>
                                    <p className="font-black text-indigo-500 italic">${Number(item.price).toFixed(2)}</p>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 truncate">At {item.businesses?.name}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
