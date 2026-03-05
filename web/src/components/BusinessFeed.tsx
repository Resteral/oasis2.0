"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Shoutout {
    id: string;
    type: 'post' | 'promo' | 'alert';
    content: string;
    image_url: string | null;
    created_at: string;
}

export default function BusinessFeed({ businessId }: { businessId: string }) {
    const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeed() {
            setLoading(true);
            const { data } = await supabase
                .from('shoutouts')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false });

            if (data) setShoutouts(data);
            setLoading(false);
        }
        fetchFeed();
    }, [businessId]);

    if (loading) return <div className="p-8 text-center text-gray-400 font-black uppercase tracking-widest animate-pulse">Syncing Feed...</div>;
    if (shoutouts.length === 0) return null;

    return (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 mt-16">
            <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Latest Shoutouts</h2>
                <div className="h-px flex-1 bg-gray-100"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {shoutouts.map((post) => (
                    <div key={post.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all hover:-translate-y-1">
                        {post.image_url && (
                            <div className="h-64 overflow-hidden relative">
                                <img src={post.image_url} alt="Feed update" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute top-6 left-6">
                                    <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md ${post.type === 'alert' ? 'bg-rose-500/90 text-white' : post.type === 'promo' ? 'bg-amber-400/90 text-gray-900' : 'bg-white/90 text-indigo-600'
                                        }`}>{post.type}</span>
                                </div>
                            </div>
                        )}
                        <div className="p-8 space-y-4">
                            {!post.image_url && (
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${post.type === 'alert' ? 'bg-rose-50 text-rose-600' : post.type === 'promo' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                        }`}>{post.type}</span>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">Published {new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            )}
                            <p className="text-gray-900 font-bold text-lg leading-relaxed italic line-clamp-4">
                                "{post.content}"
                            </p>
                            {post.image_url && (
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter pt-4 border-t border-gray-50 italic">
                                    {new Date(post.created_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
