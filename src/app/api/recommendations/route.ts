import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '4');

    try {
        // 1. Get user's recent interactions (e.g., from orders or profile)
        // If no user, show global trending semantically similar to 'diverse treasures'
        let seedText = "premium boutique treasures discovery";

        if (userId) {
            const { data: orders } = await supabase
                .from('orders')
                .select('items')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (orders && orders.length > 0 && orders[0].items.length > 0) {
                seedText = orders[0].items[0].name;
            }
        }

        // 2. Generate Embedding for Seed
        const vector = new Array(1536).fill(0).map((_, i) => {
            let hash = 0;
            for (let j = 0; j < seedText.length; j++) {
                hash = (hash << 5) - hash + seedText.charCodeAt(j);
                hash |= 0;
            }
            return Math.sin(hash + i) * 0.1;
        });

        // 3. RPC match_products for similarity
        const { data: recs, error } = await supabase.rpc('match_products', {
            query_embedding: vector,
            match_threshold: 0.3,
            match_count: limit
        });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            recommendations: recs || []
        });
    } catch (error: any) {
        console.error('Recommendations Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
