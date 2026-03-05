"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoyaltyHub() {
    const [loyaltyData, setLoyaltyData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLoyalty() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/loyalty?userId=${user.id}`);
            const data = await res.json();
            if (data.success) setLoyaltyData(data);
            setLoading(false);
        }
        loadLoyalty();
    }, []);

    if (loading) return (
        <div className="animate-pulse bg-white/5 rounded-[2.5rem] h-64 border border-white/5"></div>
    );

    if (!loyaltyData) return null;

    const { account, redemptions } = loyaltyData;
    const nextTierPoints = account.tier === 'Silver' ? 5000 : account.tier === 'Gold' ? 15000 : 0;
    const progress = nextTierPoints > 0 ? (account.lifetime_points / nextTierPoints) * 100 : 100;

    return (
        <div className="bg-indigo-600 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-indigo-900/40 relative overflow-hidden group">
            {/* Background Atmosphere */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none grayscale group-hover:grayscale-0 transition-all duration-700">
                <span className="text-[150px] italic font-black select-none">💎</span>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 text-indigo-200">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{account.tier} Status</span>
                        </div>
                        <h2 className="text-6xl font-black italic tracking-tighter leading-tight">Oasis <br />Points.</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-end gap-3">
                            <span className="text-7xl font-black tracking-tighter text-white">{account.points.toLocaleString()}</span>
                            <span className="text-xl font-black italic text-indigo-300 pb-2">Available</span>
                        </div>

                        <div className="space-y-2 max-w-xs">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200/60">
                                <span>Tier Progress</span>
                                <span>{account.lifetime_points.toLocaleString()} / {nextTierPoints > 0 ? nextTierPoints.toLocaleString() : 'MAX'}</span>
                            </div>
                            <div className="h-2 bg-indigo-900/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 px-4">Active Reward Codes</h3>
                    <div className="space-y-3">
                        {redemptions.length === 0 ? (
                            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center space-y-2">
                                <p className="text-sm font-bold text-white/50 italic">No active codes. Redeem points at any boutique or in the Global Rewards Store.</p>
                            </div>
                        ) : (
                            redemptions.map((red: any) => (
                                <div key={red.id} className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 flex items-center justify-between group/code">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{red.rewards?.businesses?.name}</p>
                                        <h4 className="font-bold text-sm tracking-tight">{red.rewards?.title}</h4>
                                    </div>
                                    <div className="bg-white text-indigo-600 px-4 py-2 rounded-2xl font-black text-xs tracking-widest shadow-xl group-hover:scale-110 transition-transform">
                                        {red.redemption_code}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
