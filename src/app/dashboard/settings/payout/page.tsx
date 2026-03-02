"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PayoutSettingsPage() {
    const [paypalEmail, setPaypalEmail] = useState('');
    const [automaticPayouts, setAutomaticPayouts] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [businessId, setBusinessId] = useState<string | null>(null);

    useEffect(() => {
        async function loadSettings() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: business } = await supabase
                    .from('businesses')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (business) {
                    setBusinessId(business.id);
                    const { data: settings } = await supabase
                        .from('payout_settings')
                        .select('*')
                        .eq('business_id', business.id)
                        .single();

                    if (settings) {
                        setPaypalEmail(settings.paypal_email);
                        setAutomaticPayouts(settings.automatic_payouts);
                    }
                }
            }
            setLoading(false);
        }
        loadSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId) return;
        setSaving(true);

        const { error } = await supabase
            .from('payout_settings')
            .upsert({
                business_id: businessId,
                paypal_email: paypalEmail,
                automatic_payouts: automaticPayouts,
                updated_at: new Date().toISOString()
            });

        if (error) {
            alert('Error saving settings: ' + error.message);
        } else {
            alert('Payout settings updated successfully!');
        }
        setSaving(false);
    };

    if (loading) return <div className="p-12 text-center font-black uppercase tracking-widest text-gray-400 animate-pulse">Loading Settings...</div>;

    return (
        <div className="p-8 lg:p-12 max-w-2xl animate-in fade-in duration-500">
            <header className="space-y-4 mb-12">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full italic">Financial Security</span>
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight">Payout Settings</h1>
                <p className="text-gray-400 font-medium">Configure where and how you receive your platform earnings.</p>
            </header>

            <form onSubmit={handleSave} className="space-y-10">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">PayPal Distribution Email</label>
                        <input
                            type="email"
                            required
                            placeholder="vendor@example.com"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            className="w-full bg-white border-2 border-gray-50 focus:border-indigo-100 p-6 rounded-[2rem] text-lg font-bold outline-none shadow-sm transition-all"
                        />
                        <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-tight italic">
                            ⚠️ Ensure this email is connected to a valid PayPal account to receive funds.
                        </p>
                    </div>

                    <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                        <label className="flex items-center gap-6 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={automaticPayouts}
                                    onChange={(e) => setAutomaticPayouts(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-14 h-8 rounded-full transition-colors ${automaticPayouts ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${automaticPayouts ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <div>
                                <span className="text-sm font-black text-gray-900 uppercase tracking-widest block">Automatic Weekly Payouts</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">Automatically distribute accrued balance every Monday</span>
                            </div>
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-6 bg-gray-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving Configurations...' : 'Update Payout Settings'}
                </button>
            </form>

            <div className="mt-16 p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-indigo-900 font-black text-lg mb-2 italic">How it works</h3>
                    <p className="text-sm text-indigo-700/70 font-medium leading-relaxed italic">
                        Once an order is marked as completed, your earnings (minus platform commission) are held in your Oasis balance.
                        Every Monday, we batch all merchant payouts and send the total to your specified PayPal account.
                    </p>
                </div>
                <span className="absolute -bottom-4 -right-4 text-8xl opacity-10 grayscale">💰</span>
            </div>
        </div>
    );
}
