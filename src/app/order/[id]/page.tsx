"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import LiveTracking from '@/components/LiveTracking';

export default function OrderPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrder() {
            if (!id) return;

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (orderError || !orderData) {
                console.error('Order not found');
                setLoading(false);
                return;
            }

            setOrder(orderData);

            const { data: bizData } = await supabase
                .from('businesses')
                .select('name, theme, location, owner_id')
                .eq('id', orderData.business_id)
                .single();

            if (bizData) {
                setBusiness(bizData);
            }
            setLoading(false);
        }

        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Verifying Receipt...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md">
                    <span className="text-6xl block mb-6">🔍</span>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Order Not Found</h1>
                    <p className="text-gray-500 mb-8">We couldn't find the order you're looking for. Please check your link or contact support.</p>
                    <Link href="/" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-indigo-700 transition-all block text-center">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const theme = business?.theme || { primaryColor: '#4f46e5', backgroundColor: '#ffffff' };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Brand Header */}
                    <div className="p-12 text-center border-b border-gray-50" style={{ backgroundColor: theme.backgroundColor }}>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner border border-gray-100 bg-white">
                            {order.type === 'pickup' ? '🛍️' : '🚚'}
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Success!</h1>
                        <p className="text-gray-500 mt-2 font-medium">Your order from <span className="text-indigo-600 font-bold">{business?.name}</span> is confirmed.</p>

                        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {order.status === 'completed' ? 'Paid & Confirmed' : 'Payment Received'}
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="p-12 space-y-10">
                        {/* Summary Items */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Order Summary</h3>
                            {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-xs text-gray-400 border border-gray-100">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{item.name}</p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">${item.price.toFixed(2)} each</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Live Delivery Tracking (Phase 15) */}
                        {order.type === 'shipping' && order.id && (
                            <div className="mb-12">
                                <LiveTracking orderId={order.id} />
                            </div>
                        )}

                        {/* Pricing Grid */}
                        <div className="bg-gray-50/50 p-8 rounded-3xl space-y-3 border border-gray-100/50">
                            <div className="flex justify-between text-sm text-gray-500 font-medium tracking-tight">
                                <span>Subtotal</span>
                                <span>${(order.total - (order.type === 'pickup' ? 0 : (order.total > 0 ? (order.total - order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)) : 0))).toFixed(2)}</span>
                            </div>
                            {order.type === 'shipping' && (
                                <div className="flex justify-between text-sm text-gray-500 font-medium tracking-tight">
                                    <span>Delivery Fee</span>
                                    <span>${(order.total - order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                                <span className="text-lg font-black text-gray-900 uppercase tracking-tight">Total Paid</span>
                                <span className="text-2xl font-black text-indigo-600">${order.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Delivery/Pickup Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</h4>
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-900">{order.customer_name}</p>
                                    <p className="text-sm text-gray-500">{order.customer_contact || 'No contact info provided'}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.type === 'pickup' ? 'Pickup Location' : 'Delivery Address'}</h4>
                                <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                                    {order.type === 'pickup' ? (business?.location || 'Store address not set') : order.address}
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-10 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                            >
                                🖨️ Print Receipt
                            </button>
                            <Link
                                href="/"
                                className="flex-1 py-4 bg-white text-gray-900 border border-gray-100 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                🏠 Back to Home
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Oasis United Order System &bull; Receipt #{order.id.slice(0, 8)}</p>
            </div>
        </div>
    );
}
