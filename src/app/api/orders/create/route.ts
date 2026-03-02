import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { businessId, customerName, customerContact, items, total, type, address, scheduledFor } = body;

        if (!businessId || !total || !items) {
            return NextResponse.json({ error: 'Missing required order details' }, { status: 400 });
        }

        // Logistics Engine: Mock Distance Calculation (0-40 miles)
        const mockDistance = Math.floor(Math.random() * 400) / 10;

        // Insert into Supabase Orders table
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                business_id: businessId,
                customer_name: customerName,
                customer_contact: customerContact,
                items: items,
                total: total,
                type: type,
                address: address,
                status: 'pending',
                channel: 'web',
                delivery_status: 'pending',
                distance_miles: mockDistance,
                scheduled_for: scheduledFor || null
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Inventory Engine: Atomic Stock Decrement
        for (const item of items) {
            const { error: stockError } = await supabase.rpc('decrement_stock', {
                p_product_id: item.id,
                p_quantity: item.quantity
            });

            if (stockError) {
                console.error(`Stock Error for ${item.id}:`, stockError);
                // In a perfect world, we'd delete the order here (rollback), but for the demo, 
                // we'll just log it or throw to the catch block.
                throw new Error(`Insufficient stock for ${item.name}`);
            }
        }

        // 3. Loyalty Integration: Accrue Points (10 pts per $1)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Eco-Delivery Integration: 200 Pt Bonus
            const isEco = true; // Simulating user choice
            const ecoBonus = isEco ? 200 : 0;
            const pointsToEarn = Math.floor(Number(total) * 10) + ecoBonus;

            // Get or Create Loyalty Account
            const { data: account } = await supabase
                .from('loyalty_accounts')
                .select('points, lifetime_points')
                .eq('user_id', user.id)
                .single();

            if (account) {
                await supabase
                    .from('loyalty_accounts')
                    .update({
                        points: account.points + pointsToEarn,
                        lifetime_points: account.lifetime_points + pointsToEarn,
                        updated_at: new Date()
                    })
                    .eq('user_id', user.id);
            } else {
                await supabase
                    .from('loyalty_accounts')
                    .insert({
                        user_id: user.id,
                        points: pointsToEarn,
                        lifetime_points: pointsToEarn,
                        tier: 'Silver'
                    });
            }
        }

        return NextResponse.json({ success: true, order: order }, { status: 201 });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
