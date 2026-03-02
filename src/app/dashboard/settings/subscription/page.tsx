"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const TIERS = [
    {
        name: 'Free',
        id: 'free',
        price: '0',
        fee: '10%',
        features: [
            'Basic Storefront',
            'Standard SEO',
            'Phone Support',
            'Oasis Delivery Access'
        ],
        buttonColor: '#9ca3af'
    },
    {
        name: 'Pro',
        id: 'pro',
        price: '29',
        fee: '5%',
        features: [
            'All Free Features',
            'Advanced Analytics',
            'Business Feed Access',
            'Custom Branding',
            'Priority Support'
        ],
        buttonColor: '#4f46e5',
        recommended: true
    },
    {
        name: 'Elite',
        id: 'elite',
        price: '99',
        fee: '2%',
        features: [
            'All Pro Features',
            'Dedicated Account Manager',
            'AI Discovery Promotion',
            'API Access',
            '0% Oasis Payout Fees'
        ],
        buttonColor: '#111827'
    }
];

export default function SubscriptionPage() {
    const [currentTier, setCurrentTier] = useState('free');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function loadProfile() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('subscription_tier')
                    .eq('id', user.id)
                    .single();

                if (profile) setCurrentTier(profile.subscription_tier || 'free');
            }
            setLoading(false);
        }
        loadProfile();
    }, []);

    const handleUpdateTier = async (tierId: string) => {
        if (tierId === currentTier) return;
        setUpdating(true);

        const { error } = await supabase
            .from('profiles')
            .update({ subscription_tier: tierId })
            .eq('id', user.id);

        if (error) {
            alert('Error updating subscription: ' + error.message);
        } else {
            setCurrentTier(tierId);
            alert(`Welcome to Oasis ${tierId.charAt(0).toUpperCase() + tierId.slice(1)}!`);
        }
        setUpdating(false);
    };

    if (loading) return <div className="p-12 text-center font-black uppercase tracking-widest text-gray-400 animate-pulse">Loading Subscriptions...</div>;

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500">
            <header className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-full">Billing & Growth</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Plan: <span className="text-indigo-600 italic">{currentTier}</span></span>
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight">Expand Your Reach</h1>
                <p className="text-gray-400 max-w-xl text-lg font-medium">Choose a level that matches your business goals. Scale your revenue while keeping more of your hard-earned profits.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {TIERS.map((tier) => (
                    <div key={tier.id} className={`bg-white rounded-[3rem] p-10 border-2 transition-all relative ${tier.recommended ? 'border-indigo-600 shadow-2xl scale-[1.05] z-10' : 'border-gray-50 hover:border-gray-100 shadow-sm'
                        } ${currentTier === tier.id ? 'opacity-70' : ''}`}>
                        {tier.recommended && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</span>
                        )}

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">{tier.name}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Platform Category</p>
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-gray-900">${tier.price}</span>
                                <span className="text-gray-400 font-bold">/mo</span>
                            </div>

                            <div className="py-6 border-y border-gray-50">
                                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Merchant Benefits</div>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                        <span className="text-indigo-600 italic">{tier.fee}</span> Platform Commission
                                    </li>
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-500">
                                            <span className="text-emerald-500 text-xs text-bold">✓</span> {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => handleUpdateTier(tier.id)}
                                disabled={updating || currentTier === tier.id}
                                className="w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                                style={{
                                    backgroundColor: currentTier === tier.id ? '#f3f4f6' : tier.buttonColor,
                                    color: currentTier === tier.id ? '#9ca3af' : '#ffffff',
                                    cursor: currentTier === tier.id ? 'default' : 'pointer'
                                }}
                            >
                                {currentTier === tier.id ? 'Current Plan' : `Join ${tier.name}`}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <section className="bg-gray-900 rounded-[3rem] p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-2xl font-black tracking-tight">Enterprise Scaling?</h4>
                    <p className="text-gray-400 max-w-sm">For franchises or multi-city businesses, we offer custom integration and zero payout delays.</p>
                </div>
                <button className="px-10 py-5 bg-white text-gray-900 rounded-full font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">Contact Partnerships</button>
            </section>
        </div>
    );
}
