"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface CartProps {
    businessId: string;
    items: CartItem[];
    setItems: (items: CartItem[]) => void;
}

export default function Cart({ businessId, items, setItems }: CartProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Order State
    const [orderType, setOrderType] = useState<'pickup' | 'shipping'>('pickup');
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [address, setAddress] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [vendorTier, setVendorTier] = useState('free');
    const [userPoints, setUserPoints] = useState(0);

    // Voucher State
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [voucherError, setVoucherError] = useState('');

    useEffect(() => {
        async function fetchData() {
            if (!businessId) return;

            // 1. Get Vendor Tier
            const { data: business } = await supabase
                .from('businesses')
                .select('owner_id')
                .eq('id', businessId)
                .single();

            if (business?.owner_id) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('subscription_tier')
                    .eq('id', business.owner_id)
                    .single();

                if (profile) setVendorTier(profile.subscription_tier || 'free');
            }

            // 2. Get Loyalty Points
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: loyalty } = await supabase
                    .from('loyalty_points')
                    .select('points')
                    .eq('user_id', user.id)
                    .eq('business_id', businessId)
                    .single();
                if (loyalty) setUserPoints(Number(loyalty.points));
            }
        }
        fetchData();
    }, [businessId]);

    const handleApplyVoucher = async () => {
        if (!promoCode || !businessId) return;
        setVoucherError('');

        const { data: voucher, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('business_id', businessId)
            .eq('code', promoCode.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !voucher) {
            setVoucherError('Invalid or expired code');
            setDiscount(0);
            return;
        }

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (subtotal < Number(voucher.min_spend)) {
            setVoucherError(`Minimum spend of $${voucher.min_spend} required`);
            setDiscount(0);
            return;
        }

        if (voucher.discount_type === 'percentage') {
            setDiscount((subtotal * Number(voucher.discount_value)) / 100);
        } else {
            setDiscount(Number(voucher.discount_value));
        }
    };

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = orderType === 'shipping' ? (vendorTier === 'free' ? 10.00 : 0) : 0;
    const total = Math.max(0, subtotal + shippingCost - discount);

    const handleCheckout = async () => {
        if (!customerName || !customerContact) {
            alert("Please enter your name and contact info (Email/Phone)");
            return;
        }
        if (orderType === 'shipping' && !address) {
            alert("Please enter your shipping address");
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Create the Order via API (handles stock and loyalty)
            const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId,
                    customerName,
                    customerContact,
                    items,
                    total,
                    type: orderType,
                    address: orderType === 'shipping' ? address : undefined
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Checkout failed');

            // 2. Mock Automation Notify
            console.log("Mock Automation order processed", data.order.id);

            // 3. Mock Analytics
            console.log("Mock Analytics tracked purchase", { total, items_count: items.length });

            alert("Order placed successfully! We'll notify you as soon as it's ready.");
            setItems([]);
            setIsOpen(false);
            setCustomerName('');
            setCustomerContact('');
            setAddress('');
        } catch (err: any) {
            console.error("Checkout failed:", err);
            alert("Checkout failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOrderCapture = async (paypalOrderId: string, dbOrderId: string) => {
        try {
            const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paypalOrderId, dbOrderId }),
            });
            const data = await response.json();
            if (data.status === 'COMPLETED') {
                // Mock Track Analytics
                console.log("Mock Analytics tracked PayPal purchase", { total, method: 'paypal' });

                setItems([]);
                setIsOpen(false);
                router.push(`/order/${dbOrderId}`);
            } else {
                alert("Payment failed or is still pending.");
            }
        } catch (error) {
            console.error('Capture Error:', error);
            alert("Error finalizing payment.");
        }
    };

    return (
        <>
            <button className="fixed bottom-8 right-8 bg-primary text-black rounded-full px-6 py-4 shadow-[0_10px_40px_rgba(229,180,80,0.3)] z-50 font-black italic uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3 border border-primary/50" onClick={() => setIsOpen(true)}>
                🛒 <span className="bg-black text-primary px-3 py-1 rounded-full text-xs">{items.length}</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="w-full max-w-md bg-gray-950 h-full border-l border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-8 border-b border-gray-800/50 flex justify-between items-start glass">
                            <div>
                                <h2>Your Order</h2>
                                {userPoints > 0 && (
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">
                                        ✨ {userPoints} Loyalty Points Available
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 text-xl">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                            {items.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 font-black italic tracking-widest text-[10px] uppercase">Your cart is empty.</p>
                                    <button className="bg-primary text-black px-8 py-3 rounded-full font-black text-[9px] uppercase tracking-widest mt-4" onClick={() => setIsOpen(false)}>Continue Shopping</button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex justify-between items-center group hover:border-primary/30 transition-colors">
                                        <div className="flex-1">
                                            <p className="font-black italic text-white uppercase tracking-tight">{item.name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">${Number(item.price).toFixed(2)} x {item.quantity}</p>
                                        </div>
                                        <div className="font-black italic text-primary text-lg">
                                            ${(Number(item.price) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="p-8 border-t border-gray-800/50 bg-gray-950 glass mt-auto relative z-10">
                                <div className="flex gap-2">
                                    <button
                                        className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border transition-all ${orderType === 'pickup' ? 'bg-primary border-primary text-black' : 'border-gray-800 text-gray-500 hover:text-white'}`}
                                        onClick={() => setOrderType('pickup')}
                                    >
                                        Pickup
                                    </button>
                                    <button
                                        className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border transition-all ${orderType === 'shipping' ? 'bg-primary border-primary text-black' : 'border-gray-800 text-gray-500 hover:text-white'}`}
                                        onClick={() => setOrderType('shipping')}
                                    >
                                        Shipping {vendorTier === 'free' ? '(+$10)' : '(FREE)'}
                                    </button>
                                </div>

                                <div className="space-y-3 mt-8">
                                    <input
                                        type="text"
                                        placeholder="Full Name *"
                                        className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-sm focus:border-primary/50 outline-none text-white italic transition-all"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Email or Phone *"
                                        className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-sm focus:border-primary/50 outline-none text-white italic transition-all"
                                        value={customerContact}
                                        onChange={(e) => setCustomerContact(e.target.value)}
                                    />
                                    {orderType === 'shipping' && (
                                        <input
                                            type="text"
                                            placeholder="Shipping Address *"
                                            className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-sm focus:border-primary/50 outline-none text-white italic transition-all"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                        />
                                    )}
                                </div>

                                <div className="mt-8 border-t border-gray-800/50 pt-8">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Promo Code"
                                            className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-sm focus:border-primary/50 outline-none text-white transition-all uppercase flex-1"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                        />
                                        <button
                                            onClick={handleApplyVoucher}
                                            className="bg-gray-800 border border-gray-700 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-700 transition-all"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    {voucherError && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-tighter">{voucherError}</p>}
                                    {discount > 0 && <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase tracking-tighter">Discount Applied: -${discount.toFixed(2)}</p>}
                                </div>

                                <div className="space-y-4 font-black italic mt-8 text-lg text-white">
                                    <div className="flex justify-between items-center text-gray-400">
                                        <span className="text-[10px] uppercase tracking-widest">Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between items-center text-emerald-400">
                                            <span className="text-[10px] uppercase tracking-widest">Discount</span>
                                            <span>-${discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {orderType === 'shipping' && (
                                        <div className="flex justify-between items-center text-gray-500">
                                            <span className="text-[10px] uppercase tracking-widest">Shipping</span>
                                            <span>${shippingCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-3xl text-primary border-t border-gray-800/50 pt-4 mt-4">
                                        <span className="text-[12px] uppercase tracking-widest text-white mt-1">Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-12 space-y-4">
                                    {customerName && (orderType === 'pickup' || address) ? (
                                        <div className="space-y-4">
                                            <button
                                                className="w-full bg-[#FFC439] hover:bg-[#F4BB33] text-[#003087] font-black italic rounded-full py-4 transition-colors text-sm tracking-tight"
                                                onClick={() => {
                                                    alert("PayPal integration is currently mocked.");
                                                    handleOrderCapture("MOCK_PAYPAL_ID", Math.random().toString(36).substring(7));
                                                }}
                                            >
                                                <span className="text-[#003087]">Pay</span><span className="text-[#0079C1]">Pal</span> Checkout
                                            </button>
                                            <button
                                                onClick={handleCheckout}
                                                className="w-full bg-primary hover:bg-white text-black font-black italic uppercase tracking-tighter text-sm rounded-full py-4 transition-colors"
                                            >
                                                Standard Checkout
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="w-full bg-gray-800 text-gray-500 font-black italic uppercase tracking-tighter text-sm rounded-full py-4 cursor-not-allowed"
                                        >
                                            {isProcessing ? 'Processing' : 'Awaiting Details'}
                                        </button>
                                    )}
                                    <button className="w-full text-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors py-4" onClick={() => setIsOpen(false)}>
                                        Keep Shopping
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
