"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MerchantRewardsPage() {
    const [rewards, setRewards] = useState<any[]>([]);
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        point_cost: 500,
        reward_type: 'discount',
        reward_value: 0
    });

    useEffect(() => {
        async function loadMerchantRewards() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: bus } = await supabase
                .from('businesses')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (bus) {
                setBusiness(bus);
                const { data: rwds } = await supabase
                    .from('rewards')
                    .select('*')
                    .eq('business_id', bus.id)
                    .order('created_at', { ascending: false });

                if (rwds) setRewards(rwds);
            }
            setLoading(false);
        }
        loadMerchantRewards();
    }, []);

    const handleCreateReward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business) return;

        const { data, error } = await supabase
            .from('rewards')
            .insert({
                business_id: business.id,
                ...formData
            })
            .select()
            .single();

        if (data) {
            setRewards([data, ...rewards]);
            setIsCreating(false);
            setFormData({ title: '', description: '', point_cost: 500, reward_type: 'discount', reward_value: 0 });
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="p-8 md:p-12 space-y-12 max-w-5xl mx-auto">
            <header className="flex justify-between items-end">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
                        <span className="text-[10px] font-black uppercase tracking-widest">Loyalty Management</span>
                    </div>
                    <h1 className="text-5xl font-black italic tracking-tighter text-gray-900 leading-tight">Boutique <span className="text-indigo-600">Rewards.</span></h1>
                    <p className="text-gray-400 font-medium max-w-md italic text-sm">Create exclusive perks to reward your most loyal shoppers and drive repeat business.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                    + New Reward
                </button>
            </header>

            {isCreating && (
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <h2 className="text-2xl font-black italic tracking-tight">Define Your Perk</h2>
                    <form onSubmit={handleCreateReward} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Reward Title</label>
                            <input
                                type="text"
                                placeholder="e.g. $10 Off Your Next Order"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Point Cost</label>
                            <input
                                type="number"
                                value={formData.point_cost}
                                onChange={(e) => setFormData({ ...formData, point_cost: parseInt(e.target.value) })}
                                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                required
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Description</label>
                            <textarea
                                placeholder="Explain the benefit of this reward..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 px-6 py-5 rounded-3xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[120px]"
                            />
                        </div>
                        <div className="flex gap-4 md:col-span-2 pt-4">
                            <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Publish Reward</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-4 bg-gray-100 text-gray-400 rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rewards.length === 0 ? (
                    <div className="md:col-span-2 py-24 flex flex-col items-center justify-center gap-6 bg-gray-50 rounded-[3rem] border border-gray-100 text-center">
                        <span className="text-5xl grayscale opacity-20 bg-white p-8 rounded-full shadow-sm">💎</span>
                        <div className="space-y-2">
                            <p className="font-black text-xl text-gray-900 italic">No rewards active.</p>
                            <p className="text-sm text-gray-400 max-w-xs">Start building your loyalty network by adding your first reward perk today.</p>
                        </div>
                    </div>
                ) : (
                    rewards.map((reward) => (
                        <div key={reward.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col group h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <h3 className="font-black text-xl text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic leading-none">{reward.title}</h3>
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block pt-1">{reward.reward_type}</span>
                                </div>
                                <div className="bg-indigo-50 px-4 py-2 rounded-2xl text-indigo-600 font-black text-xs tracking-tighter">
                                    {reward.point_cost} Pts
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm font-medium italic leading-relaxed line-clamp-2 mb-8 flex-1">"{reward.description}"</p>
                            <div className="pt-6 border-t border-gray-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className={reward.is_active ? 'text-emerald-500' : 'text-rose-500'}>{reward.is_active ? '● Active' : '○ Disabled'}</span>
                                <span className="text-gray-300">Created {new Date(reward.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
