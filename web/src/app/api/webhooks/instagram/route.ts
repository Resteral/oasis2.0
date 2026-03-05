import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
    // Webhooks need Service Role to bypass RLS (no user session)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();

    console.log('Received Webhook:', JSON.stringify(body, null, 2));

    try {
        // Facebook/Messenger usually uses object === 'page'
        // Instagram usually uses object === 'instagram'
        const isInstagram = body.object === 'instagram';
        const isPage = body.object === 'page';

        if (isInstagram || isPage) {
            const platform = isInstagram ? 'instagram' : 'facebook';
            await supabase.from('debug_logs').insert({
                source: `${platform}_webhook`,
                message: `Processing ${platform} Event`,
                data: body
            });

            for (const entry of body.entry) {
                // The 'id' here is usually the Page ID / Business Account ID
                const pageId = entry.id;
                const messaging = entry.messaging;

                if (!messaging) continue;

                for (const event of messaging) {
                    const senderId = event.sender.id;
                    const message = event.message;

                    if (message && message.text) {
                        // 1. Find the business connected to this ID
                        // Check logic: 
                        // If Instagram -> look in integrations.instagram.id
                        // If Facebook -> look in integrations.facebook.id

                        let query = supabase.from('businesses').select('id, name, category, integrations');

                        if (isInstagram) {
                            query = query.contains('integrations', { instagram: { id: pageId } });
                        } else {
                            query = query.contains('integrations', { facebook: { id: pageId } });
                        }

                        const { data: business, error: businessError } = await query.single();

                        if (businessError || !business) {
                            console.warn(`No business found for ${platform} ID: ${pageId}`);
                            await supabase.from('debug_logs').insert({
                                source: `${platform}_webhook`,
                                level: 'error',
                                message: `No business found for Page ID: ${pageId}. Ensure 'integrations.${platform}.id' matches.`,
                                data: { pageId, error: businessError }
                            });
                            continue;
                        }

                        // Log success
                        await supabase.from('debug_logs').insert({
                            source: `${platform}_webhook`,
                            message: `Found Business: ${business.name}`,
                            data: { businessId: business.id }
                        });

                        // 2. Insert Message into Database
                        await supabase.from('messages').insert({
                            business_id: business.id,
                            customer_contact: senderId,
                            channel: platform, // 'instagram' or 'facebook'
                            direction: 'inbound',
                            content: message.text,
                            is_read: false
                        });

                        // 3. AI / Context-Aware Logic
                        let replyText = "";
                        const lowerMsg = message.text.toLowerCase();
                        const category = (business.category || 'retail').toLowerCase();

                        // Simple heuristic "AI" for demonstration
                        // (Same logic for both platforms)
                        if (category.includes('restaurant') || category.includes('food') || category.includes('cafe')) {
                            if (lowerMsg.includes('order') || lowerMsg.includes('menu')) {
                                replyText = `Yum! 🍔 We'd love to feed you at ${business.name}. What are you craving today?`;
                            } else if (lowerMsg.includes('hour') || lowerMsg.includes('open')) {
                                replyText = "We are open from 9 AM to 9 PM! Come by for a bite! 🥐";
                            } else {
                                replyText = `Hi there! Welcome to ${business.name}. How can we make your day delicious? 🥗`;
                            }
                        } else if (category.includes('gym') || category.includes('fitness')) {
                            if (lowerMsg.includes('join') || lowerMsg.includes('price')) {
                                replyText = "Ready to crush your goals? 💪 Memberships start at $29/mo. Want a free pass?";
                            } else {
                                replyText = `Hey! Let's get moving! 🏋️‍♂️ How can we help you with your fitness journey at ${business.name}?`;
                            }
                        } else {
                            // Default Retail / General
                            if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
                                replyText = "Our prices are very competitive! Check our website for the latest deals. 🛍️";
                            } else {
                                replyText = `Hello! Thanks for messaging ${business.name}. We're here to help you find exactly what you need. ✨`;
                            }
                        }

                        // 4. Send Message via Graph API (if token exists)
                        const integrations = business.integrations || {};
                        const platformConfig = integrations[platform] || {};
                        const accessToken = platformConfig.access_token;

                        let sentViaApi = false;

                        if (replyText && accessToken) {
                            try {
                                // Works for both Instagram and Facebook Pages via Graph API
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
                                    sentViaApi = true;
                                    await supabase.from('debug_logs').insert({
                                        source: `${platform}_webhook`,
                                        message: 'API Reply Sent',
                                        data: { recipient: senderId, text: replyText }
                                    });
                                } else {
                                    console.error('Meta API Error:', result);
                                    await supabase.from('debug_logs').insert({
                                        source: `${platform}_webhook`,
                                        level: 'error',
                                        message: 'Graph API Failed',
                                        data: { error: result, platform }
                                    });
                                }
                            } catch (err) {
                                console.error('Failed to call Meta API:', err);
                                await supabase.from('debug_logs').insert({
                                    source: `${platform}_webhook`,
                                    level: 'error',
                                    message: 'Fetch Exception',
                                    data: { error: String(err) }
                                });
                            }
                        } else if (!accessToken) {
                            await supabase.from('debug_logs').insert({
                                source: `${platform}_webhook`,
                                level: 'warn',
                                message: 'Missing Access Token',
                                data: { businessId: business.id }
                            });
                        }

                        // 5. Store Outbound Message in Database
                        if (replyText) {
                            await supabase.from('messages').insert({
                                business_id: business.id,
                                customer_contact: senderId,
                                channel: platform,
                                direction: 'outbound',
                                content: replyText,
                                is_read: true,
                                created_at: new Date().toISOString()
                            });
                            console.log(`[${sentViaApi ? 'REAL' : 'MOCK'} AI Reply] To ${senderId}: ${replyText}`);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        await supabase.from('debug_logs').insert({ source: 'webhook_handler', level: 'error', message: 'Unhandled Webhook Exception', data: { error: String(error) } });
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
