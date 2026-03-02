"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MarketingPage() {
    const [content, setContent] = useState('');
    const [type, setType] = useState('post');
    const [imageUrl, setImageUrl] = useState('');
    const [shoutouts, setShoutouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [businessId, setBusinessId] = useState<string | null>(null);

    useEffect(() => {
        async function loadMarketingData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: business } = await supabase
                    .from('businesses')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (business) {
                    setBusinessId(business.id);
                    const { data: shoutoutsData } = await supabase
                        .from('shoutouts')
                        .select('*')
                        .eq('business_id', business.id)
                        .order('created_at', { ascending: false });

                    if (shoutoutsData) setShoutouts(shoutoutsData);
                }
            }
            setLoading(false);
        }
        loadMarketingData();
    }, []);

    const handlePostShoutout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId || !content) return;
        setSending(true);

        const { data, error } = await supabase
            .from('shoutouts')
            .insert({
                business_id: businessId,
                type,
                content,
                image_url: imageUrl || null
            })
            .select()
            .single();

        if (error) {
            alert('Error posting shoutout: ' + error.message);
        } else {
            setShoutouts([data, ...shoutouts]);
            setContent('');
            setImageUrl('');
            alert('Shoutout published! It will now appear on your public storefront feed.');
        }
        setSending(false);
    };

    if (loading) return <div className="p-12 text-center font-black uppercase tracking-widest text-gray-400 animate-pulse">Warming up Marketing Tools...</div>;

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500">
            <header className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full">Engagement Suite</span>
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight italic text-rose-600">Marketing & Shoutouts</h1>
                <p className="text-gray-400 font-medium max-w-xl">Broadcast updates, limited-time promos, and important alerts directly to your followers.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                {/* Composer */}
                <div className="space-y-8">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Create Shoutout</h2>
                    <form onSubmit={handlePostShoutout} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Shoutout Type</label>
                            <div className="flex gap-2">
                                {['post', 'promo', 'alert'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-gray-50 text-gray-400'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Message Content</label>
                            <textarea
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's happening at your shop today?"
                                className="w-full bg-gray-50 p-8 rounded-[2rem] text-lg font-bold outline-none h-48 placeholder:text-gray-300 border-2 border-transparent focus:border-rose-100 focus:bg-white transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Image URL (Optional)</label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full bg-gray-50 p-6 rounded-[2rem] text-sm font-bold outline-none border-2 border-transparent focus:border-rose-100 focus:bg-white transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-6 bg-rose-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-gray-900 transition-all disabled:opacity-50"
                        >
                            {sending ? 'Publishing Updates...' : 'Publish Shoutout'}
                        </button>
                    </form>
                </div>

                {/* Live Feed Preview */}
                <div className="space-y-8">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Previous Shoutouts</h2>
                    <div className="space-y-6">
                        {shoutouts.map((s) => (
                            <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden flex gap-6">
                                <div className={`w-1 h-full absolute top-0 left-0 ${s.type === 'alert' ? 'bg-rose-500' : s.type === 'promo' ? 'bg-amber-400' : 'bg-indigo-400'
                                    }`}></div>

                                {s.image_url && (
                                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden">
                                        <img src={s.image_url} alt="Post content" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${s.type === 'alert' ? 'bg-rose-50 text-rose-600' : s.type === 'promo' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                            }`}>{s.type}</span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Published {new Date(s.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-900 font-bold leading-relaxed">{s.content}</p>
                                </div>
                            </div>
                        ))}
                        {shoutouts.length === 0 && (
                            <div className="p-20 text-center text-gray-300 font-medium italic border-2 border-dashed border-gray-100 rounded-[3rem]">
                                Your marketing feed is empty. Draft your first shoutout to engage your followers.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
