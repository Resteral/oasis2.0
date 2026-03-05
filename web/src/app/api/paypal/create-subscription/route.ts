import { NextRequest, NextResponse } from 'next/server';

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
        const { planId } = await req.json();

        if (!planId) {
            return NextResponse.json({ error: 'Missing Plan ID' }, { status: 400 });
        }

        const accessToken = await getAccessToken();
        const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan_id: planId,
                application_context: {
                    brand_name: "OasisUnited",
                    user_action: "SUBSCRIBE_NOW",
                    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings?status=success`,
                    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings?status=cancel`,
                },
            }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('PayPal Subscription Creation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
