"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
    id: string;
    customer_name: string;
    customer_contact: string | null;
    total: number;
    status: string;
    channel: string;
    created_at: string;
}

const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-101',
    processing: 'bg-indigo-50 text-indigo-700 border-indigo-100'
};

const channelColors: Record<string, string> = {
    sms: 'bg-teal-50 text-teal-700 border-teal-100',
    instagram: 'bg-pink-50 text-pink-700 border-pink-100',
    facebook: 'bg-blue-50 text-blue-700 border-blue-100',
    web: 'bg-gray-50 text-gray-700 border-gray-100'
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchOrders = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (dateRange.start) {
            query = query.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            query = query.lte('created_at', end.toISOString());
        }

        const { data, error } = await query;

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [dateRange]);

    const handleExportCSV = () => {
        if (orders.length === 0) return;

        const headers = ['Order ID', 'Date', 'Customer', 'Contact', 'Channel', 'Total', 'Status'];
        const rows = orders.map(order => [
            order.id,
            new Date(order.created_at).toLocaleString(),
            order.customer_name || 'Guest',
            order.customer_contact || 'N/A',
            order.channel,
            order.total,
            order.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `oasis_orders_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-12 text-gray-400 font-black animate-pulse uppercase tracking-widest text-center">Loading Orders...</div>;

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end gap-6">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Recent Orders</h1>
                    <p className="mt-2 text-lg text-gray-500">Track and manage your customer transactions across all channels.</p>
                </div>

                {/* Date Controls */}
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1">Start Date</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1">End Date</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                    {(dateRange.start || dateRange.end) && (
                        <button
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                            title="Clear Filters"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <button
                    onClick={handleExportCSV}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-sm hover:shadow-lg hover:-translate-y-px transition-all flex items-center gap-2"
                >
                    <span className="text-lg">📥</span> Export
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase">Order Date</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase">Channel</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase">Total</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black tracking-widest text-gray-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map(order => (
                                <tr key={order.id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-bold text-gray-900">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        <div className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-tighter">
                                            {new Date(order.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-gray-900">{order.customer_name || 'Guest User'}</div>
                                        {order.customer_contact && <div className="text-xs text-gray-400 font-medium mt-0.5">{order.customer_contact}</div>}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-solid ${channelColors[order.channel?.toLowerCase()] || channelColors.web}`}>
                                            {(order.channel || 'WEB').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-lg font-black text-gray-900">${Number(order.total).toFixed(2)}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest border border-solid ${statusColors[order.status?.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                            {(order.status || 'PENDING').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="text-xs font-black text-indigo-600 hover:text-indigo-800 tracking-widest uppercase transition-colors">
                                            Manage Order →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="text-4xl mb-4">🛒</div>
                                        <div className="text-lg font-black text-gray-900">No orders yet</div>
                                        <p className="text-gray-400 mt-1">Your store activity will appear here once customers start ordering.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex gap-6">
                <div className="flex-1 bg-indigo-600 p-8 rounded-3xl text-white shadow-xl">
                    <div className="text-[10px] font-black tracking-widest uppercase opacity-70 mb-2">Pro Tip</div>
                    <h3 className="text-xl font-black mb-2">Connect Instagram DMS</h3>
                    <p className="text-indigo-100 text-sm leading-relaxed mb-6">Receive and manage orders directly through your social channels by connecting your business profile in settings.</p>
                    <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs tracking-widest uppercase shadow-sm hover:translate-y-px transition-all">
                        Connect Channels
                    </button>
                </div>
                <div className="flex-1 bg-gray-900 p-8 rounded-3xl text-white shadow-xl">
                    <div className="text-[10px] font-black tracking-widest uppercase opacity-70 mb-2">Store Stats</div>
                    <h3 className="text-xl font-black mb-2">Order Analytics</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">Understand your peak hours and top-selling channels with our advanced reporting dashboard.</p>
                    <button className="px-6 py-3 bg-gray-800 text-white border border-gray-700 rounded-xl font-black text-xs tracking-widest uppercase shadow-sm hover:translate-y-px transition-all">
                        View Reports
                    </button>
                </div>
            </div>
        </div>
    );
}
