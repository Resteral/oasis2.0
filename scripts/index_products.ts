import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || !openaiKey) {
    console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const openai = new OpenAI({ apiKey: openaiKey });

async function indexProducts() {
    console.log('🚀 Starting product indexing...');

    // 1. Fetch products that don't have embeddings yet
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description')
        .is('embedding', null);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('✅ All products already have embeddings.');
        return;
    }

    console.log(`📦 Found ${products.length} products to index.`);

    for (const product of products) {
        try {
            const input = `${product.name} ${product.description || ''}`.replace(/\n/g, ' ');

            console.log(`✨ Generating embedding for: ${product.name}`);

            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: input,
            });

            const embedding = response.data[0].embedding;

            const { error: updateError } = await supabase
                .from('products')
                .update({ embedding })
                .eq('id', product.id);

            if (updateError) {
                console.error(`❌ Failed to update product ${product.id}:`, updateError);
            } else {
                console.log(`✅ Indexed ${product.name}`);
            }
        } catch (err) {
            console.error(`❌ Error processing product ${product.id}:`, err);
        }
    }

    console.log('🏁 Indexing complete!');
}

indexProducts();
