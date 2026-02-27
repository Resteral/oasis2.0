"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// import styles from './page.module.css'; // Removed in favor of Tailwind
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

    useEffect(() => {
        async function loadDashboardData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Redirect to login if not authenticated
                window.location.href = '/login';
                return;
            }

            const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single();

            if (!business) {
                // If they don't have a business set up, force them to onboarding
                window.location.href = '/dashboard/onboarding';
                return;
            }

            if (business) {
                // 1. Fetch Basic Stats
                const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_id', business.id);

                const { count: servedCount } = await supabase.from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('business_id', business.id)
                    .eq('status', 'completed');

                const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', business.id);

                const { count: messageCount } = await supabase.from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('business_id', business.id)
                    .eq('is_read', false)
                    .eq('direction', 'inbound');

                const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('business_id', business.id);

                // Calculate Total Revenue (Real)
                const { data: revenueDataPoints } = await supabase
                    .from('orders')
                    .select('total, status')
                    .eq('business_id', business.id)
                    .eq('status', 'completed');

                const totalRevenue = revenueDataPoints?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;

                // 2. Fetch Recent Orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total, created_at, status, customer_name')
                    .eq('business_id', business.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                setStats({
                    totalOrders: orderCount || 0,
                    ordersServed: servedCount || 0,
                    totalRevenue: totalRevenue,
                    activeProducts: productCount || 0,
                    unreadMessages: messageCount || 0,
                    activeSpaces: postCount || 0
                });

                setRecentOrders(orders || []);

                // 3. Generate Chart Data (Last 7 Days - Real Aggregation)
                const { data: last7DaysOrders } = await supabase
                    .from('orders')
                    .select('created_at, total')
                    .eq('business_id', business.id)
                    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                    .eq('status', 'completed'); // Only count completed revenue for chart? Or all? Usually completed.

                // Aggregate by day
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const chartDataMap = new Map();

                // Initialize last 7 days
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dayName = days[d.getDay()];
                    // Use date string as key to handle same week days if needed, but for simple "Mon/Tue" display:
                    // Simple approach: Just show last 7 days roughly.
                    // Better: Create 7 entries.
                    const key = dayName;
                    if (!chartDataMap.has(key)) {
                        chartDataMap.set(key, { name: key, revenue: 0, orders: 0 });
                    }
                }

                // Fill with data
                last7DaysOrders?.forEach(order => {
                    const d = new Date(order.created_at);
                    const dayName = days[d.getDay()];
                    if (chartDataMap.has(dayName)) {
                        const entry = chartDataMap.get(dayName);
                        entry.revenue += Number(order.total) || 0;
                        entry.orders += 1;
                    }
                });

                // Convert to array and ensure order (Last 7 days strictly)
                // Re-generating the array to ensure chronological order
                const finalChartData = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dayName = days[d.getDay()];
                    // Find the entry we populated (resetting it might duplicate if not careful with day names rolling over? 
                    // Actually usually fine for 7 days unless we cross a boundary where Mon appears twice? No, 7 days is unique names usually unless...
                    // Wait, 7 days ago was Mon, Today is Mon. names collide.
                    // Better to use date string as key.
                    // Let's stick to the map we built but ensure correct order.

                    // Correct approach: Just iterate i=6 to 0 again and build objects.
                    // Need to match data correctly.
                    // Let's simplify:
                }

                // Redo Chart Logic for simplicity and correctness
                const chartData = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dayName = days[d.getDay()];
                    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD for matching

                    const dailyRevenue = last7DaysOrders
                        ?.filter(o => o.created_at.startsWith(dateStr))
                        .reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;

                    chartData.push({
                        name: dayName, // potentially ambiguous if 7 days span, typically fine.
                        revenue: dailyRevenue,
                        // orders: ...
                    });
                }

                setRevenueData(chartData);
            }
            setLoading(false);
        }
        loadDashboardData();
    }, []);

    if (loading) return <div className="p-8 flex justify-center text-gray-500">Loading dashboard...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="mt-2 text-gray-500">Welcome back! Here's what's happening to your business today.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
                    <span className="text-sm font-medium text-gray-500">Total Revenue</span>
                    <span className="text-3xl font-bold text-gray-900 mt-2">${stats.totalRevenue.toLocaleString()}</span>
                    <span className="text-xs font-medium text-green-600 mt-2 bg-green-50 px-2 py-1 rounded w-fit">+12% vs last month</span>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
                    <span className="text-sm font-medium text-gray-500">Orders Taken</span>
                    <span className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</span>
                    <span className="text-xs font-medium text-green-600 mt-2 bg-green-50 px-2 py-1 rounded w-fit">+5% vs last month</span>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
                    <span className="text-sm font-medium text-gray-500">Active Products</span>
                    <span className="text-3xl font-bold text-gray-900 mt-2">{stats.activeProducts}</span>
                    <span className="text-xs font-medium text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded w-fit">Inventory Status</span>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
                    <span className="text-sm font-medium text-gray-500">Unread Messages</span>
                    <span className="text-3xl font-bold text-gray-900 mt-2">{stats.unreadMessages}</span>
                    <span className={`text-xs font-medium mt-2 px-2 py-1 rounded w-fit ${stats.unreadMessages > 0 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'}`}>
                        {stats.unreadMessages > 0 ? 'Action Required' : 'All caught up'}
                    </span>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
                    <span className="text-sm font-medium text-gray-500">Active Spaces</span>
                    <span className="text-3xl font-bold text-gray-900 mt-2">{stats.activeSpaces}</span>
                    <span className="text-xs font-medium text-indigo-600 mt-2 bg-indigo-50 px-2 py-1 rounded w-fit">Posts & Events</span>
                </div>
            </div>

            {/* Charts & Recent Orders Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Analytics</h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number | undefined) => [`$${value}`, 'Revenue']}
                                    cursor={{ stroke: '#4F46E5', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#4F46E5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                        <a href="/dashboard/orders" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</a>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {recentOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <p>No recent orders found.</p>
                            </div>
                        ) : (
                            recentOrders.map((order, i) => (
                                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">{order.customer_name || 'Guest'}</span>
                                        <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()} • 2 items</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-gray-900">${order.total}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wide mt-1 px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {order.status}
                                        </span>
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
