import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import twilio from 'twilio';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { businessId, customer_contact, content } = body;

        if (!businessId || !customer_contact || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Insert into Supabase Unified Inbox
        const { data: dbData, error: dbError } = await supabase
            .from('messages')
            .insert({
                business_id: businessId,
                customer_contact,
                channel: 'web',
                direction: 'inbound',
                content
            })
            .select('*')
            .single();

        if (dbError) {
            console.error('Error saving to DB:', dbError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 2. Fetch Business Owner's Twilio Number (if connected) to send them a text alert
        const { data: business } = await supabase
            .from('businesses')
            .select('name, integrations')
            .eq('id', businessId)
            .single();

        if (business && business.integrations?.twilio?.phone && business.integrations.twilio.connected) {
            const ownerPhone = business.integrations.twilio.phone;

            // Initialize Twilio. In production, ensure these exist in .env
            // We use process.env to grab the credentials. 
            // If they are missing, we gracefully skip sending the SMS to prevent a crash.
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

            if (accountSid && authToken && twilioPhone) {
                const client = twilio(accountSid, authToken);

                try {
                    await client.messages.create({
                        body: `New Web Message for ${business.name}!\nFrom: ${customer_contact}\n"${content}"\n\n- Oasis`,
                        from: twilioPhone, // The Twilio verified sender
                        to: ownerPhone    // The business owner's registered phone
                    });
                    console.log('Twilio SMS Notification sent successfully to vendor.');
                } catch (smsError) {
                    console.error('Twilio SMS failed to send:', smsError);
                    // We don't fail the whole request if SMS fails, 
                    // since the message is already saved in their dashboard inbox.
                }
            } else {
                console.warn('Twilio environment variables not set. Skipping SMS notification.');
            }
        }

        return NextResponse.json({ success: true, message: dbData }, { status: 200 });

    } catch (error: any) {
        console.error('Message Send API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
