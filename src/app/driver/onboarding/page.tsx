"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DriverOnboarding() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        vehicle_type: 'car',
        vehicle_color: '',
        vehicle_plate: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleApply = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please sign in to apply as a driver!');
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('drivers')
            .insert({
                user_id: user.id,
                vehicle_type: formData.vehicle_type,
                vehicle_color: formData.vehicle_color,
                vehicle_plate: formData.vehicle_plate,
                status: 'offline',
                is_approved: false
            });

        if (error) {
            alert('Error submitting application: ' + error.message);
        } else {
            setSubmitted(true);
        }
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-gray-900">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl p-12 rounded-[3.5rem] border border-white/10 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🏁</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Application Received!</h1>
                    <p className="text-indigo-200/60 font-medium">Your logistics profile is now being reviewed by Oasis HQ. We'll notify you once you're cleared for takeoff.</p>
                    <Link href="/dashboard" className="block w-full py-5 bg-white text-gray-900 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-gray-900">
            <div className="max-w-2xl w-full bg-white/5 backdrop-blur-xl p-12 md:p-16 rounded-[4rem] border border-white/10 shadow-3xl space-y-12 relative overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>

                <header className="space-y-4 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Logistics Network</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic">Drive for Oasis.</h1>
                    <p className="text-indigo-200/50 font-medium max-w-sm mx-auto md:mx-0">Join the world's most premium local delivery fleet. Earn on your terms.</p>
                </header>

                {step === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { icon: '💰', label: 'Fast Pay', desc: 'Instant earnings' },
                                { icon: '⏰', label: 'Flexibility', desc: 'Your schedule' },
                                { icon: '📈', label: 'Growth', desc: 'Loyalty perks' },
                            ].map((perk, i) => (
                                <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-2">
                                    <span className="text-2xl">{perk.icon}</span>
                                    <div className="text-[10px] font-black text-white uppercase tracking-widest">{perk.label}</div>
                                    <div className="text-[9px] text-indigo-200/40 font-bold uppercase">{perk.desc}</div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-6 bg-white text-gray-900 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-50 hover:scale-[1.02] transition-all"
                        >
                            Start Application
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-4">Vehicle Type</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['bike', 'car', 'van'].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setFormData({ ...formData, vehicle_type: v })}
                                            className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.vehicle_type === v ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-gray-400'
                                                }`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-4">Vehicle Color</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Midnight Black"
                                        value={formData.vehicle_color}
                                        onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                                        className="w-full bg-white/5 p-5 rounded-2xl text-white font-bold outline-none border border-white/10 focus:border-indigo-500 transition-all placeholder:text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-4">License Plate</label>
                                    <input
                                        type="text"
                                        placeholder="XYZ-1234"
                                        value={formData.vehicle_plate}
                                        onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                                        className="w-full bg-white/5 p-5 rounded-2xl text-white font-bold outline-none border border-white/10 focus:border-indigo-500 transition-all placeholder:text-gray-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-8 py-6 bg-white/5 text-white rounded-full font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-white/10"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={loading || !formData.vehicle_color || !formData.vehicle_plate}
                                className="flex-1 py-6 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-500 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Submit Profile'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
