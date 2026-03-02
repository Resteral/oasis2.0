"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Business } from '@/lib/types';

interface Follow {
    id: string;
    business: Business;
}

interface LoyaltyPoint {
    business_id: string;
    points: number;
    business: Business;
}

interface UserOrder {
    id: string;
    total: number;
    status: string;
    created_at: string;
    business: Business;
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

            // 1. Fetch Follows
            const { data: fData } = await supabase
                .from('follows')
                .select('id, business:businesses(*)')
                .eq('user_id', user.id);

            // 2. Fetch Loyalty Points
            const { data: pData } = await supabase
                .from('loyalty_points')
                .select('business_id, points, business:businesses(*)')
                .eq('user_id', user.id);

            // 3. Fetch Orders
            const { data: oData } = await supabase
                .from('orders')
                .select('id, total, status, created_at, business:businesses(*)')
                .eq('customer_name', user.user_metadata?.full_name || user.email) // Simple fallback for now
                .order('created_at', { ascending: false });

            if (fData) setFollows(fData as any);
            if (pData) setPoints(pData as any);
            if (oData) setOrders(oData as any);

            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) return <div className="p-12 text-gray-400 font-black animate-pulse uppercase tracking-widest text-center">Loading Your Oasis...</div>;

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-12 bg-gray-50">
                <div className="text-center space-y-6">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Your Personal Oasis</h1>
                    <p className="text-gray-400 max-w-sm mx-auto">Sign in to track your loyalty points, followed shops, and recent orders.</p>
                    <Link href="/auth/signin" className="btn btn-primary px-12 py-4 rounded-3xl font-black text-xs tracking-widest uppercase inline-block">Sign In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-12 lg:p-24 space-y-16">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full italic">Personal Hub</span>
                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Welcome back, {user.user_metadata?.full_name || 'Explorer'}</span>
                </div>
                <h1 className="text-6xl font-black text-gray-900 tracking-tight">My Oasis</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Follows & Rewards */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Followed Shops */}
                    <section>
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Shops You Follow</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {follows.length > 0 ? follows.map((follow) => (
                                <Link key={follow.id} href={`/shop/${follow.business.id}`} className="block group">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group-hover:-translate-y-1">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                                                {follow.business.name[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase">{follow.business.name}</h3>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{follow.business.category}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="col-span-full py-12 text-center bg-gray-100 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                                    <p className="text-gray-400 font-medium">You haven't followed any shops yet.</p>
                                    <Link href="/marketplace" className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mt-4 inline-block hover:underline">Explore Marketplace</Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Order History */}
                    <section>
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Recent Activity</h2>
                        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-gray-50">
                                    {orders.length > 0 ? orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-2xl opacity-50">📦</div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{order.business?.name || 'Local Shop'}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Receipt #{order.id.split('-')[0]}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-sm font-medium text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-10 py-8 text-right font-black text-gray-900">
                                                ${order.total.toFixed(2)}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td className="px-10 py-12 text-center text-gray-400">No orders found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Right Column: Loyalty Points & Stats */}
                <div className="space-y-12">
                    <section>
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Loyalty Rewards</h2>
                        <div className="space-y-4">
                            {points.length > 0 ? points.map((p) => (
                                <div key={p.business_id} className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 group hover:scale-[1.02] transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="text-2xl">✨</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Member</span>
                                    </div>
                                    <div className="text-3xl font-black mb-1">{p.points} <span className="text-sm font-bold opacity-60">Points</span></div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Saved at {p.business.name}</div>
                                </div>
                            )) : (
                                <div className="p-8 text-center bg-white rounded-[2.5rem] border border-gray-100 text-gray-400 text-sm italic font-medium">
                                    Start ordering to earn loyalty points!
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Stats Card */}
                    <section className="bg-gray-900 p-10 rounded-[3rem] text-white">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8 italic">Oasis Statistics</div>
                        <div className="space-y-8">
                            <div>
                                <div className="text-4xl font-black mb-1">{orders.filter(o => o.status === 'completed').length}</div>
                                <div className="text-[10px] font-black uppercase opacity-40">Orders Completed</div>
                            </div>
                            <div>
                                <div className="text-4xl font-black mb-1">{follows.length}</div>
                                <div className="text-[10px] font-black uppercase opacity-40">Shops Followed</div>
                            </div>
                            <div>
                                <div className="text-4xl font-black mb-1">
                                    {points.reduce((sum, p) => sum + Number(p.points), 0)}
                                </div>
                                <div className="text-[10px] font-black uppercase opacity-40">Lifetime Rewards</div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
