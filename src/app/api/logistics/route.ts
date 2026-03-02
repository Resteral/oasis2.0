import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple Route Optimization (Greedy Nearest Neighbor)
function optimizeRoute(driverLocation: { lat: number, lng: number }, orders: any[]) {
    if (orders.length === 0) return [];

    let current = driverLocation;
    const remaining = [...orders];
    const optimized = [];

    while (remaining.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;

        for (let i = 0; i < remaining.length; i++) {
            const dist = Math.sqrt(
                Math.pow(remaining[i].latitude - current.lat, 2) +
                Math.pow(remaining[i].longitude - current.lng, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }

        const next = remaining.splice(nearestIdx, 1)[0];
        optimized.push(next);
        current = { lat: next.latitude, lng: next.longitude };
    }

    return optimized;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });

    try {
        // 1. Get Driver Location & Status
        const { data: driver } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', driverId)
            .single();

        if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

        // 2. Get Pending Deliveries assigned to this driver
        const { data: deliveries } = await supabase
            .from('deliveries')
            .select('*, orders(*)')
            .eq('driver_id', driverId)
            .eq('status', 'In Progress')
            .order('delivery_sequence', { ascending: true });

        return NextResponse.json({
            success: true,
            status: driver.status,
            location: { lat: driver.current_latitude, lng: driver.current_longitude },
            deliveries: deliveries || []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { driverId, action, latitude, longitude } = await req.json();

    try {
        if (action === 'update_location') {
            await supabase
                .from('drivers')
                .update({
                    current_latitude: latitude,
                    current_longitude: longitude,
                    updated_at: new Date()
                })
                .eq('id', driverId);

            return NextResponse.json({ success: true });
        }

        if (action === 'optimize_route') {
            const { data: driver } = await supabase.from('drivers').select('*').eq('id', driverId).single();
            const { data: deliveries } = await supabase.from('deliveries').select('*').eq('driver_id', driverId).eq('status', 'In Progress');

            if (!deliveries || deliveries.length === 0) return NextResponse.json({ success: true, deliveries: [] });

            const optimized = optimizeRoute(
                { lat: driver.current_latitude || 0, lng: driver.current_longitude || 0 },
                deliveries
            );

            // Update sequences in DB
            for (let i = 0; i < optimized.length; i++) {
                await supabase
                    .from('deliveries')
                    .update({ delivery_sequence: i + 1 })
                    .eq('id', optimized[i].id);
            }

            return NextResponse.json({ success: true, optimized });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
