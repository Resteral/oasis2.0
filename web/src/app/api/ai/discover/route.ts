import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, distance, delivery } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 1. Generate Query Embedding
        // MOCK: Disabled OpenAI integration
        const queryEmbedding = Array(1536).fill(0.01);

        // 2. Perform Vector Search (matching businesses or products)
        // For discovery, we'll try to find businesses with matching descriptions/products
        const { data: matches, error: matchError } = await supabase.rpc('match_products', {
            query_embedding: queryEmbedding,
            match_threshold: 0.2, // Looser for discovery
            match_count: 5
        });

        if (matchError) throw matchError;

        // 3. Generate AI Insight using GPT-3.5
        // MOCK: Disabled OpenAI integration
        const aiInsight = "I found some great spots for you!";

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
