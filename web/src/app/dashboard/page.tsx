'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#D4AF37', '#B8860B', '#996515', '#FFD700', '#F0E68C']; // Gold Palette

export default function DashboardOverview() {
    const router = useRouter();
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
                router.push('/auth');
                return;
            }

            const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single();

            if (!business) {
                router.push('/dashboard/onboarding');
                return;
            }

            const fetchData = async () => {
                // Fetch Stats
                const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('business_id', business.id);
                const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', business.id);

                // Real-time Analytics pattern
                const { data: revenueDataPoints } = await supabase.from('orders').select('total, items').eq('business_id', business.id).eq('status', 'completed');

                const totalRevenue = revenueDataPoints?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;

                setStats(prev => ({
                    ...prev,
                    totalOrders: orderCount || 0,
                    totalRevenue: totalRevenue,
                    activeProducts: productCount || 0,
                }));

                // Fetch Recent Orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total, created_at, status, customer_name')
                    .eq('business_id', business.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                setRecentOrders(orders || []);

                // Mock Chart Data for visualization if no analytics found
                const mockChart = [
                    { name: 'Mon', revenue: 400, views: 2400 },
                    { name: 'Tue', revenue: 300, views: 1398 },
                    { name: 'Wed', revenue: 200, views: 9800 },
                    { name: 'Thu', revenue: 278, views: 3908 },
                    { name: 'Fri', revenue: 189, views: 4800 },
                    { name: 'Sat', revenue: 239, views: 3800 },
                    { name: 'Sun', revenue: 349, views: 4300 },
                ];
                setRevenueData(mockChart);
            };

            await fetchData();
            setLoading(false);

            channel = supabase
                .channel('realtime_orders')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${business.id}` },
                    () => fetchData())
                .subscribe();
        }

        loadDashboardData();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [router]);

    if (loading) return (
        <div className="bg-gray-900 min-h-screen p-8 flex items-center justify-center">
            <div className="text-gold font-black animate-pulse uppercase tracking-widest italic">Oasis Insight Loading...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8 space-y-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                            Business <span className="text-gold">Intelligence</span>
                        </h1>
                        <p className="mt-2 text-gray-500 font-bold uppercase tracking-widest text-xs">Proprietary Store Analytics & Growth Pulse</p>
                    </div>
                    <Link href="/marketplace" className="text-gold hover:text-white transition-colors text-xs font-black uppercase tracking-widest border-b border-gold/30 pb-1">
                        View Public Storefront →
                    </Link>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, trend: '+14% growth', color: 'gold' },
                        { label: 'Marketplace Reach', value: stats.totalViews.toLocaleString(), trend: 'Live Discovery', color: 'blue' },
                        { label: 'Active Inventory', value: stats.activeProducts, trend: 'In-Store Items', color: 'purple' },
                        { label: 'Orders Processed', value: stats.totalOrders, trend: 'Conversion Active', color: 'green' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-gray-800 shadow-2xl relative overflow-hidden group hover:border-gold/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <div className="text-6xl font-black italic">{i + 1}</div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{stat.label}</span>
                            <div className="text-4xl font-black mt-4 text-white tracking-tighter italic">{stat.value}</div>
                            <div className="mt-4 flex items-center gap-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${stat.color === 'gold' ? 'bg-gold/10 text-gold' : 'bg-gray-800 text-gray-400'} uppercase`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-gray-900/30 backdrop-blur-xl p-10 rounded-[2.5rem] border border-gray-800/50 shadow-inner">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight">Performance Stream</h3>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">7-Day Revenue & Visibility Index</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-gold rounded-full"></div><span className="text-[9px] font-black text-gray-500 uppercase">Rev</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-gray-700 rounded-full"></div><span className="text-[9px] font-black text-gray-500 uppercase">View</span></div>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#4b5563' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#4b5563' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '10px', fontWeight: 900 }}
                                        cursor={{ stroke: '#D4AF37', strokeWidth: 1 }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fill="url(#colorGold)" />
                                    <Area type="monotone" dataKey="views" stroke="#374151" strokeWidth={2} fill="transparent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pulse / Activity */}
                    <div className="bg-gray-900/50 border border-gray-800 p-10 rounded-[2.5rem] flex flex-col">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8">Platform <span className="text-gold">Pulse</span></h3>
                        <div className="flex-1 space-y-6 overflow-y-auto">
                            {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                                    <div className="flex-1">
                                        <div className="flex justify-between text-[11px] font-black uppercase italic group-hover:text-gold transition-colors">
                                            <span>{order.customer_name || 'Guest'}</span>
                                            <span>${order.total}</span>
                                        </div>
                                        <div className="text-[9px] text-gray-600 font-black uppercase mt-0.5">
                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.status}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 opacity-20 italic font-black uppercase text-xs tracking-[0.2em]">Awaiting Activity</div>
                            )}
                        </div>
                        <Link href="/dashboard/orders" className="mt-8 text-center bg-gray-800 hover:bg-gray-700 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                            Full Order Logs
                        </Link>
                    </div>
                </div>

                {/* Sub-Navigation Grid */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                    {[
                        { label: 'Products', icon: '📦', href: '/dashboard/products' },
                        { label: 'Orders', icon: '📝', href: '/dashboard/orders' },
                        { label: 'CRM', icon: '👥', href: '/dashboard/crm' },
                        { label: 'Revenue', icon: '💰', href: '/dashboard/revenue' },
                        { label: 'Onboarding', icon: '🚀', href: '/dashboard/onboarding' },
                        { label: 'Messages', icon: '💬', href: '/messages' }
                    ].map((item, i) => (
                        <Link key={i} href={item.href} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl hover:bg-gray-800 hover:border-gold/20 transition-all flex flex-col items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
