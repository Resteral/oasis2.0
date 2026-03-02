"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import GlobalSearch from '@/components/GlobalSearch';
import CategoryNav from '@/components/CategoryNav';
import DiscoveryFeed from '@/components/DiscoveryFeed';
import Link from 'next/link';

export default function MarketplacePage() {
    const [featured, setFeatured] = useState<any>({ businesses: [], products: [] });
    const [shoutouts, setShoutouts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMarketplace() {
            setLoading(true);

            // 1. Fetch Featured Content via API (with category support)
            const res = await fetch(`/api/search?category=${activeCategory}`);
            const data = await res.json();
            if (data.featured) {
                setFeatured(data.featured);
            } else if (data.results) {
                setFeatured({ businesses: data.results.businesses, products: data.results.products });
            }

            // 2. Fetch Global Shoutouts
            const { data: globalShoutouts } = await supabase
                .from('shoutouts')
                .select('*, businesses(name, location, logo_url)')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(4);

            if (globalShoutouts) setShoutouts(globalShoutouts);
            setLoading(false);
        }
        loadMarketplace();
    }, [activeCategory]);

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500">
            {/* Global Marketplace Hero */}
            <div className="relative pt-32 pb-48 px-8 overflow-hidden">
                {/* Background Atmosphere */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_#1e1b4b_0%,_#0a0a0c_70%)] pointer-events-none"></div>
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>

                <div className="max-w-7xl mx-auto relative z-10 text-center space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">The Global Oasis</span>
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-none">
                            Discover <span className="text-indigo-500">Everything.</span>
                        </h1>
                        <p className="max-w-xl mx-auto text-indigo-200/40 font-medium text-lg leading-relaxed">
                            Boutiques, treasures, and experiences from the world's most premium independent ecosystem.
                        </p>
                    </div>

                    <GlobalSearch />
                </div>
            </div>

            {/* Global Discovery Grid */}
            <main className="max-w-7xl mx-auto px-8 -mt-24 pb-32 space-y-32">
                {/* Category Navigation Bar */}
                <section className="relative z-50">
                    <CategoryNav onCategoryChange={setActiveCategory} />
                </section>

                {/* Discovery Stream */}
                <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black italic tracking-tight">Oasis Discovery</h2>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Curated Fresh Arrivals</p>
                        </div>
                    </div>
                    <DiscoveryFeed />
                </section>

                {/* Featured Boutiques Slider/Grid */}
                {(featured.businesses?.length > 0) && (
                    <section className="space-y-12">
                        <div className="flex justify-between items-end px-4">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black italic tracking-tight">Featured {activeCategory !== 'All' ? activeCategory : 'Boutiques'}</h2>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Selected for Excellence</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            {featured.businesses.map((biz: any) => (
                                <Link key={biz.id} href={`/shop/${biz.id}`} className="group relative bg-[#121215] rounded-[2.5rem] p-8 border border-white/5 hover:bg-white/10 transition-all overflow-hidden h-64 flex flex-col justify-end">
                                    <div className="absolute top-8 left-8 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-black italic text-indigo-500 border border-white/5 group-hover:scale-110 transition-transform">
                                        {biz.name[0]}
                                    </div>
                                    <div className="space-y-1 relative z-10">
                                        <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors truncate">{biz.name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-tight text-white/30 truncate">{biz.category}</p>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Live Platform Shoutouts */}
                <section className="bg-indigo-600 rounded-[4rem] p-12 md:p-20 shadow-2xl shadow-indigo-900/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none grayscale group-hover:grayscale-0 transition-all duration-700">
                        <span className="text-[200px] italic font-black select-none">📢</span>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 text-indigo-300">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Live Platform Updates</span>
                                </div>
                                <h2 className="text-6xl font-black italic tracking-tighter leading-tight">Global <br />Shoutouts.</h2>
                            </div>
                            <p className="text-indigo-100/60 font-medium text-lg max-w-sm italic">See what's happening in your community. Real-time drops, events, and specials from the network.</p>
                        </div>

                        <div className="space-y-4">
                            {shoutouts.map((shout: any) => (
                                <div key={shout.id} className="bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 flex items-center gap-6 hover:bg-white/20 transition-all group/shout cursor-default">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
                                        {shout.type === 'promo' ? '💎' : shout.type === 'alert' ? '✨' : '📝'}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{shout.businesses?.name}</span>
                                            <span className="text-[10px] font-bold text-white/30 uppercase">{new Date(shout.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="font-bold text-sm tracking-tight leading-relaxed">{shout.content}</p>
                                    </div>
                                </div>
                            ))}
                            {shoutouts.length === 0 && (
                                <div className="text-center py-12 text-indigo-300/40 italic">Waiting for the next cross-store update...</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Trending Products Exploration */}
                <section className="space-y-12">
                    <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black italic tracking-tight">Trending Treasures</h2>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">Global Best Sellers</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featured.products?.map((product: any) => (
                            <Link key={product.id} href={`/shop/${product.business_id}`} className="group space-y-4">
                                <div className="aspect-[4/5] bg-white rounded-[3rem] overflow-hidden relative border border-white/5 shadow-2xl">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl bg-[#121215]">📦</div>
                                    )}
                                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-lg rounded-3xl translate-y-20 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
                                        <button className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Quick Peek</button>
                                    </div>
                                </div>
                                <div className="px-4 flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg leading-tight truncate max-w-[150px]">{product.name}</h3>
                                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-tighter italic">From {product.businesses?.name}</p>
                                    </div>
                                    <div className="text-xl font-black italic text-emerald-400">${Number(product.price).toFixed(2)}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>

            {/* Platform Footer Simulation */}
            <footer className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 grid grid-cols-1 md:grid-cols-4 gap-16 opacity-30">
                <div className="space-y-6">
                    <h2 className="text-3xl font-black italic tracking-tighter">Oasis.</h2>
                    <p className="text-sm font-medium">Elevating local independent boutiques into a global discovery engine.</p>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Explore</h4>
                    <ul className="space-y-2 text-sm font-medium"><li>Top Gems</li><li>New Drops</li><li>Gift Cards</li></ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Sell</h4>
                    <ul className="space-y-2 text-sm font-medium"><li>Open a Boutique</li><li>Pricing</li><li>Success Stories</li></ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Social</h4>
                    <ul className="space-y-2 text-sm font-medium"><li>Instagram</li><li>Twitter</li><li>Our Journal</li></ul>
                </div>
            </footer>
        </div>
    );
}
