"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

export default function DashboardOverview() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        ordersServed: 0,
        totalRevenue: 0,
        activeProducts: 0,
        unreadMessages: 0,
        activeSpaces: 0,
        totalViews: 0,
        conversionRate: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [activityPulse, setActivityPulse] = useState<any[]>([]);

    useEffect(() => {
        let channel: any;

        async function loadDashboardData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }

            const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single();

            if (!business) {
                window.location.href = '/dashboard/onboarding';
                return;
            }

            const fetchData = async () => {
                // 1. Fetch Basic Stats & Analytics
                const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_id', business.id);
                const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', business.id);
                const { count: messageCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('is_read', false).eq('direction', 'inbound');
                const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('business_id', business.id);

                // Real-time Analytics (Phase 23)
                const { data: analytics } = await supabase
                    .from('daily_business_stats')
                    .select('*')
                    .eq('business_id', business.id)
                    .order('stat_date', { ascending: false });

                const { data: revenueDataPoints } = await supabase.from('orders').select('total, items').eq('business_id', business.id).eq('status', 'completed');

                const totalViews = analytics?.reduce((sum, s) => sum + (s.total_views || 0), 0) || 0;
                const totalRevenue = revenueDataPoints?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
                const totalOrdersVal = orderCount || 0;
                const convRate = totalViews > 0 ? (totalOrdersVal / totalViews) * 100 : 0;

                // Category Calculation
                const catTotals: Record<string, number> = {};
                revenueDataPoints?.forEach(order => {
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach((item: any) => {
                            const cat = item.category || 'Uncategorized';
                            catTotals[cat] = (catTotals[cat] || 0) + (Number(item.price) * Number(item.quantity));
                        });
                    }
                });
                setCategoryData(Object.entries(catTotals).map(([name, value]) => ({ name, value })));

                // 2. Fetch Recent Activities (Pulse)
                const { data: activities } = await supabase
                    .from('analytics_events')
                    .select('event_type, created_at, metadata')
                    .eq('business_id', business.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // 3. Fetch Recent Orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total, created_at, status, customer_name')
                    .eq('business_id', business.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                setStats({
                    totalOrders: orderCount || 0,
                    ordersServed: totalOrdersVal,
                    totalRevenue: totalRevenue,
                    activeProducts: productCount || 0,
                    unreadMessages: messageCount || 0,
                    activeSpaces: postCount || 0,
                    totalViews,
                    conversionRate: Number(convRate.toFixed(2))
                });
                setRecentOrders(orders || []);
                setActivityPulse(activities || []);

                // 4. Chart Data (Last 7 Days)
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const chartData = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayStat = analytics?.find(s => s.stat_date === dateStr);
                    const dailyRevenue = revenueDataPoints?.filter(o => {
                        // This is a bit rough, ideally we'd have daily revenue from analytics or a better query
                        return true; // Simplified for now to match the existing logic pattern
                    }).length; // This logic needs to be careful. 

                    chartData.push({
                        name: days[d.getDay()],
                        revenue: Number(dayStat?.total_revenue || 0),
                        views: dayStat?.total_views || 0
                    });
                }
                setRevenueData(chartData);
            };

            await fetchData();
            setLoading(false);

            // Subscribe to real-time order updates
            channel = supabase
                .channel('realtime_orders')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `business_id=eq.${business.id}`
                    },
                    (payload: any) => {
                        console.log('Real-time Order Update:', payload);
                        fetchData(); // Refresh everything

                        // Show notification for new paid orders
                        if (payload.eventType === 'UPDATE' && payload.new.status === 'completed' && payload.old.status !== 'completed') {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                            audio.play().catch(() => { }); // Optional sound
                            alert(`🎉 New paid order! $${payload.new.total} from ${payload.new.customer_name}`);
                        }
                    }
                )
                .subscribe();
        }

        loadDashboardData();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-gray-400 font-black animate-pulse uppercase tracking-widest">Loading Oasis Insight...</div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Dashboard Overview</h1>
                <p className="mt-2 text-lg text-gray-500 font-medium">Welcome back! Here's a summary of your business performance.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Revenue</span>
                    <span className="text-4xl font-black text-gray-900 mt-3">${stats.totalRevenue.toLocaleString()}</span>
                    <div className="mt-4 flex items-center gap-1">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12.5%</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">vs last month</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Marketplace Views</span>
                    <span className="text-4xl font-black text-gray-900 mt-3">{stats.totalViews.toLocaleString()}</span>
                    <div className="mt-4 flex items-center gap-1">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">ACTIVE</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Direct Discovery</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Conversion Rate</span>
                    <span className="text-4xl font-black text-gray-900 mt-3">{stats.conversionRate}%</span>
                    <div className="mt-4 flex items-center gap-1">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">OASIS SCORE</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">High Efficiency</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Spaces</span>
                    <span className="text-4xl font-black text-gray-900 mt-3">{stats.activeSpaces}</span>
                    <div className="mt-4 flex items-center gap-1">
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full">LIVE</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Posts & Events</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Performance Trends</h3>
                            <p className="text-sm text-gray-400 font-medium tracking-tight">Revenue and View distribution over the last 7 days</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-full"></div><span className="text-[10px] font-black text-gray-400 uppercase">Revenue</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-300 rounded-full"></div><span className="text-[10px] font-black text-gray-400 uppercase">Views</span></div>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#A5B4FC" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#A5B4FC" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94A3B8' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tick={{ fontSize: 10, fontWeight: 800, fill: '#94A3B8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }}
                                    itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                                    labelStyle={{ fontWeight: 900, fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}
                                    cursor={{ stroke: '#4F46E5', strokeWidth: 2, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="views" stroke="#A5B4FC" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Pulse Ticker */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8">Platform Pulse</h3>
                    <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                        {activityPulse.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-xs font-black text-gray-300 uppercase tracking-widest text-center">No pulse detected yet</p>
                            </div>
                        ) : activityPulse.map((event, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all group">
                                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${event.event_type === 'conversion' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' :
                                        event.event_type === 'click' ? 'bg-indigo-400' : 'bg-gray-300'
                                    }`} />
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-gray-900 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors">
                                        {event.event_type === 'conversion' ? 'New Customer Order' :
                                            event.event_type === 'click' ? 'Product Engagement' : 'Marketplace View'}
                                    </span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">
                                        {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.metadata?.page || 'Discovery'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Orders & Category Mix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Transactions</h3>
                        <Link href="/dashboard/orders" className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 tracking-widest uppercase">Review All →</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentOrders.map((order, i) => (
                                    <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-5 font-black text-gray-900 italic uppercase text-sm">{order.customer_name || 'Anonymous Guest'}</td>
                                        <td className="py-5 text-xs font-black text-gray-400 uppercase">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="py-5 font-black text-gray-900 text-lg tracking-tighter">${order.total}</td>
                                        <td className="py-5 text-right">
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Category Mix Pie Chart */}
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Revenue Mix</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Sales by Category</p>

                    <div style={{ width: '100%', height: 260 }}>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'REVENUE']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Data Pending</div>
                        )}
                    </div>

                    <div className="mt-6 space-y-3">
                        {categoryData.map((entry, index) => (
                            <div key={entry.name} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight group-hover:text-gray-900 transition-colors">{entry.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-900">${entry.value.toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
