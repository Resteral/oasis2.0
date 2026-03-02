"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PayPalButtons } from '@paypal/react-paypal-js';
import styles from './Cart.module.css';
import { AutomationService } from '@/services/automation';
import { supabase } from '@/lib/supabase';

interface CartProps {
    businessId?: string;
}

export default function Cart({ businessId }: CartProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<any[]>([]);

    // Simple listener for cart additions (for demo purposes)
    // In a real app, use a Context or State Management
    useEffect(() => {
        const handleAddToCart = (e: any) => {
            const product = e.detail;
            setItems(prev => {
                const existing = prev.find(item => item.id === product.id);
                if (existing) {
                    return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
                }
                return [...prev, { ...product, quantity: 1 }];
            });
            setIsOpen(true);
        };
        window.addEventListener('add-to-cart', handleAddToCart);
        return () => window.removeEventListener('add-to-cart', handleAddToCart);
    }, []);

    // Order State
    const [orderType, setOrderType] = useState<'pickup' | 'shipping'>('pickup');
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [vendorTier, setVendorTier] = useState('free');

    // Voucher State
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [voucherError, setVoucherError] = useState('');

    useEffect(() => {
        async function fetchVendorTier() {
            if (!businessId) return;

            // 1. Get Owner ID from business
            const { data: business } = await supabase
                .from('businesses')
                .select('owner_id')
                .eq('id', businessId)
                .single();

            if (business?.owner_id) {
                // 2. Get Tier from profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('subscription_tier')
                    .eq('id', business.owner_id)
                    .single();

                if (profile) setVendorTier(profile.subscription_tier || 'free');
            }
        }
        fetchVendorTier();
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

        // Check spend limit
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (subtotal < Number(voucher.min_spend)) {
            setVoucherError(`Minimum spend of $${voucher.min_spend} required`);
            setDiscount(0);
            return;
        }

        // Apply discount
        if (voucher.discount_type === 'percentage') {
            setDiscount((subtotal * Number(voucher.discount_value)) / 100);
        } else {
            setDiscount(Number(voucher.discount_value));
        }
    };

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = orderType === 'shipping' ? (vendorTier === 'free' ? 10.00 : 0) : 0;
    const total = Math.max(0, subtotal + shippingCost - discount);

    const [userPoints, setUserPoints] = useState(0);

    useEffect(() => {
        const fetchPoints = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !businessId) return;

            const { data } = await supabase
                .from('loyalty_points')
                .select('points')
                .eq('user_id', user.id)
                .eq('business_id', businessId)
                .single();

            if (data) setUserPoints(Number(data.points));
        };
        fetchPoints();
    }, [businessId]);

    const handleOrderCapture = async (paypalOrderId: string, dbOrderId: string) => {
        try {
            const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paypalOrderId, dbOrderId }),
            });
            const data = await response.json();
            if (data.status === 'COMPLETED') {
                // Award Loyalty Points
                const { data: { user } } = await supabase.auth.getUser();
                if (user && businessId) {
                    const pointsToAward = Math.floor(total);
                    const { data: current } = await supabase
                        .from('loyalty_points')
                        .select('points')
                        .eq('user_id', user.id)
                        .eq('business_id', businessId)
                        .single();

                    const newPoints = (current?.points || 0) + pointsToAward;
                    await supabase
                        .from('loyalty_points')
                        .upsert({
                            user_id: user.id,
                            business_id: businessId,
                            points: newPoints,
                            last_updated: new Date().toISOString()
                        });
                }

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
            <button className={styles.cartBtn} onClick={() => setIsOpen(true)}>
                🛒 <span className={styles.badge}>{items.length}</span>
            </button>

            {isOpen && (
                <div className={styles.overlay}>
                    <div className={styles.sidebar}>
                        <div className={styles.header}>
                            <div>
                                <h2>Your Order</h2>
                                {userPoints > 0 && (
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">
                                        ✨ {userPoints} Loyalty Points Available
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>✕</button>
                        </div>

                        <div className={styles.items}>
                            {items.length === 0 ? (
                                <p className={styles.empty}>Your cart is empty.</p>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className={styles.item}>
                                        <div className={styles.itemInfo}>
                                            <p className={styles.itemName}>{item.name}</p>
                                            <p className={styles.itemPrice}>${item.price.toFixed(2)} x {item.quantity}</p>
                                        </div>
                                        <div className={styles.itemTotal}>
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className={styles.footer}>
                                {/* Order Type Toggle */}
                                <div className={styles.toggleGroup}>
                                    <button
                                        className={`${styles.toggleBtn} ${orderType === 'pickup' ? styles.active : ''}`}
                                        onClick={() => setOrderType('pickup')}
                                    >
                                        Pickup
                                    </button>
                                    <button
                                        className={`${styles.toggleBtn} ${orderType === 'shipping' ? styles.active : ''}`}
                                        onClick={() => setOrderType('shipping')}
                                    >
                                        Shipping {vendorTier === 'free' ? '(+$10)' : '(FREE)'}
                                    </button>
                                </div>

                                {/* Customer Details */}
                                <div className={styles.form}>
                                    <input
                                        type="text"
                                        placeholder="Your Name *"
                                        className="input"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    {orderType === 'shipping' && (
                                        <input
                                            type="text"
                                            placeholder="Shipping Address *"
                                            className="input"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                        />
                                    )}
                                </div>

                                {/* Promo Code */}
                                <div className="mt-4 border-t border-gray-100 pt-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Promo Code"
                                            className="input flex-1 uppercase"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                        />
                                        <button
                                            onClick={handleApplyVoucher}
                                            className="btn btn-outline"
                                            style={{ padding: '0.5rem 1rem' }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    {voucherError && <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-tighter">{voucherError}</p>}
                                    {discount > 0 && <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-tighter">Discount Applied: -${discount.toFixed(2)}</p>}
                                </div>

                                <div className={styles.totalRow}>
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className={styles.totalRow} style={{ color: '#10B981' }}>
                                        <span>Discount</span>
                                        <span>-${discount.toFixed(2)}</span>
                                    </div>
                                )}
                                {orderType === 'shipping' && (
                                    <div className={styles.totalRow} style={{ fontSize: '1rem', color: 'hsl(var(--muted-foreground))' }}>
                                        <span>Shipping</span>
                                        <span>${shippingCost.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>

                                <div className={styles.actions}>
                                    {customerName && (orderType === 'pickup' || address) ? (
                                        <div style={{ marginTop: '1rem' }}>
                                            <PayPalButtons
                                                style={{ layout: "vertical" }}
                                                createOrder={async () => {
                                                    // 1. Create Order in our DB first
                                                    const res = await fetch('/api/orders/create', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            businessId,
                                                            customerName,
                                                            items,
                                                            total,
                                                            type: orderType,
                                                            address
                                                        }),
                                                    });
                                                    const { order } = await res.json();

                                                    // 2. Create PayPal Order
                                                    const ppRes = await fetch('/api/paypal/create-order', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ total, orderId: order.id }),
                                                    });
                                                    const ppOrder = await ppRes.json();

                                                    // Store the DB order ID in window for capture phase
                                                    (window as any).currentDbOrderId = order.id;

                                                    return ppOrder.id;
                                                }}
                                                onApprove={async (data: any) => {
                                                    await handleOrderCapture(data.orderID, (window as any).currentDbOrderId);
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-center text-muted-foreground" style={{ marginBottom: '1rem' }}>
                                            Complete your details to pay with PayPal
                                        </p>
                                    )}
                                    <button className="btn btn-outline" style={{ width: '100%' }}>Message Business</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
