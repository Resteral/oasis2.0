import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * MOCK EMBEDDING FUNCTION
 * In a real environment, this calls a proper LLM embedding service.
 */
async function generateEmbedding(text: string): Promise<number[]> {
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

export async function POST(req: Request) {
    try {
        // 1. Fetch products that lack embeddings
        const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('id, name, description')
            .is('embedding', null);

        if (fetchError) throw fetchError;
        if (!products || products.length === 0) {
            return NextResponse.json({ success: true, message: 'All products indexed.' });
        }

        // 2. Generate and update embeddings
        let count = 0;
        for (const product of products) {
            const textToEmbed = `${product.name} ${product.description || ''}`;
            const embedding = await generateEmbedding(textToEmbed);

            const { error: updateError } = await supabase
                .from('products')
                .update({ embedding })
                .eq('id', product.id);

            if (!updateError) count++;
        }

        // 3. Same for businesses
        const { data: businesses } = await supabase
            .from('businesses')
            .select('id, name, description')
            .is('embedding', null);

        if (businesses) {
            for (const biz of businesses) {
                const textToEmbed = `${biz.name} ${biz.description || ''}`;
                const embedding = await generateEmbedding(textToEmbed);
                await supabase.from('businesses').update({ embedding }).eq('id', biz.id);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Vectorized ${count} products and updated boutique embeddings.`
        });
    } catch (error: any) {
        console.error('Embedding Pipeline Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
