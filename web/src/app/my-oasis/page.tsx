'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Follow {
    id: string;
    business: {
        id: string;
        name: string;
        category: string;
    };
}

interface LoyaltyPoint {
    business_id: string;
    points: number;
    business: {
        name: string;
    };
}

interface UserOrder {
    id: string;
    total: number;
    status: string;
    created_at: string;
    business?: {
        name: string;
    };
}

export default function MyOasisPage() {
    const [follows, setFollows] = useState<Follow[]>([]);
    const [points, setPoints] = useState<LoyaltyPoint[]>([]);
    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            setUser(user);

            // Fetch Follows
            const { data: fData } = await supabase
                .from('follows')
                .select('id, business:businesses(id, name, category)')
                .eq('user_id', user.id);

            // Fetch Loyalty Points
            const { data: pData } = await supabase
                .from('loyalty_points')
                .select('business_id, points, business:businesses(name)')
                .eq('user_id', user.id);

            // Fetch Orders
            const { data: oData } = await supabase
                .from('orders')
                .select('id, total, status, created_at, business:businesses(name)')
                .eq('user_id', user.id) // Updated to use user_id
                .order('created_at', { ascending: false });

            if (fData) setFollows(fData as any);
            if (pData) setPoints(pData as any);
            if (oData) setOrders(oData as any);

            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) return (
        <div className="bg-gray-950 min-h-screen p-12 flex items-center justify-center">
            <div className="text-indigo-400 font-black animate-pulse uppercase tracking-[0.3em] italic">Accessing Your Oasis...</div>
        </div>
    );

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-12 bg-gray-950 text-white">
                <div className="text-center space-y-6 max-w-md">
                    <h1 className="text-5xl font-black tracking-tighter italic uppercase text-indigo-400">Personal <span className="text-white">Oasis</span></h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs leading-loose">Sign in to track your proprietary loyalty assets, premium shop follows, and order history.</p>
                    <Link href="/auth" className="inline-block bg-white text-black px-12 py-4 rounded-full font-black text-[10px] tracking-[0.3em] uppercase hover:bg-indigo-400 transition-all">Sign In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 lg:p-20 space-y-20 pb-40">
            {/* Header */}
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <span className="px-4 py-1.5 bg-indigo-600/20 border border-indigo-600/30 text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] rounded-full italic">Vault Access Authorized</span>
                    <span className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">{user.email}</span>
                </div>
                <h1 className="text-7xl font-black tracking-tighter italic uppercase">My <span className="text-indigo-500">Oasis</span></h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-16">
                    {/* Followed Shops */}
                    <section>
                        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-10 border-l-2 border-indigo-600 pl-4 italic">Subscribed Storefronts</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {follows.length > 0 ? follows.map((follow) => (
                                <Link key={follow.id} href={`/shop/${follow.business.id}`} className="block group">
                                    <div className="bg-gray-900/50 backdrop-blur-md p-10 rounded-[2.5rem] border border-gray-800 hover:border-indigo-600/30 transition-all group-hover:-translate-y-2 shadow-2xl shadow-black/50">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-gray-800 rounded-3xl flex items-center justify-center text-indigo-500 font-black text-2xl border border-gray-700">
                                                {follow.business.name[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white italic group-hover:text-indigo-400 transition-colors uppercase tracking-tighter">{follow.business.name}</h3>
                                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mt-1">{follow.business.category}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="col-span-full py-20 text-center bg-gray-900/20 rounded-[3rem] border-2 border-dashed border-gray-800/50">
                                    <p className="text-gray-600 font-black text-[10px] uppercase tracking-widest italic mb-6">No storefront subscriptions detected</p>
                                    <Link href="/marketplace" className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-all underline">Initiate Exploration →</Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Order History */}
                    <section>
                        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-10 border-l-2 border-indigo-600 pl-4 italic">Transaction Records</h2>
                        <div className="bg-gray-900/50 rounded-[3rem] border border-gray-800 shadow-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-gray-800/50">
                                    {orders.length > 0 ? orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="text-3xl opacity-20 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">💠</div>
                                                    <div>
                                                        <div className="font-black text-white italic uppercase tracking-tighter text-lg">{order.business?.name || 'Authorized Merchant'}</div>
                                                        <div className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">Hash: {order.id.split('-')[0]}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-[10px] font-black text-gray-500 uppercase italic">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-12 py-10 text-right font-black text-white text-2xl tracking-tighter italic">
                                                ${order.total.toFixed(2)}
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${order.status === 'completed' ? 'bg-indigo-600/10 border-indigo-600/30 text-indigo-400' : 'bg-gray-800 border-gray-700 text-gray-500'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td className="px-12 py-20 text-center text-gray-600 italic font-black text-[10px] uppercase tracking-widest">Awaiting decentralized transactions</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-12">
                    <section>
                        <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-10 italic">Loyalty Rewards</h2>
                        <div className="space-y-6">
                            {points.length > 0 ? points.map((p) => (
                                <div key={p.business_id} className="bg-indigo-600/10 border border-indigo-600/30 p-10 rounded-[3rem] text-white shadow-3xl hover:bg-indigo-600 transition-all duration-500 group">
                                    <div className="flex justify-between items-start mb-8">
                                        <span className="text-3xl filter saturate-0 group-hover:saturate-100 transition-all">💎</span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.4em] border border-white/20 px-3 py-1 rounded-full opacity-50">Master Tier</span>
                                    </div>
                                    <div className="text-5xl font-black italic tracking-tighter mb-2">{p.points} <span className="text-sm font-bold opacity-30">Credits</span></div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-opacity">Asset reserved at {p.business.name}</div>
                                </div>
                            )) : (
                                <div className="p-10 text-center bg-gray-900/50 border border-gray-800 rounded-[3rem] text-gray-600 text-[10px] font-black uppercase tracking-widest italic">
                                    No loyalty assets acquired
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white p-12 rounded-[4rem] text-black shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-700" />
                        <div className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-10 italic relative z-10">Network Metrics</div>
                        <div className="space-y-10 relative z-10">
                            <div>
                                <div className="text-6xl font-black italic tracking-tighter mb-1">{orders.filter(o => o.status === 'completed').length}</div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Orders Finalized</div>
                            </div>
                            <div>
                                <div className="text-6xl font-black italic tracking-tighter mb-1">{follows.length}</div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Shops Subscribed</div>
                            </div>
                            <div>
                                <div className="text-6xl font-black italic tracking-tighter mb-1">
                                    {points.reduce((sum, p) => sum + Number(p.points), 0)}
                                </div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Accumulated Rewards</div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
