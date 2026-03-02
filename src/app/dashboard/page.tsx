"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
// import styles from './page.module.css'; // Removed in favor of Tailwind
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
        activeSpaces: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    // Revenue Data State
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);

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
                // 1. Fetch Basic Stats
                const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_id', business.id);
                const { count: servedCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('status', 'completed');
                const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', business.id);
                const { count: messageCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('is_read', false).eq('direction', 'inbound');
                const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('business_id', business.id);

                const { data: revenueDataPoints } = await supabase.from('orders').select('total, items').eq('business_id', business.id).eq('status', 'completed');
                const totalRevenue = revenueDataPoints?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;

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

                // 2. Fetch Recent Orders
                const { data: orders } = await supabase.from('orders').select('total, created_at, status, customer_name').eq('business_id', business.id).order('created_at', { ascending: false }).limit(5);

                setStats({
                    totalOrders: orderCount || 0,
                    ordersServed: servedCount || 0,
                    totalRevenue: totalRevenue,
                    activeProducts: productCount || 0,
                    unreadMessages: messageCount || 0,
                    activeSpaces: postCount || 0
                });
                setRecentOrders(orders || []);

                // 3. Chart Data
                const { data: last7DaysOrders } = await supabase.from('orders').select('created_at, total').eq('business_id', business.id).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).eq('status', 'completed');

                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const chartData = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dayName = days[d.getDay()];
                    const dateStr = d.toISOString().split('T')[0];
                    const dailyRevenue = last7DaysOrders?.filter(o => o.created_at.startsWith(dateStr)).reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
                    chartData.push({ name: dayName, revenue: dailyRevenue });
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

    if (loading) return <div className="p-8 flex justify-center text-gray-500">Loading dashboard...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
                <p className="mt-3 text-lg text-gray-500 max-w-2xl">Welcome back! Here's a high-level summary of your business performance today.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <Link href="/dashboard/rewards" className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Loyalty Rewards</span>
                    <span className="text-4xl font-black text-gray-900 mt-3">Active</span>
                    <div className="mt-4 flex items-center gap-1">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">LIVE</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Boutique Perks</span>
                    </div>
                </Link>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Revenue</span>
                    <span className="text-4xl font-black text-gray-900 mt-3">${stats.totalRevenue.toLocaleString()}</span>
                    <div className="mt-4 flex items-center gap-1">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12.5%</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">vs last month</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Orders Served</span>
                    <span className="text-4xl font-black text-gray-900 mt-3">{stats.ordersServed}</span>
                    <div className="mt-4 flex items-center gap-1">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">ACTIVE</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{stats.totalOrders} TOTAL</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Live Inventory</span>
                    <span className="text-4xl font-black text-gray-900 mt-3">{stats.activeProducts}</span>
                    <div className="mt-4 flex items-center gap-1">
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full">STOCK OK</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Items Online</span>
                    </div>
                </div>

                <Link href="/dashboard/messages" className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-rose-100"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400 relative z-10">Unread Inbox</span>
                    <span className="text-4xl font-black text-gray-900 mt-3 relative z-10">{stats.unreadMessages}</span>
                    <div className="mt-4 flex items-center gap-1 relative z-10">
                        <span className={`${stats.unreadMessages > 0 ? 'animate-pulse text-rose-600 bg-rose-50' : 'text-gray-400 bg-gray-50'} text-[10px] font-black px-2 py-1 rounded-full`}>
                            {stats.unreadMessages > 0 ? 'NEW MESSAGES' : 'CLEARED'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Customer Chats</span>
                    </div>
                </Link>
            </div>

            {/* Charts & Recent Orders Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Revenue Analytics</h3>
                                <p className="text-sm text-gray-400 font-medium">Daily performance tracking over the last 7 days</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Avg. Daily</span>
                                <span className="text-xl font-black text-indigo-600">${(stats.totalRevenue / 7).toFixed(0)}</span>
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
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94A3B8' }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `$${val}`}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94A3B8' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: '1px solid #F1F5F9',
                                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                                        labelStyle={{ fontWeight: 900, fontSize: '10px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}
                                        formatter={(value: number | undefined) => [`$${value}`, 'REVENUE']}
                                        cursor={{ stroke: '#4F46E5', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#4F46E5"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Pie Chart */}
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Revenue by Category</h3>
                        <p className="text-sm text-gray-400 font-medium mb-8">Sales distribution across categories</p>

                        <div style={{ width: '100%', height: 300 }}>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">
                                    No category data
                                </div>
                            )}
                        </div>

                        <div className="mt-4 space-y-2">
                            {categoryData.map((entry, index) => (
                                <div key={entry.name} className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-xs font-bold text-gray-600">{entry.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-gray-900">${entry.value.toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Activity</h3>
                        <a href="/dashboard/orders" className="text-xs font-black text-indigo-600 hover:text-indigo-800 tracking-widest uppercase transition-all">View All Orders →</a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentOrders.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-400">
                                <span className="text-4xl mb-4 opacity-20 block">🛒</span>
                                <p className="font-black text-sm uppercase tracking-widest opacity-30">No orders found</p>
                            </div>
                        ) : (
                            recentOrders.map((order, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-50/50 p-6 rounded-2xl transition-all hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                            {(order.customer_name || 'G')[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-gray-900 text-sm">{order.customer_name || 'Guest'}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-gray-900 text-lg tracking-tighter">${order.total}</span>
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
