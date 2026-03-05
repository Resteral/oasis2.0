import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Allow using the same verify token as Instagram for simplicity, or a dedicated one
    const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();

    console.log('Received Facebook Webhook:', JSON.stringify(body, null, 2));

    try {
        const isPage = body.object === 'page';

        if (isPage) {
            await supabase.from('debug_logs').insert({
                source: 'facebook_webhook',
                message: 'Processing Facebook Event',
                data: body
            });

            for (const entry of body.entry) {
                const pageId = entry.id;
                const messaging = entry.messaging;

                if (!messaging) continue;

                for (const event of messaging) {
                    const senderId = event.sender.id;
                    const message = event.message;

                    if (message && message.text) {
                        // 1. Find the business connected to this Page ID
                        const { data: business, error: businessError } = await supabase
                            .from('businesses')
                            .select('id, name, category, integrations')
                            .contains('integrations', { facebook: { id: pageId } })
                            .single();

                        if (businessError || !business) {
                            console.warn(`No business found for Facebook Page ID: ${pageId}`);
                            await supabase.from('debug_logs').insert({
                                source: 'facebook_webhook',
                                level: 'error',
                                message: `No business found for Page ID: ${pageId}`,
                                data: { pageId, error: businessError }
                            });
                            continue;
                        }

                        // 2. Insert Message into Database
                        await supabase.from('messages').insert({
                            business_id: business.id,
                            customer_contact: senderId,
                            channel: 'facebook',
                            direction: 'inbound',
                            content: message.text,
                            is_read: false
                        });

                        // 3. AI / Context-Aware Logic
                        let replyText = "";
                        const lowerMsg = message.text.toLowerCase();
                        const category = (business.category || 'retail').toLowerCase();

                        if (category.includes('restaurant') || category.includes('food') || category.includes('cafe')) {
                            if (lowerMsg.includes('order') || lowerMsg.includes('menu')) {
                                replyText = `Yum! 🍔 We'd love to feed you at ${business.name}. What are you craving today?`;
                            } else if (lowerMsg.includes('hour') || lowerMsg.includes('open')) {
                                replyText = "We are open from 9 AM to 9 PM! Come by for a bite! 🥐";
                            } else {
                                replyText = `Hi there! Welcome to ${business.name}. How can we make your day delicious? 🥗`;
                            }
                        } else {
                            if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
                                replyText = "Our prices are very competitive! Check our website for the latest deals. 🛍️";
                            } else {
                                replyText = `Hello! Thanks for messaging ${business.name}. We're here to help you find exactly what you need. ✨`;
                            }
                        }

                        // 4. Send Message via Graph API
                        const integrations = business.integrations || {};
                        const platformConfig = integrations.facebook || {};
                        const accessToken = platformConfig.access_token;

                        if (replyText && accessToken) {
                            try {
                                // Facebook Graph API for sending messages
                                const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        recipient: { id: senderId },
                                        message: { text: replyText }
                                    })
                                });

                                const result = await response.json();

                                if (response.ok) {
                                    await supabase.from('debug_logs').insert({
                                        source: 'facebook_webhook',
                                        message: 'API Reply Sent',
                                        data: { recipient: senderId, text: replyText }
                                    });
                                } else {
                                    console.error('Meta API Error:', result);
                                    await supabase.from('debug_logs').insert({
                                        source: 'facebook_webhook',
                                        level: 'error',
                                        message: 'Graph API Failed',
                                        data: { error: result }
                                    });
                                }
                            } catch (err) {
                                console.error('Failed to call Meta API:', err);
                            }
                        }

                        // 5. Store Outbound Message in Database
                        if (replyText) {
                            await supabase.from('messages').insert({
                                business_id: business.id,
                                customer_contact: senderId,
                                channel: 'facebook',
                                direction: 'outbound',
                                content: replyText,
                                is_read: true,
                                created_at: new Date().toISOString()
                            });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        await supabase.from('debug_logs').insert({ source: 'facebook_webhook_handler', level: 'error', message: 'Unhandled Webhook Exception', data: { error: String(error) } });
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
