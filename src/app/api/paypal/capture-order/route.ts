import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    const data = await response.json();
    return data.access_token;
}

export async function POST(req: NextRequest) {
    try {
        const { paypalOrderId, dbOrderId } = await req.json();

        if (!paypalOrderId || !dbOrderId) {
            return NextResponse.json({ error: 'Missing Order IDs' }, { status: 400 });
        }

        const accessToken = await getAccessToken();
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.status === 'COMPLETED') {
            // 1. Fetch Order details to get business_id and total
            const { data: orderData } = await supabase
                .from('orders')
                .select('business_id, total')
                .eq('id', dbOrderId)
                .single();

            if (orderData) {
                // 2. Fetch Business Owner's Subscription Tier
                const { data: businessData } = await supabase
                    .from('businesses')
                    .select('owner_id')
                    .eq('id', orderData.business_id)
                    .single();

                let commissionRate = 0.10; // Default: Free Tier (10%)

                if (businessData) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('subscription_tier')
                        .eq('id', businessData.owner_id)
                        .single();

                    if (profileData?.subscription_tier === 'pro') commissionRate = 0.05;
                    if (profileData?.subscription_tier === 'elite') commissionRate = 0.02;
                }

                const commissionFee = (Number(orderData.total) * commissionRate).toFixed(2);

                // 3. Update Order with status, commission, and payout_status
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({
                        status: 'completed',
                        commission_fee: commissionFee,
                        payout_status: 'accrued'
                    })
                    .eq('id', dbOrderId);

                if (updateError) {
                    console.error('Failed to update DB order status:', updateError);
                }
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('PayPal Capture Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
