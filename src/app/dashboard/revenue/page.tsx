"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OrderRevenue {
    id: string;
    total: number;
    commission_fee: number;
    payout_status: string;
    created_at: string;
}

export default function RevenuePage() {
    const [orders, setOrders] = useState<OrderRevenue[]>([]);
    const [stats, setStats] = useState({
        accrued: 0,
        paid: 0,
        pending: 0,
        totalSales: 0
    });
    const [payoutEmail, setPayoutEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRevenueData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: business } = await supabase
                    .from('businesses')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (business) {
                    // Fetch Orders
                    const { data: ordersData } = await supabase
                        .from('orders')
                        .select('id, total, commission_fee, payout_status, created_at')
                        .eq('business_id', business.id)
                        .eq('status', 'completed')
                        .order('created_at', { ascending: false });

                    if (ordersData) {
                        setOrders(ordersData as any);

                        const accrued = ordersData
                            .filter(o => o.payout_status === 'accrued')
                            .reduce((sum, o) => sum + (Number(o.total) - Number(o.commission_fee)), 0);

                        const paid = ordersData
                            .filter(o => o.payout_status === 'paid')
                            .reduce((sum, o) => sum + (Number(o.total) - Number(o.commission_fee)), 0);

                        const totalSales = ordersData.reduce((sum, o) => sum + Number(o.total), 0);

                        setStats({ accrued, paid, pending: 0, totalSales });
                    }

                    // Fetch Payout Settings
                    const { data: settings } = await supabase
                        .from('payout_settings')
                        .select('paypal_email')
                        .eq('business_id', business.id)
                        .single();

                    if (settings) setPayoutEmail(settings.paypal_email);
                }
            }
            setLoading(false);
        }
        loadRevenueData();
    }, []);

    if (loading) return <div className="p-12 text-center font-black uppercase tracking-widest text-gray-400 animate-pulse">Loading Revenue Data...</div>;

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500">
            <header className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">Financial Command</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Merchant Earnings</span>
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight">Revenue Dashboard</h1>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Available for Payout</div>
                    <div className="text-4xl font-black text-gray-900">${stats.accrued.toFixed(2)}</div>
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mt-2 italic">Accrued & Ready</div>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Successfully Paid</div>
                    <div className="text-4xl font-black text-gray-900">${stats.paid.toFixed(2)}</div>
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter mt-2 italic">Lifetime Distributed</div>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Platform Commissions</div>
                    <div className="text-4xl font-black text-gray-900">
                        ${(orders.reduce((sum, o) => sum + Number(o.commission_fee || 0), 0)).toFixed(2)}
                    </div>
                </div>
                <div className="bg-gray-900 p-10 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/10">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Gross Sales</div>
                    <div className="text-4xl font-black">${stats.totalSales.toFixed(2)}</div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-tighter mt-2 italic">Volume Processed</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 space-y-8">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Recent Transactions</h2>
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Oasis Fee</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Net Earning</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-10 py-8">
                                            <div className="font-bold text-gray-900 italic">#{order.id.split('-')[0]}</div>
                                            <div className="text-[9px] text-gray-400 font-bold uppercase">{new Date(order.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-10 py-8 font-medium text-gray-600">${Number(order.total).toFixed(2)}</td>
                                        <td className="px-10 py-8 font-medium text-amber-600">-${Number(order.commission_fee || 0).toFixed(2)}</td>
                                        <td className="px-10 py-8 text-right font-black text-emerald-600">
                                            ${(Number(order.total) - Number(order.commission_fee || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-gray-400 font-medium">No completed transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payout Controls */}
                <div className="space-y-8">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Payout Settings</h2>
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                        <div>
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 italic">Next Payout Cycle</div>
                            <div className="text-xl font-bold text-gray-900 italic">Every Monday</div>
                            <p className="text-xs text-gray-400 mt-2">Automated batch distributions occur every week at 00:00 UTC.</p>
                        </div>

                        <div className="pt-8 border-t border-gray-50">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">PayPal Payout Email</label>
                            {payoutEmail ? (
                                <div className="p-6 bg-gray-50 rounded-2xl flex items-center justify-between group">
                                    <div className="font-bold text-gray-900 truncate mr-4">{payoutEmail}</div>
                                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg uppercase">ACTIVE</span>
                                </div>
                            ) : (
                                <div className="p-6 bg-amber-50 rounded-2xl text-amber-700 text-xs font-medium italic">
                                    Missing payout details. Please visit settings to connect your PayPal account.
                                </div>
                            )}
                        </div>

                        <button className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">
                            Request Manual Payout
                        </button>
                    </div>

                    <div className="bg-indigo-900 p-10 rounded-[3rem] text-white">
                        <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4 italic">Merchant Pro Tip</div>
                        <p className="text-sm font-medium leading-relaxed italic opacity-80">
                            "Upgrade to Elite to reduce your platform commission to just 2% and unlock instant daily payouts."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
