
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log('Testing connection to:', supabaseUrl);

    // Test 1: Check businesses table
    const { data: businesses, error: bError } = await supabase.from('businesses').select('count', { count: 'exact', head: true });
    if (bError) {
        console.error('Error fetching businesses:', bError.message);
    } else {
        console.log('Businesses count:', businesses);
    }

    // Test 2: Check products table
    const { data: products, error: pError } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (pError) {
        console.error('Error fetching products:', pError.message);
    } else {
        console.log('Products count:', products);
    }

    // Test 3: Check match_products function
    const { data: matches, error: mError } = await supabase.rpc('match_products', {
        query_embedding: Array(1536).fill(0),
        match_threshold: 0.5,
        match_count: 1
    });
    if (mError) {
        console.error('Error calling match_products:', mError.message);
    } else {
        console.log('match_products works!');
    }
}

testConnection();
