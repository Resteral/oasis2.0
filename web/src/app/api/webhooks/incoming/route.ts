
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { source, data } = body;

        // This is a skeleton handler. 
        // In production, you would verify signatures (e.g., X-Hub-Signature for FB) here.

        console.log(`Received webhook from ${source}:`, data);

        switch (source) {
            case 'facebook':
            case 'instagram':
                // Handle Meta Graph API webhooks (messages, post comments)
                // await handleMetaWebhook(data);
                break;

            case 'whatsapp':
                // Handle WhatsApp Business API
                // await handleWhatsAppWebhook(data);
                break;

            case 'twilio':
                // Handle SMS
                // await handleTwilioWebhook(data);
                break;

            default:
                return NextResponse.json({ error: 'Unknown source' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Support GET for verification (e.g. Facebook Hub Challenge)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse(null, { status: 403 });
        }
    }

    return new NextResponse('Webhook Endpoint Active', { status: 200 });
}
