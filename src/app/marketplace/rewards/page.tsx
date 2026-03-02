"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LoyaltyHub from '@/components/LoyaltyHub';
import Link from 'next/link';

export default function RewardsStorePage() {
    const [rewards, setRewards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function loadRewards() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);

            const res = await fetch('/api/loyalty');
            const data = await res.json();
            if (data.availableRewards) setRewards(data.availableRewards);
            setLoading(false);
        }
        loadRewards();
    }, []);

    const handleRedeem = async (rewardId: string, pointCost: number) => {
        if (!userId) {
            alert('Please sign in to redeem rewards!');
            return;
        }

        const res = await fetch('/api/loyalty', {
            method: 'POST',
            body: JSON.stringify({ userId, rewardId })
        });
        const data = await res.json();

        if (data.success) {
            alert(`🎉 Reward Redeemed! Code: ${data.redemption.redemption_code}`);
            window.location.reload(); // Refresh to update points
        } else {
            alert(data.error || 'Redemption failed');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white pt-32 pb-48 px-8">
            <div className="max-w-7xl mx-auto space-y-24">
                <header className="space-y-6 text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">The Perk Marketplace</span>
                    </div>
                    <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter leading-none">Global <span className="text-indigo-500">Rewards.</span></h1>
                    <p className="text-indigo-200/40 font-medium text-lg leading-relaxed italic">Turn your Oasis Points into premium treasures and exclusive experiences from the world's finest boutiques.</p>
                </header>

                <LoyaltyHub />

                <main className="space-y-12">
                    <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black italic tracking-tight">Available Perks</h2>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Redeemable Network Wide</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {rewards.map((reward) => (
                            <div key={reward.id} className="group bg-white/5 border border-white/5 rounded-[3rem] p-8 space-y-8 hover:bg-white/10 transition-all flex flex-col h-full relative overflow-hidden">
                                <div className="space-y-2 relative z-10">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">From {reward.businesses?.name}</span>
                                    <h3 className="text-2xl font-black tracking-tight leading-none group-hover:text-indigo-400 transition-colors uppercase italic">{reward.title}</h3>
                                    <p className="text-sm font-medium text-white/30 italic leading-relaxed pt-2 line-clamp-2">{reward.description}</p>
                                </div>

                                <div className="mt-auto space-y-6 relative z-10">
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-black italic tracking-tighter text-white">{reward.point_cost.toLocaleString()}</span>
                                        <span className="text-[10px] font-black uppercase text-indigo-400 pb-1.5">Oasis Pts</span>
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(reward.id, reward.point_cost)}
                                        className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-2xl"
                                    >
                                        Redeem Now
                                    </button>
                                </div>

                                {/* Visual Accent */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
