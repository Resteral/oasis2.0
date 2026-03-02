"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { PayPalButtons } from '@paypal/react-paypal-js';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [businessId, setBusinessId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [twilioPhone, setTwilioPhone] = useState('');
    const [instagramHandle, setInstagramHandle] = useState('');
    const [twilioConnected, setTwilioConnected] = useState(false);
    const [instagramConnected, setInstagramConnected] = useState(false);

    // Theme State
    const [primaryColor, setPrimaryColor] = useState('#000000');
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');

    // Delivery State
    const [deliveryRadius, setDeliveryRadius] = useState(5);
    const [selfDelivery, setSelfDelivery] = useState(false);
    const [deliveryProviders, setDeliveryProviders] = useState<string[]>([]);
    const [instagramId, setInstagramId] = useState('');
    const [instagramAccessToken, setInstagramAccessToken] = useState('');
    const [facebookId, setFacebookId] = useState('');
    const [facebookAccessToken, setFacebookAccessToken] = useState('');
    const [facebookConnected, setFacebookConnected] = useState(false);
    const [subscriptionTier, setSubscriptionTier] = useState('free');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserId(user.id);

            // Fetch Profile for Subscription Tier
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            if (profile) setSubscriptionTier(profile.subscription_tier || 'free');

            const { data: business } = await supabase
                .from('businesses')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (business) {
                setBusinessId(business.id);
                setName(business.name);
                setLocation(business.location || '');

                // Parse integrations settings from JSONB
                const integr = business.integrations || {};
                setTwilioPhone(integr.twilio?.phone || '');
                setInstagramHandle(integr.instagram?.handle || '');
                setInstagramId(integr.instagram?.id || '');
                setInstagramAccessToken(integr.instagram?.access_token || '');
                setFacebookId(integr.facebook?.id || '');
                setFacebookAccessToken(integr.facebook?.access_token || '');

                // Fetch real connection status from integrations table
                const { data: activeIntegrations } = await supabase
                    .from('integrations')
                    .select('platform, is_active')
                    .eq('business_id', business.id);

                if (activeIntegrations) {
                    setTwilioConnected(activeIntegrations.some(i => (i.platform === 'twilio' || i.platform === 'sms') && i.is_active));
                    setInstagramConnected(activeIntegrations.some(i => i.platform === 'instagram' && i.is_active));
                    setFacebookConnected(activeIntegrations.some(i => i.platform === 'facebook' && i.is_active));
                }

                // Parse Theme
                const theme = business.theme || {};
                if (theme.primaryColor) setPrimaryColor(theme.primaryColor);
                if (theme.backgroundColor) setBackgroundColor(theme.backgroundColor);

                // Parse Delivery
                const delivery = business.delivery_settings || {};
                if (delivery.radius) setDeliveryRadius(delivery.radius);
                if (delivery.selfDelivery !== undefined) setSelfDelivery(delivery.selfDelivery);
                if (delivery.providers) setDeliveryProviders(delivery.providers);
            }
            setLoading(false);
        }
        fetchSettings();
    }, [router]);

    const handleProviderChange = (provider: string) => {
        if (deliveryProviders.includes(provider)) {
            setDeliveryProviders(deliveryProviders.filter(p => p !== provider));
        } else {
            setDeliveryProviders([...deliveryProviders, provider]);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const updates = {
            name,
            location,
            integrations: {
                twilio: { phone: twilioPhone, connected: !!twilioPhone },
                instagram: {
                    handle: instagramHandle,
                    id: instagramId,
                    access_token: instagramAccessToken,
                    connected: !!instagramHandle || !!instagramId
                },
                facebook: {
                    id: facebookId,
                    access_token: facebookAccessToken,
                    connected: !!facebookId
                }
            },
            theme: {
                primaryColor,
                backgroundColor
            },
            delivery_settings: {
                radius: deliveryRadius,
                selfDelivery,
                providers: deliveryProviders
            },
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('businesses')
            .update(updates)
            .eq('id', businessId);

        if (error) {
            alert('Error updating settings: ' + error.message);
        } else {
            // Update local state to reflect "Connected" status immediately
            setTwilioConnected(!!twilioPhone);
            setInstagramConnected(!!instagramHandle);
            alert('Settings saved successfully!');
        }
        setSaving(false);
    };

    const handleSubscriptionSuccess = async (details: any) => {
        const { error } = await supabase
            .from('profiles')
            .update({ subscription_tier: details.tier })
            .eq('id', userId);

        if (error) {
            alert('Error updating tier: ' + error.message);
        } else {
            setSubscriptionTier(details.tier);
            alert(`Succesfully upgraded to ${details.tier}!`);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Business Settings</h1>
                <p className="mt-2 text-lg text-gray-500">Manage your business profile, theme, and external channel integrations.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-12">
                {/* General Settings Card */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                        <span className="text-2xl">🏢</span>
                        <h2 className="text-2xl font-bold text-gray-900">General Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Business Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Location / Address</label>
                            <input
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. 123 Main St, New York, NY"
                                className="w-full p-4 border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Delivery Settings Card */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                        <span className="text-2xl">🚚</span>
                        <h2 className="text-2xl font-bold text-gray-900">Delivery Settings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Delivery Radius (Miles)</label>
                            <input
                                type="number"
                                value={deliveryRadius}
                                onChange={e => setDeliveryRadius(Number(e.target.value))}
                                className="w-full p-4 border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Delivery Providers</label>
                        <div className="flex flex-wrap gap-4">
                            <label className={`flex items-center gap-3 p-4 px-6 rounded-2xl border-2 transition-all cursor-pointer ${selfDelivery ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    checked={selfDelivery}
                                    onChange={e => setSelfDelivery(e.target.checked)}
                                    className="w-5 h-5 accent-gray-900"
                                />
                                <span className="font-bold text-gray-900">In-House Delivery</span>
                            </label>
                            <label className={`flex items-center gap-3 p-4 px-6 rounded-2xl border-2 transition-all cursor-pointer ${deliveryProviders.includes('doordash') ? 'border-[#ff3008] bg-[#fff5f5]' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    checked={deliveryProviders.includes('doordash')}
                                    onChange={() => handleProviderChange('doordash')}
                                    className="w-5 h-5 accent-[#ff3008]"
                                />
                                <span className={`font-bold ${deliveryProviders.includes('doordash') ? 'text-[#ff3008]' : 'text-gray-900'}`}>DoorDash</span>
                            </label>
                            <label className={`flex items-center gap-3 p-4 px-6 rounded-2xl border-2 transition-all cursor-pointer ${deliveryProviders.includes('ubereats') ? 'border-[#06c167] bg-[#f0fff5]' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    checked={deliveryProviders.includes('ubereats')}
                                    onChange={() => handleProviderChange('ubereats')}
                                    className="w-5 h-5 accent-[#06c167]"
                                />
                                <span className={`font-bold ${deliveryProviders.includes('ubereats') ? 'text-[#06c167]' : 'text-gray-900'}`}>UberEats</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Theme Customization Card */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                        <span className="text-2xl">🎨</span>
                        <h2 className="text-2xl font-bold text-gray-900">Website Customization</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Primary Action Color</label>
                            <div className="flex items-center gap-4 p-2 border border-gray-100 rounded-2xl bg-gray-50/50">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    className="w-14 h-14 p-0 border-0 rounded-xl cursor-pointer bg-transparent"
                                />
                                <span className="font-mono text-lg font-bold text-gray-700">{primaryColor.toUpperCase()}</span>
                            </div>
                            <p className="text-xs text-gray-400">Used for buttons, links, and highlights.</p>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Background Tone</label>
                            <div className="flex items-center gap-4 p-2 border border-gray-100 rounded-2xl bg-gray-50/50">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={e => setBackgroundColor(e.target.value)}
                                    className="w-14 h-14 p-0 border-0 rounded-xl cursor-pointer bg-transparent"
                                />
                                <span className="font-mono text-lg font-bold text-gray-700">{backgroundColor.toUpperCase()}</span>
                            </div>
                            <p className="text-xs text-gray-400">The base color for your storefront theme.</p>
                        </div>
                    </div>
<<<<<<< HEAD
=======

                    {/* Delivery Settings */}
                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        border: '1px solid #e3f2fd',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #f0f4f8', paddingBottom: '1rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🚚</span>
                            <h3 style={{ margin: 0, color: '#1a237e' }}>Delivery Settings</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>Delivery Radius (Miles)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={deliveryRadius}
                                        onChange={e => setDeliveryRadius(Number(e.target.value))}
                                        style={{ flex: 1, accentColor: '#222' }}
                                    />
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: '#6366f1',
                                        backgroundColor: '#eef2ff',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        minWidth: '3.5rem',
                                        textAlign: 'center'
                                    }}>{deliveryRadius}m</span>
                                </div>
                            </div>
                        </div>

                        {/* Theme Preview Card */}
                        <div style={{ marginTop: '2.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '500', color: '#333' }}>Marketplace Preview</label>
                            <div style={{
                                padding: '2rem',
                                borderRadius: '16px',
                                background: backgroundColor,
                                border: '1px solid #eee',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    padding: '1rem 2rem',
                                    borderRadius: '50px',
                                    background: primaryColor,
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    boxShadow: `0 4px 14px ${primaryColor}44`
                                }}>
                                    Example Button
                                </div>
                                <p style={{ color: '#666', fontSize: '0.8rem' }}>This is how your brand will appear to customers.</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '500', color: '#333' }}>Delivery Providers</label>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.8rem 1.2rem', borderRadius: '8px',
                                    border: selfDelivery ? '2px solid #222' : '1px solid #eee',
                                    backgroundColor: selfDelivery ? '#f5f5f5' : '#fff',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selfDelivery}
                                        onChange={e => setSelfDelivery(e.target.checked)}
                                        style={{ accentColor: '#222' }}
                                    />
                                    <span style={{ fontWeight: 500 }}>In-House Delivery</span>
                                </label>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.8rem 1.2rem', borderRadius: '8px',
                                    border: deliveryProviders.includes('doordash') ? '2px solid #ff3008' : '1px solid #eee',
                                    backgroundColor: deliveryProviders.includes('doordash') ? '#fff5f5' : '#fff',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={deliveryProviders.includes('doordash')}
                                        onChange={() => handleProviderChange('doordash')}
                                        style={{ accentColor: '#ff3008' }}
                                    />
                                    <span style={{ fontWeight: 500, color: '#ff3008' }}>DoorDash</span>
                                </label>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.8rem 1.2rem', borderRadius: '8px',
                                    border: deliveryProviders.includes('ubereats') ? '2px solid #06c167' : '1px solid #eee',
                                    backgroundColor: deliveryProviders.includes('ubereats') ? '#f0fff5' : '#fff',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={deliveryProviders.includes('ubereats')}
                                        onChange={() => handleProviderChange('ubereats')}
                                        style={{ accentColor: '#06c167' }}
                                    />
                                    <span style={{ fontWeight: 500, color: '#06c167' }}>UberEats</span>
                                </label>
                            </div>
                        </div>
                    </div>

>>>>>>> 41c0e56 (feat: implement fulfillment dashboard and unified checkout with inventory sync)
                </div>

                {/* Integrations Card */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                        <span className="text-2xl">🔗</span>
                        <h2 className="text-2xl font-bold text-gray-900">Channels & Integrations</h2>
                    </div>
                    <p className="text-gray-500 text-lg">Connect your external channels to receive orders and messages directly in your dashboard.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Twilio Section */}
                        <div className="group p-8 border border-gray-100 rounded-2xl bg-gray-50/30 hover:bg-white hover:shadow-md transition-all relative">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f22f46] rounded-l-2xl"></div>
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="font-black text-[#f22f46] flex items-center gap-2">
                                    💬 SMS (Twilio)
                                </h3>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest ${twilioConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {twilioConnected ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                                <input
                                    value={twilioPhone}
                                    onChange={e => {
                                        setTwilioConnected(false);
                                        setTwilioPhone(e.target.value);
                                    }}
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full bg-white p-4 border border-gray-100 rounded-xl font-mono text-sm focus:ring-2 focus:ring-[#f22f46] outline-none"
                                />
                            </div>
                        </div>

                        {/* Instagram Section */}
                        <div className="group p-8 border border-gray-100 rounded-2xl bg-gray-50/30 hover:bg-white hover:shadow-md transition-all relative">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-l-2xl"></div>
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#833ab4] to-[#fd1d1d] flex items-center gap-2">
                                    📸 Instagram
                                </h3>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest ${instagramConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {instagramConnected ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div className="space-y-4">
                                <input
                                    value={instagramId}
                                    onChange={e => setInstagramId(e.target.value)}
                                    placeholder="Page ID"
                                    className="w-full bg-white p-3 border border-gray-100 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#fd1d1d] outline-none"
                                />
                                <input
                                    type="password"
                                    value={instagramAccessToken}
                                    onChange={e => setInstagramAccessToken(e.target.value)}
                                    placeholder="Access Token"
                                    className="w-full bg-white p-3 border border-gray-100 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#fd1d1d] outline-none"
                                />
                                <input
                                    value={instagramHandle}
                                    onChange={e => setInstagramHandle(e.target.value)}
                                    placeholder="@handle"
                                    className="w-full bg-white p-3 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-[#fd1d1d] outline-none"
                                />
                            </div>
                        </div>

                        {/* Facebook Section */}
                        <div className="group p-8 border border-gray-100 rounded-2xl bg-gray-50/30 hover:bg-white hover:shadow-md transition-all relative">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1877F2] rounded-l-2xl"></div>
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="font-black text-[#1877F2] flex items-center gap-2">
                                    📘 Facebook
                                </h3>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest ${facebookConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {facebookConnected ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div className="space-y-4">
                                <input
                                    value={facebookId}
                                    onChange={e => setFacebookId(e.target.value)}
                                    placeholder="Page ID"
                                    className="w-full bg-white p-3 border border-gray-100 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#1877F2] outline-none"
                                />
                                <input
                                    type="password"
                                    value={facebookAccessToken}
                                    onChange={e => setFacebookAccessToken(e.target.value)}
                                    placeholder="Page Access Token"
                                    className="w-full bg-white p-3 border border-gray-100 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#1877F2] outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Management Card */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                        <span className="text-2xl">💎</span>
                        <h2 className="text-2xl font-bold text-gray-900">Subscription & Tiers</h2>
                    </div>
                    <p className="text-gray-500 text-lg">Upgrade your account to unlock premium features and more local visibility.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Free Tier */}
                        <div className={`p-8 rounded-2xl border-2 transition-all flex flex-col ${subscriptionTier === 'free' ? 'border-gray-900 bg-gray-50 shadow-inner' : 'border-gray-100 hover:border-gray-200'}`}>
                            {subscriptionTier === 'free' && <span className="text-[10px] font-black tracking-widest bg-gray-900 text-white px-3 py-1 rounded-full w-fit mb-4">CURRENT PLAN</span>}
                            <h3 className="text-xl font-black text-gray-900">Free</h3>
                            <div className="my-6">
                                <span className="text-4xl font-black text-gray-900">$0</span>
                                <span className="text-gray-400 font-medium font-sm">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-2 text-sm text-gray-600">✓ <span className="font-semibold">Basic Storefront</span></li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">✓ <span className="font-semibold">5 Products Max</span></li>
                                <li className="flex items-center gap-2 text-sm text-red-500 font-bold">❗ $10 Delivery Fee</li>
                            </ul>
                            <button disabled className="w-full p-4 rounded-xl border-2 border-gray-200 text-gray-400 font-bold text-sm cursor-not-allowed uppercase tracking-widest">Included</button>
                        </div>

                        {/* Pro Tier */}
                        <div className={`p-8 rounded-2xl border-2 transition-all flex flex-col relative ${subscriptionTier === 'pro' ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-indigo-100 hover:border-indigo-200 shadow-sm'}`}>
                            {subscriptionTier === 'pro' && <span className="text-[10px] font-black tracking-widest bg-indigo-600 text-white px-3 py-1 rounded-full w-fit mb-4">CURRENT PLAN</span>}
                            <h3 className="text-xl font-black text-indigo-900">Pro</h3>
                            <div className="my-6">
                                <span className="text-4xl font-black text-indigo-900">$29</span>
                                <span className="text-indigo-400 font-medium font-sm">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-2 text-sm text-indigo-700 font-bold">✓ Unlimited Products</li>
                                <li className="flex items-center gap-2 text-sm text-indigo-700">✓ Custom Themes</li>
                                <li className="flex items-center gap-2 text-sm text-green-600 font-black">✓ FREE DELIVERY</li>
                                <li className="flex items-center gap-2 text-sm text-indigo-700">✓ Facebook Direct</li>
                            </ul>
                            {subscriptionTier === 'free' && (
                                <PayPalButtons
                                    createSubscription={async (data: any, actions: any) => {
                                        return actions.subscription.create({
                                            'plan_id': 'P-YOUR_PRO_PLAN_ID'
                                        });
                                    }}
                                    onApprove={async (data: any) => {
                                        handleSubscriptionSuccess({ tier: 'pro' });
                                    }}
                                    style={{ layout: 'horizontal', label: 'subscribe', color: 'blue', shape: 'pill' }}
                                />
                            )}
                        </div>

                        {/* Meal Master Tier */}
                        <div className={`p-8 rounded-2xl border-2 transition-all flex flex-col relative ${subscriptionTier === 'elite' ? 'border-amber-500 bg-amber-50 shadow-inner' : 'border-amber-100 hover:border-amber-200 shadow-sm'}`}>
                            <div className="absolute -top-4 right-6 bg-amber-500 text-white text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full shadow-lg">MOST POPULAR</div>
                            {subscriptionTier === 'elite' && <span className="text-[10px] font-black tracking-widest bg-amber-500 text-white px-3 py-1 rounded-full w-fit mb-4">CURRENT PLAN</span>}
                            <h3 className="text-xl font-black text-amber-900">Meal Master</h3>
                            <div className="my-6">
                                <span className="text-4xl font-black text-amber-900">$99</span>
                                <span className="text-amber-400 font-medium font-sm">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-2 text-sm text-amber-700 font-black">✓ 0% Processing Fees</li>
                                <li className="flex items-center gap-2 text-sm text-amber-700">✓ Home Screen Feature</li>
                                <li className="flex items-center gap-2 text-sm text-amber-700 font-black">✓ PRIORITY AI SEARCH</li>
                                <li className="flex items-center gap-2 text-sm text-green-600 font-black">✓ FREE DELIVERY</li>
                            </ul>
                            {subscriptionTier !== 'elite' && (
                                <PayPalButtons
                                    createSubscription={async (data: any, actions: any) => {
                                        return actions.subscription.create({
                                            'plan_id': 'P-YOUR_ELITE_PLAN_ID'
                                        });
                                    }}
                                    onApprove={async (data: any) => {
                                        handleSubscriptionSuccess({ tier: 'elite' });
                                    }}
                                    style={{ layout: 'horizontal', label: 'subscribe', color: 'gold', shape: 'pill' }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`group px-12 py-5 rounded-2xl font-black text-lg tracking-widest transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 ${saving
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 transform'}`}
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin text-xl text-indigo-400">⏳</span> SAVING...
                            </span>
                        ) : 'SAVE ALL CHANGES'}
                    </button>
                </div>
            </form>
        </div>
    );
}
