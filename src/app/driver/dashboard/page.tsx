"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DriverDashboard() {
    const [driver, setDriver] = useState<any>(null);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ todayEarnings: 0, completedCount: 0 });

    useEffect(() => {
        async function loadDriverData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: drv } = await supabase
                .from('drivers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (drv) {
                setDriver(drv);
                const res = await fetch(`/api/logistics?driverId=${drv.id}`);
                const data = await res.json();
                if (data.success) setDeliveries(data.deliveries);
            }
            setLoading(false);
        }
        loadDriverData();
    }, []);

    const updateLocation = async () => {
        if (!driver) return;
        // Mocking GPS update for development
        const newLat = (driver.current_latitude || 47.6062) + (Math.random() - 0.5) * 0.01;
        const newLng = (driver.current_longitude || -122.3321) + (Math.random() - 0.5) * 0.01;

        const res = await fetch('/api/logistics', {
            method: 'POST',
            body: JSON.stringify({
                driverId: driver.id,
                action: 'update_location',
                latitude: newLat,
                longitude: newLng
            })
        });
        if (res.ok) {
            setDriver({ ...driver, current_latitude: newLat, current_longitude: newLng });
        }
    };

    const optimize = async () => {
        if (!driver) return;
        const res = await fetch('/api/logistics', {
            method: 'POST',
            body: JSON.stringify({ driverId: driver.id, action: 'optimize_route' })
        });
        const data = await res.json();
        if (data.success) {
            window.location.reload();
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

    if (!driver) return (
        <div className="min-h-screen bg-gray-50 p-12 text-center space-y-6">
            <span className="text-6xl grayscale opacity-20">🚚</span>
            <h1 className="text-2xl font-black italic tracking-tight">Driver Profile Not Found</h1>
            <p className="text-gray-400 max-w-xs mx-auto text-sm italic">Join the Oasis fleet to start delivering boutique treasures.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0d0d0f] text-white p-8 md:p-12 space-y-12">
            <header className="flex justify-between items-end max-w-5xl mx-auto">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Online</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-none">Global <span className="text-indigo-500">Fleet.</span></h1>
                    <p className="text-white/20 font-medium italic text-sm">Real-time logistics orchestration for the Oasis marketplace.</p>
                </div>
                <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Earnings</p>
                    <p className="text-3xl font-black italic tracking-tight">${stats.todayEarnings.toLocaleString()}</p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Status Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <h2 className="font-black text-2xl uppercase tracking-tighter italic">Driver <span className="text-indigo-500">Status</span></h2>
                                <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Active Shift Console</p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={updateLocation}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40"
                                >
                                    Ping GPS
                                </button>
                                <button
                                    onClick={optimize}
                                    className="w-full py-4 bg-white/10 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
                                >
                                    Optimize Route
                                </button>
                            </div>
                        </div>

                        {/* Position Indicator */}
                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Latest Coordinates</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[8px] font-black text-white/20 uppercase">Lat</p>
                                        <p className="font-bold text-sm tracking-tight">{driver.current_latitude?.toFixed(4) || '---'}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[8px] font-black text-white/20 uppercase">Lng</p>
                                        <p className="font-bold text-sm tracking-tight">{driver.current_longitude?.toFixed(4) || '---'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-indigo-600/10 p-4 rounded-2xl border border-indigo-600/20 text-center">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Shift Status</p>
                                <p className="text-lg font-black italic text-white uppercase">{driver.status}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Queue */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex justify-between items-end px-4">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Current <span className="text-indigo-500">Route</span></h2>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Priority Sequence</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {deliveries.length === 0 ? (
                            <div className="bg-white/5 border border-white/5 rounded-[3rem] p-24 text-center space-y-6">
                                <span className="text-6xl grayscale opacity-10">🏁</span>
                                <div className="space-y-2">
                                    <p className="font-black text-xl italic uppercase tracking-tight">Queue Clear.</p>
                                    <p className="text-white/20 text-xs font-medium italic">All treasures delivered. Waiting for new orders to enter the Oasis.</p>
                                </div>
                            </div>
                        ) : (
                            deliveries.map((del, idx) => (
                                <div key={del.id} className="group bg-white/5 border border-white/5 rounded-[2.5rem] p-8 hover:bg-white/10 transition-all flex items-center gap-8 relative overflow-hidden">
                                    {/* Stop ID */}
                                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black italic shadow-2xl group-hover:scale-110 transition-transform">
                                        {idx + 1}
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-black text-xl tracking-tight uppercase leading-none">{del.orders?.customer_name || 'Boutique Treasure'}</h3>
                                                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1 italic">{del.orders?.delivery_address}</p>
                                            </div>
                                            <div className="bg-white/10 px-4 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest text-indigo-400 border border-white/10">
                                                {del.status}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-xl">
                                        Complete Stop
                                    </button>

                                    {/* Route Visual Accent */}
                                    {idx < deliveries.length - 1 && (
                                        <div className="absolute bottom-0 left-[2.5rem] w-1 h-8 bg-indigo-600/20"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
