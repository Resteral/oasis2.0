import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * MOCK EMBEDDING FUNCTION
 * In a production environment, this would call OpenAI's text-embedding-3-small
 * or a similar service to convert text into a 1536-dimensional vector.
 */
async function generateEmbedding(text: string): Promise<number[]> {
    // For demonstration, we'll generate a pseudo-random deterministic vector
    // based on the input text. In a real app, use a proper embedding model.
    const vector = new Array(1536).fill(0).map((_, i) => {
        let hash = 0;
        for (let j = 0; j < text.length; j++) {
            hash = (hash << 5) - hash + text.charCodeAt(j);
            hash |= 0;
        }
        return Math.sin(hash + i) * 0.1;
    });
    return vector;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ success: false, error: 'Query missing' }, { status: 400 });
    }

    try {
        // 1. Generate Embedding for the search query
        const queryEmbedding = await generateEmbedding(query);

        // 2. Perform Vector Similarity Search via RPC
        // Uses the match_products function defined in database_schema.md
        const { data: products, error: productError } = await supabase.rpc('match_products', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 10
        });

        if (productError) throw productError;

        // 3. Search for Businesses (Semantic logic)
        // Note: For businesses, we'd ideally have a similar match_businesses RPC
        const { data: businesses, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .limit(5); // Fallback: keyword or random for now, until embedding logic matches

        return NextResponse.json({
            success: true,
            query,
            results: {
                products: products || [],
                shops: businesses || []
            }
        });
    } catch (error: any) {
        console.error('AI Search Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
