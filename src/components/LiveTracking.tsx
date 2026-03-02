"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LiveTrackingProps {
    orderId: string;
}

export default function LiveTracking({ orderId }: LiveTrackingProps) {
    const [delivery, setDelivery] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDelivery() {
            const { data } = await supabase
                .from('deliveries')
                .select('*, drivers(*)')
                .eq('order_id', orderId)
                .single();

            if (data) setDelivery(data);
            setLoading(false);
        }

        fetchDelivery();

        // Subscription for real-time updates
        const channel = supabase
            .channel(`delivery-${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'deliveries',
                filter: `order_id=eq.${orderId}`
            }, (payload) => {
                setDelivery((prev: any) => ({ ...prev, ...payload.new }));
            })
            .subscribe();

        return () => { channel.unsubscribe(); };
    }, [orderId]);

    if (loading) return null;
    if (!delivery) return (
        <div className="p-8 text-center bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center gap-4">
            <span className="text-2xl animate-spin">📡</span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coordinating your logistics...</p>
        </div>
    );

    const steps = [
        { key: 'assigned', label: 'Assigned', icon: '👤' },
        { key: 'pickup_in_progress', label: 'To Store', icon: '🏪' },
        { key: 'picked_up', label: 'Picked Up', icon: '🛍️' },
        { key: 'delivery_in_progress', label: 'En Route', icon: '🚚' },
        { key: 'delivered', label: 'Delivered', icon: '🏁' },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === delivery.status);

    return (
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-indigo-100 border border-indigo-50/50 space-y-12 overflow-hidden relative">
            {/* Visual Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>

            <header className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                <div className="space-y-2 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live Coordination</span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter text-gray-900 italic">Tracking Your Oasis.</h3>
                </div>

                {delivery.drivers && (
                    <div className="bg-gray-900 text-white px-8 py-5 rounded-[2rem] flex items-center gap-4 shadow-xl shadow-gray-200">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">
                            {delivery.drivers.vehicle_type === 'car' ? '🚗' :
                                delivery.drivers.vehicle_type === 'bike' ? '🚲' : '🚐'}
                        </div>
                        <div className="space-y-0.5">
                            <div className="text-[8px] font-black uppercase text-indigo-400 tracking-widest leading-none">Your Driver</div>
                            <div className="font-bold text-sm tracking-tight">{delivery.drivers.vehicle_color} {delivery.drivers.vehicle_type}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{delivery.drivers.vehicle_plate}</div>
                        </div>
                    </div>
                )}
            </header>

            {/* Progress Stepper */}
            <div className="relative z-10">
                <div className="flex justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-indigo-500 -translate-y-1/2 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((step, i) => (
                        <div key={step.key} className="relative z-20 flex flex-col items-center gap-4 group">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500 border-4 border-white shadow-xl ${i <= currentStepIndex ? 'bg-indigo-600 text-white scale-110' : 'bg-gray-100 text-gray-400 grayscale'
                                }`}>
                                {step.icon}
                            </div>
                            <div className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-500 text-center max-w-[80px] ${i <= currentStepIndex ? 'text-indigo-600' : 'text-gray-300'
                                }`}>
                                {step.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Simulation */}
            <div className="h-48 md:h-64 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 animate-pulse"></div>

                {/* Simulated Marker */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce">
                        <span className="text-white text-sm">📍</span>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-xl shadow-xl border border-indigo-50">
                        <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">Moving towards your location</p>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-black text-gray-900 uppercase tracking-widest">Real-time GPS Active</span>
                </div>
            </div>
        </div>
    );
}
