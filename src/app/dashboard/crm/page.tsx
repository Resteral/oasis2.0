"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CRMCustomer {
    id: string;
    full_name: string;
    avatar_url: string;
    subscription_tier: string;
    ltv: number;
    orderCount: number;
    lastOrderDate: string;
    isFollower: boolean;
}

export default function CRMPage() {
    const [customers, setCustomers] = useState<CRMCustomer[]>([]);
    const [stats, setStats] = useState({
        totalCustomers: 0,
        avgLtv: 0,
        activeRetention: 0,
        totalFollowers: 0
    });
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCRMData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: business } = await supabase
                    .from('businesses')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (business) {
                    // 1. Fetch Orders for LTV and Frequency
                    const { data: ordersData } = await supabase
                        .from('orders')
                        .select('consumer_id, total, created_at, customer_name')
                        .eq('business_id', business.id)
                        .eq('status', 'completed');

                    // 2. Fetch Followers
                    const { data: followersData } = await supabase
                        .from('follows')
                        .select('user_id')
                        .eq('business_id', business.id);

                    // 3. Aggregate Customer Data
                    const customerMap = new Map<string, CRMCustomer>();
                    const followerIds = new Set(followersData?.map((f: { user_id: string }) => f.user_id) || []);

                    ordersData?.forEach(order => {
                        if (!order.consumer_id) return;

                        const existing = customerMap.get(order.consumer_id);
                        if (existing) {
                            existing.ltv += Number(order.total);
                            existing.orderCount += 1;
                            if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
                                existing.lastOrderDate = order.created_at;
                            }
                        } else {
                            customerMap.set(order.consumer_id, {
                                id: order.consumer_id,
                                full_name: order.customer_name || 'Guest User',
                                avatar_url: '',
                                subscription_tier: 'free',
                                ltv: Number(order.total),
                                orderCount: 1,
                                lastOrderDate: order.created_at,
                                isFollower: followerIds.has(order.consumer_id)
                            });
                        }
                    });

                    // Add followers who haven't ordered yet
                    followerIds.forEach(fid => {
                        if (!customerMap.has(fid)) {
                            customerMap.set(fid, {
                                id: fid,
                                full_name: 'New Follower',
                                avatar_url: '',
                                subscription_tier: 'free',
                                ltv: 0,
                                orderCount: 0,
                                lastOrderDate: '',
                                isFollower: true
                            });
                        }
                    });

                    const customerList = Array.from(customerMap.values());
                    setCustomers(customerList);

                    // Calculate Summary Stats
                    const totalLtv = customerList.reduce((sum, c) => sum + c.ltv, 0);
                    const avgLtv = totalLtv / (customerList.length || 1);
                    const activeRetention = (customerList.filter(c => c.orderCount > 1).length / (customerList.length || 1)) * 100;

                    setStats({
                        totalCustomers: customerList.length,
                        avgLtv,
                        activeRetention,
                        totalFollowers: followerIds.size
                    });
                }
            }
            setLoading(false);
        }
        loadCRMData();
    }, []);

    const filteredCustomers = customers.filter(c => {
        if (filter === 'all') return true;
        if (filter === 'vips') return c.ltv > 100; // Example VIP threshold
        if (filter === 'followers') return c.isFollower;
        if (filter === 'inactive') {
            if (!c.lastOrderDate) return true;
            const daysSince = (new Date().getTime() - new Date(c.lastOrderDate).getTime()) / (1000 * 3600 * 24);
            return daysSince > 30;
        }
        return true;
    });

    if (loading) return <div className="p-12 text-center font-black uppercase tracking-widest text-gray-400 animate-pulse">Initializing CRM Engine...</div>;

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500">
            <header className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-violet-100 text-violet-600 text-[10px] font-black uppercase tracking-widest rounded-full">Merchant CRM</span>
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight">Oasis Relationships</h1>
                <p className="text-gray-400 font-medium max-w-xl">Deep analytics on your community. Identify high-value patrons and re-engage inactive customers.</p>
            </header>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Total Audience</div>
                        <div className="text-4xl font-black text-gray-900">{stats.totalCustomers}</div>
                        <div className="text-[10px] font-black text-violet-500 mt-2 uppercase italic">{stats.totalFollowers} Followers</div>
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer LTV (Avg)</div>
                    <div className="text-4xl font-black text-gray-900">${stats.avgLtv.toFixed(2)}</div>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Repeat Rate</div>
                    <div className="text-4xl font-black text-gray-900">{stats.activeRetention.toFixed(0)}%</div>
                </div>
                <div className="bg-gray-900 p-10 rounded-[2.5rem] text-white shadow-xl shadow-violet-500/10">
                    <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-4 italic italic">Global Status</div>
                    <div className="text-4xl font-black italic">Active</div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl">
                        {['all', 'vips', 'followers', 'inactive'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button className="px-8 py-3 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-violet-600 transition-colors">
                        Export CRM Data
                    </button>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Profile</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Engagement</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Lifetime Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 font-black italic">
                                                {customer.full_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-violet-600 transition-colors">{customer.full_name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {customer.isFollower && (
                                                        <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Follower</span>
                                                    )}
                                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">
                                                        Last seen {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-gray-900 italic">{customer.orderCount}</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Orders</span>
                                            </div>
                                            {customer.orderCount > 0 && (
                                                <button
                                                    onClick={() => window.location.href = '/dashboard/marketing'}
                                                    className="px-4 py-2 bg-violet-50 text-violet-600 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all"
                                                >
                                                    Re-engage
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="text-2xl font-black text-gray-900 italic">${customer.ltv.toFixed(2)}</div>
                                        <div className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Platform High Tier</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                        <div className="p-20 text-center text-gray-400 font-medium italic">No customers match the selected filter.</div>
                    )}
                </div>
            </div>

            <section className="bg-violet-900 rounded-[3rem] p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="relative z-10 space-y-2 text-center md:text-left">
                    <h3 className="text-3xl font-black tracking-tight italic">Ready to engage?</h3>
                    <p className="text-violet-200/60 max-w-sm">Use Pro-Tier Shoutouts to send marketing blasts and promos to your most valuable segments.</p>
                </div>
                <button className="px-10 py-5 bg-white text-violet-900 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all relative z-10">
                    Draft Shoutout
                </button>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <span className="text-[120px] italic font-black">@</span>
                </div>
            </section>
        </div>
    );
}
