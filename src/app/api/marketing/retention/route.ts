import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
        return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // 1. Get all customers who HAVE ordered in the last 14 days
    const { data: recentOrders } = await supabase
        .from('orders')
        .select('consumer_id')
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .gte('created_at', fourteenDaysAgo.toISOString());

    const recentCustomerIds = new Set(recentOrders?.map(o => o.consumer_id).filter(Boolean));

    // 2. Get all customers who HAVE ordered EVER, but not in last 14 days
    const { data: allCustomers } = await supabase
        .from('orders')
        .select('consumer_id, customer_name, total, created_at')
        .eq('business_id', businessId)
        .eq('status', 'completed');

    const atRisk = new Map<string, any>();

    allCustomers?.forEach(order => {
        if (!order.consumer_id) return;
        if (recentCustomerIds.has(order.consumer_id)) return;

        const existing = atRisk.get(order.consumer_id);
        if (existing) {
            existing.ltv += Number(order.total);
            if (new Date(order.created_at) > new Date(existing.lastSeen)) {
                existing.lastSeen = order.created_at;
            }
        } else {
            atRisk.set(order.consumer_id, {
                id: order.consumer_id,
                name: order.customer_name,
                ltv: Number(order.total),
                lastSeen: order.created_at,
                daysSince: Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 3600 * 24))
            });
        }
    });

    return NextResponse.json({
        success: true,
        atRisk: Array.from(atRisk.values()).sort((a, b) => b.ltv - a.ltv)
    });
}
