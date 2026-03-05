"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any>({ products: [], shops: [] });
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isAiMode, setIsAiMode] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                const apiEndpoint = isAiMode ? `/api/search/v2?q=${encodeURIComponent(query)}` : `/api/search?q=${encodeURIComponent(query)}`;
                const res = await fetch(apiEndpoint);
                const data = await res.json();
                if (data.success) {
                    setResults(data.results);
                    setIsOpen(true);
                }
                setLoading(false);
            } else {
                setResults({ products: [], shops: [] });
                setIsOpen(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, isAiMode]);

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl mx-auto z-[100]">
            <div className="relative group p-1 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none gap-3">
                    <span className={`text-xl transition-all duration-500 ${isAiMode ? 'grayscale-0 rotate-12 scale-125' : 'grayscale'}`}>
                        {isAiMode ? '🤖' : '🔍'}
                    </span>
                    {isAiMode && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">AI Online</span>
                    )}
                </div>

                <input
                    type="text"
                    placeholder={isAiMode ? "Ask Oasis: 'Find me a cozy outfit for a rainy day...'" : "Search treasures, boutiques, or makers..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim().length > 1 && setIsOpen(true)}
                    className="w-full bg-transparent text-white pl-24 pr-24 py-6 rounded-[2.5rem] text-sm font-bold tracking-tight outline-none placeholder:text-gray-500 transition-all"
                />

                <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-4"></div>
                    ) : (
                        <button
                            onClick={() => {
                                setIsAiMode(!isAiMode);
                                setResults({ products: [], shops: [] });
                                setQuery('');
                            }}
                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isAiMode
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                                    : 'bg-white/10 text-white/40 hover:bg-white/20'
                                }`}
                        >
                            {isAiMode ? 'AI ACTIVE' : 'SWITCH TO AI'}
                        </button>
                    )}
                </div>
            </div>

            {/* Results Overlay */}
            {isOpen && (
                <div className="absolute top-full mt-6 w-full bg-[#0d0d0f]/95 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_48px_128px_-16px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-6 duration-500">
                    <div className="max-h-[75vh] overflow-y-auto custom-scrollbar p-6 space-y-8">

                        {isAiMode && (
                            <div className="px-6 py-4 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 mb-4">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Thinking Semantically...</p>
                                <p className="text-white/40 text-xs font-medium italic">"Connecting your intent with the global Oasis catalog."</p>
                            </div>
                        )}

                        {/* Shops Section */}
                        {results.shops?.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] px-6">Curated Boutiques</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {results.shops.map((biz: any) => (
                                        <Link
                                            key={biz.id}
                                            href={`/shop/${biz.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-6 p-6 rounded-[2.5rem] hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                                        >
                                            <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-2xl font-black text-indigo-600 italic group-hover:scale-110 transition-transform shadow-2xl">
                                                {biz.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-lg text-white group-hover:text-indigo-400 transition-colors tracking-tight uppercase">{biz.name}</p>
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{biz.location}</span>
                                                    <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{biz.category || 'Boutique'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Products Section */}
                        {results.products?.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] px-6">Marketplace Treasures</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {results.products.map((product: any) => (
                                        <Link
                                            key={product.id}
                                            href={`/shop/${product.business_id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-6 p-6 rounded-[2.5rem] hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                                        >
                                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center p-2 border border-white/5 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
                                                ) : (
                                                    <span className="text-3xl grayscale opacity-20">📦</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-black text-white text-lg group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{product.name}</p>
                                                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-0.5 italic">at {product.businesses?.name || 'Exclusive Shop'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-indigo-500 text-xl tracking-tighter">${Number(product.price).toFixed(2)}</p>
                                                        {product.similarity && (
                                                            <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">
                                                                {Math.round(product.similarity * 100)}% Match
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(!results.products || results.products.length === 0) && (!results.shops || results.shops.length === 0) && (
                            <div className="py-32 text-center space-y-6">
                                <span className="text-6xl animate-pulse inline-block grayscale opacity-20">📡</span>
                                <div className="space-y-2">
                                    <p className="text-white text-xl font-black italic tracking-tight uppercase">Scanning the Oasis...</p>
                                    <p className="text-white/20 text-xs font-medium italic">No matches found for &ldquo;{query}&rdquo;.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
