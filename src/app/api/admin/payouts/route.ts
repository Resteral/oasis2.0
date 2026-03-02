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
        // 1. Auth Check (Admin Only) - For the demo, we assume the requester is Sean/Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== 'Sean@OasisUnited.com') { // Basic check for demo
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 2. Fetch all orders that are 'accrued' and not yet paid
        const { data: pendingOrders } = await supabase
            .from('orders')
            .select('id, business_id, total, commission_fee')
            .eq('status', 'completed')
            .eq('payout_status', 'accrued');

        if (!pendingOrders || pendingOrders.length === 0) {
            return NextResponse.json({ message: 'No pending payouts accrued.' });
        }

        // 3. Group by Business and calculate totals
        const businessTotals: Record<string, number> = {};
        const businessCommissionTotals: Record<string, number> = {};
        const orderIdsByBusiness: Record<string, string[]> = {};

        pendingOrders.forEach(order => {
            const net = Number(order.total) - Number(order.commission_fee || 0);
            businessTotals[order.business_id] = (businessTotals[order.business_id] || 0) + net;
            businessCommissionTotals[order.business_id] = (businessCommissionTotals[order.business_id] || 0) + Number(order.commission_fee || 0);

            if (!orderIdsByBusiness[order.business_id]) orderIdsByBusiness[order.business_id] = [];
            orderIdsByBusiness[order.business_id].push(order.id);
        });

        // 4. Fetch Payout Settings for these businesses
        const { data: payoutSettings } = await supabase
            .from('payout_settings')
            .select('business_id, paypal_email')
            .in('business_id', Object.keys(businessTotals));

        if (!payoutSettings || payoutSettings.length === 0) {
            return NextResponse.json({ error: 'No payout settings found for merchants.' }, { status: 400 });
        }

        // 5. Prepare PayPal Payout Items
        const payoutItems = payoutSettings.map(settings => ({
            note: "Oasis Weekly Earnings Distribution",
            receiver: settings.paypal_email,
            sender_item_id: `payout_${settings.business_id}_${Date.now()}`,
            amount: {
                value: businessTotals[settings.business_id].toFixed(2),
                currency: "USD"
            }
        }));

        // 6. Execute PayPal Payout
        const accessToken = await getAccessToken();
        const payoutResponse = await fetch(`${PAYPAL_API}/v1/payments/payouts`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sender_batch_header: {
                    sender_batch_id: `batch_${Date.now()}`,
                    email_subject: "You have a payout from Oasis United!",
                    email_message: "Your earnings for the week have been distributed."
                },
                items: payoutItems
            })
        });

        const payoutData = await payoutResponse.json();

        if (payoutResponse.ok) {
            // 7. Update Database
            // Mark orders as 'paid'
            await supabase
                .from('orders')
                .update({ payout_status: 'paid' })
                .in('id', pendingOrders.map(o => o.id));

            // Record Payout entries
            const payoutEntries = payoutSettings.map(settings => ({
                business_id: settings.business_id,
                amount: businessTotals[settings.business_id],
                oas_fee: businessCommissionTotals[settings.business_id],
                status: 'paid',
                paypal_payout_id: payoutData.batch_header.payout_batch_id
            }));

            await supabase.from('payouts').insert(payoutEntries);

            return NextResponse.json({ success: true, batchId: payoutData.batch_header.payout_batch_id });
        } else {
            console.error('PayPal Payout Error:', payoutData);
            return NextResponse.json({ error: 'PayPal distribution failed.', details: payoutData }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Payout API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
