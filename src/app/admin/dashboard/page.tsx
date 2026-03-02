"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlatformStats {
    totalRevenue: number;
    totalOrders: number;
    totalBusinesses: number;
    totalCustomers: number;
}

interface BusinessRow {
    id: string;
    name: string;
    category: string;
    owner_id: string;
    created_at: string;
    revenue?: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<PlatformStats>({ totalRevenue: 0, totalOrders: 0, totalBusinesses: 0, totalCustomers: 0 });
    const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
    const [accruedPayouts, setAccruedPayouts] = useState<number>(0);
    const [platformProfit, setPlatformProfit] = useState<number>(0);
    const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
    const [logisticsStats, setLogisticsStats] = useState({ onlineDrivers: 0, pendingRoutes: 0 });
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlatformData() {
            setLoading(true);

            // 1. Fetch Businesses
            const { data: bData } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });

            // 2. Fetch All Orders for Stats
            const { data: oData } = await supabase.from('orders').select('total, status');

            // 3. Fetch All Profiles for Customer count
            const { data: pData } = await supabase.from('profiles').select('id');

            // 4. Fetch Accrued Payouts & Platform Profit
            const { data: financeData } = await supabase
                .from('orders')
                .select('commission_fee, total, payout_status')
                .eq('status', 'completed');

            if (bData && oData && pData && financeData) {
                const completedOrders = oData.filter(o => o.status === 'completed');
                const revenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

                const accrued = financeData
                    .filter(o => o.payout_status === 'accrued')
                    .reduce((sum, o) => sum + (Number(o.total) - Number(o.commission_fee || 0)), 0);

                const profits = financeData.reduce((sum, o) => sum + Number(o.commission_fee || 0), 0);

                setAccruedPayouts(accrued);
                setPlatformProfit(profits);

                // 5. Fetch Logistics State
                const { data: drivers } = await supabase.from('drivers').select('id, status').eq('status', 'online');
                const { data: deliveries } = await supabase
                    .from('deliveries')
                    .select('*, orders(*, businesses(name)), drivers(user_id, vehicle_type)')
                    .neq('status', 'delivered');

                const { count: pendingRoutes } = await supabase
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('delivery_status', 'pending');

                setLogisticsStats({
                    onlineDrivers: drivers?.length || 0,
                    pendingRoutes: pendingRoutes || 0
                });
                setActiveDeliveries(deliveries || []);

                setStats({
                    totalRevenue: revenue,
                    totalOrders: oData.length,
                    totalBusinesses: bData.length,
                    totalCustomers: pData.length
                });
            }

            setBusinesses(bData as any);
            setLoading(false);
        }
        fetchPlatformData();
    }, []);

    const handleTriggerPayouts = async () => {
        if (accruedPayouts === 0) return alert('No pending payouts found.');
        if (!confirm(`Are you sure you want to distribute $${accruedPayouts.toFixed(2)} to all merchants?`)) return;

        setIsProcessingPayout(true);
        try {
            const res = await fetch('/api/admin/payouts', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('Success! Payout batch #' + data.batchId + ' has been triggered.');
                window.location.reload();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessingPayout(false);
        }
    };

    if (loading) return <div className="p-12 text-gray-400 font-black animate-pulse uppercase tracking-widest text-center">Loading Platform Intelligence...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-12 space-y-12">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">HQ Oversight</span>
                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Oasis United Platform Admin</span>
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight">Platform Overview</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Platform Profit', value: `$${platformProfit.toLocaleString()}`, trend: '+15.2%', icon: '📈' },
                    { label: 'Accrued Balance', value: `$${accruedPayouts.toLocaleString()}`, trend: 'Pending', icon: '🏦' },
                    { label: 'Total Orders', value: stats.totalOrders, trend: '+8.2%', icon: '📦' },
                    { label: 'Active Vendors', value: stats.totalBusinesses, trend: '+3', icon: '🏪' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{stat.icon}</span>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">{stat.trend}</span>
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className="text-3xl font-black text-gray-900">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Finance & Payouts Command Center */}
            <div className="bg-gray-900 rounded-[3.5rem] p-12 text-white flex flex-col lg:flex-row justify-between items-center gap-12 shadow-2xl shadow-indigo-500/20">
                <div className="space-y-4 text-center lg:text-left">
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Global Financial Liquidity</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight">Revenue Distribution</h2>
                    <p className="text-indigo-200/60 max-w-md font-medium italic">
                        Batch process earnings for all merchants in the Oasis network. Distribute accrued balances via PayPal Payouts instantly.
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center gap-10">
                    <div className="text-center md:text-left">
                        <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Accrued</div>
                        <div className="text-4xl font-black italic">${accruedPayouts.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={handleTriggerPayouts}
                        disabled={isProcessingPayout || accruedPayouts === 0}
                        className="px-10 py-5 bg-white text-indigo-600 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                    >
                        {isProcessingPayout ? 'Processing Batch...' : 'Trigger Batch Payouts'}
                    </button>
                </div>
            </div>

            {/* Logistics Monitoring Command Center */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">🚚</span>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Active Fulfillment</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Live Logistics Network</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Drivers Online</div>
                                <div className="text-xl font-black italic">{logisticsStats.onlineDrivers}</div>
                            </div>
                            <div className="text-right border-l pl-4 border-gray-100">
                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Pending Routes</div>
                                <div className="text-xl font-black italic">{logisticsStats.pendingRoutes}</div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-50">
                                {activeDeliveries.map((delivery) => (
                                    <tr key={delivery.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-sm font-black text-indigo-600 italic">
                                                    {delivery.orders?.businesses?.name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{delivery.orders?.businesses?.name}</div>
                                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">Order #{delivery.order_id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${delivery.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'
                                                }`}>
                                                {delivery.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="font-bold text-gray-900">{delivery.orders?.customer_name}</div>
                                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[150px] ml-auto">
                                                {delivery.orders?.address}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {activeDeliveries.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-10 py-20 text-center text-gray-400 font-medium italic">No active deliveries in the network.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Special Pool Spotlight */}
                    <div className="bg-indigo-900 rounded-[3rem] p-10 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Special Logistics Pool</span>
                            </div>
                            <h4 className="text-3xl font-black tracking-tighter italic">Long Range Oversight</h4>
                            <p className="text-indigo-200/50 text-sm font-medium leading-relaxed italic">Monitoring all fulfillments exceeding 20 miles. Ensuring high-performance vehicles are assigned.</p>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                <div>
                                    <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Pool Density</div>
                                    <div className="text-4xl font-black italic">3.2x</div>
                                </div>
                                <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all">Optimize</button>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <span className="text-[120px] italic font-black">🗺️</span>
                        </div>
                    </div>

                    {/* Driver Health */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-6">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fleet Composition</h4>
                        <div className="space-y-4">
                            {[
                                { type: 'Cars', count: '82%', color: 'bg-indigo-500' },
                                { type: 'Bikes', count: '12%', color: 'bg-emerald-500' },
                                { type: 'Vans', count: '6%', color: 'bg-amber-500' },
                            ].map((v, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-gray-900">
                                        <span>{v.type}</span>
                                        <span>{v.count}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                        <div className={`h-full ${v.color}`} style={{ width: v.count }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Management Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden text-black">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-2xl font-black tracking-tight">Merchant Network</h2>
                    <div className="flex gap-4">
                        <input type="text" placeholder="Search businesses..." className="px-6 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold w-64 focus:ring-2 focus:ring-indigo-100 transition-all" />
                        <button className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs tracking-widest uppercase">Filter</button>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-10 py-6 text-[10px] font-black tracking-widest text-gray-400 uppercase">Vendor Name</th>
                            <th className="px-10 py-6 text-[10px] font-black tracking-widest text-gray-400 uppercase">Category</th>
                            <th className="px-10 py-6 text-[10px] font-black tracking-widest text-gray-400 uppercase">Onboarded</th>
                            <th className="px-10 py-6 text-[10px] font-black tracking-widest text-gray-400 uppercase text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {businesses.map((biz) => (
                            <tr key={biz.id} className="hover:bg-gray-50/30 transition-colors cursor-pointer group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                                            {biz.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">{biz.name}</div>
                                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">ID: {biz.id.split('-')[0]}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                        {biz.category}
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-sm text-gray-500 font-medium">
                                    {new Date(biz.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <span className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                        Active
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Platform Insights Chart */}
            <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm h-[500px]">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-gray-900">Platform Growth</h2>
                        <p className="text-gray-400 text-sm font-medium mt-1">Daily transactional volume across all vendors.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase">Volume</button>
                        <button className="px-4 py-2 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase">Revenue</button>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={[
                        { name: 'Mon', value: 400 },
                        { name: 'Tue', value: 300 },
                        { name: 'Wed', value: 600 },
                        { name: 'Thu', value: 800 },
                        { name: 'Fri', value: 500 },
                        { name: 'Sat', value: 1200 },
                        { name: 'Sun', value: 1000 },
                    ]}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                        <YAxis hide />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#4F46E5" fillOpacity={1} fill="url(#colorVal)" strokeWidth={4} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
