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
                className="fixed bottom-8 right-8 z-[100] bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-4 hover:scale-105 active:scale-95 transition-all group border border-white/10"
            >
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30 group-hover:rotate-12 transition-transform">
                    ✨
                </div>
                <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Oasis AI</div>
                    <div className="text-sm font-black uppercase tracking-widest">Ask Discovery</div>
                </div>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors z-10"
                >
                    ✕
                </button>

                <div className="p-12">
                    {step === 1 && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Step 01 / Intent</span>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tight">What are you looking for?</h2>
                            </div>
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Street food, local shops, yoga..."
                                className="w-full bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white p-6 rounded-3xl text-xl font-medium outline-none transition-all placeholder:text-gray-300"
                                onKeyDown={e => e.key === 'Enter' && handleNext()}
                            />
                            <div className="flex flex-wrap gap-2">
                                {['Espresso', 'Yoga', 'Tacos', 'Haircut', 'Gifts'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setQuery(tag)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${query === tag
                                            ? 'bg-gray-900 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleNext}
                                disabled={!query}
                                className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xs tracking-[0.2em] uppercase shadow-xl hover:bg-indigo-600 transition-all disabled:opacity-20"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-10">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Step 02 / Proximity</span>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Preferences</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Search Radius</label>
                                    <span className="text-xl font-black text-indigo-600">{distance}mi</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={distance}
                                    onChange={e => setDistance(Number(e.target.value))}
                                    className="w-full accent-indigo-600 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <label className="flex items-center gap-4 bg-gray-50 p-6 rounded-3xl cursor-pointer hover:bg-indigo-50/50 transition-colors group border border-transparent hover:border-indigo-100">
                                <input
                                    type="checkbox"
                                    checked={delivery}
                                    onChange={e => setDelivery(e.target.checked)}
                                    className="w-6 h-6 rounded-xl border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest block">Local Delivery</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Only show shops that deliver to me</span>
                                </div>
                            </label>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setStep(1)} className="px-8 py-5 text-gray-400 font-black text-[10px] uppercase tracking-widest">Back</button>
                                <button
                                    onClick={handleSearch}
                                    className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs tracking-[0.2em] uppercase shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all"
                                >
                                    {isSearching ? 'Analyzing Network...' : 'Find Matches'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto shadow-sm">🔮</div>
                                <h3 className="text-2xl font-black text-gray-900 leading-tight">
                                    {aiInsight || `Discovery Complete`}
                                </h3>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                                    Within {distance} miles • {delivery ? 'Delivery Required' : 'Pickup or Dine-in'}
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[350px] overflow-y-auto px-2 scrollbar-hide">
                                {results.length > 0 ? results.map((business, index) => (
                                    <div
                                        key={business.id || index}
                                        onClick={() => {
                                            handleClose();
                                            router.push(`/shop/${business.slug || business.id}`);
                                        }}
                                        className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-black text-lg text-gray-900 group-hover:text-indigo-600 transition-colors uppercase italic">{business.name}</h4>
                                            <span className="text-indigo-600 text-xl">→</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium line-clamp-2 italic leading-relaxed">
                                            {business.description || "Premium local merchant partner."}
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <span className="text-[9px] font-black bg-gray-50 text-gray-400 px-2 py-1 rounded-lg uppercase tracking-widest">{business.location || 'Local'}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center text-gray-400 font-medium bg-gray-50 rounded-3xl">
                                        No exact matches found in your area.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-5 bg-gray-100 text-gray-900 rounded-[2rem] font-black text-[10px] tracking-widest uppercase hover:bg-gray-200 transition-all"
                            >
                                New Discovery Search
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
