import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmbedding } from '@/lib/openai';

/**
 * Oasis Global Search V2 (AI-Powered)
 * Handles semantic product search using OpenAI embeddings and pgvector.
 */
export async function POST(req: Request) {
    try {
        const { query, distance = 50, delivery = false } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 1. Generate embedding for the query
        const queryEmbedding = await getEmbedding(query);

        // 2. Call Supabase RPC match_products
        const supabase = await createClient();
        const { data: matches, error } = await supabase.rpc('match_products', {
            query_embedding: queryEmbedding,
            match_threshold: 0.1, // Adjust based on precision needs
            match_count: 10,
            max_distance: distance,
            requires_delivery: delivery
        });

        if (error) {
            console.error('Supabase RPC Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            results: matches || [],
            query: query
        });

    } catch (error: any) {
        console.error('Search V2 Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// Keep GET for compatibility if needed, but return generic results
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ success: false, error: 'Query missing' }, { status: 400 });
    }

    // Redirect or suggest using POST for semantic search
    return NextResponse.json({
        success: false,
        message: "Oasis Search V2 requires a POST request for semantic analysis. Please use the 'Ask Oasis' interface."
    }, { status: 405 });
}
