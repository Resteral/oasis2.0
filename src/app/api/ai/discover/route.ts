import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { openai, getEmbedding } from '@/lib/openai';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, distance, delivery } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 1. Generate Query Embedding
        const queryEmbedding = await getEmbedding(query);

        // 2. Perform Vector Search (matching businesses or products)
        // For discovery, we'll try to find businesses with matching descriptions/products
        const { data: matches, error: matchError } = await supabase.rpc('match_products', {
            query_embedding: queryEmbedding,
            match_threshold: 0.2, // Looser for discovery
            match_count: 5
        });

        if (matchError) throw matchError;

        // 3. Generate AI Insight using GPT-3.5
        const insightResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are the Oasis AI Discovery expert. You will receive a user query and a list of local matches. Write a 1-sentence catchy summary explaining why these shops are perfect for the user's vibe." },
                { role: "user", content: `Query: ${query}\nMatches: ${JSON.stringify(matches?.map((m: any) => m.name))}` }
            ]
        });

        const aiInsight = insightResponse.choices[0].message.content;

        return NextResponse.json({
            success: true,
            matches: matches || [],
            ai_insight: aiInsight || `I found ${matches?.length || 0} great spots for "${query}"!`
        }, { status: 200 });

    } catch (error: any) {
        console.error('AI Discover Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
