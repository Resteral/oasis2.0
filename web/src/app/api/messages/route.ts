import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
        // Fetch specific message history
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        return NextResponse.json({ success: !error, messages });
    }

    if (userId) {
        // Fetch user's active conversations
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select('*, businesses(name, logo_url)')
            .eq('customer_id', userId)
            .order('updated_at', { ascending: false });

        return NextResponse.json({ success: !error, conversations });
    }

    return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { customerId, businessId, senderId, content } = body;

    // 1. Get or Create Conversation
    let { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('customer_id', customerId)
        .eq('business_id', businessId)
        .single();

    if (!conversation) {
        const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({ customer_id: customerId, business_id: businessId, last_message: content })
            .select()
            .single();

        if (createError) return NextResponse.json({ success: false, error: createError });
        conversation = newConv;
    } else {
        // Update last message timestamp
        await supabase
            .from('conversations')
            .update({ last_message: content, updated_at: new Date() })
            .eq('id', conversation.id);
    }

    // 2. Insert Message
    const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversation.id,
            sender_id: senderId,
            content: content
        })
        .select()
        .single();

    return NextResponse.json({ success: !msgError, message, conversationId: conversation.id });
}
