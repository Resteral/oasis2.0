import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query && !category) {
        // Return featured items if no search query
        const { data: featuredBusinesses } = await supabase
            .from('businesses')
            .select('*')
            .eq('is_featured', true)
            .limit(5);

        const { data: featuredProducts } = await supabase
            .from('products')
            .select('*, businesses(name, theme)')
            .eq('is_featured', true)
            .limit(10);

        return NextResponse.json({
            featured: {
                businesses: featuredBusinesses || [],
                products: featuredProducts || []
            }
        });
    }

    let productQuery = supabase
        .from('products')
        .select('*, businesses(id, name, theme, location, logo_url)')
        .limit(limit);

    if (query) {
        productQuery = productQuery.ilike('name', `%${query}%`);
    }

    if (category && category !== 'All') {
        productQuery = productQuery.eq('category', category);
    }

    const { data: products, error: pError } = await productQuery;

    let businessQuery = supabase
        .from('businesses')
        .select('*')
        .limit(limit);

    if (query) {
        businessQuery = businessQuery.ilike('name', `%${query}%`);
    }

    if (category && category !== 'All') {
        businessQuery = businessQuery.eq('category', category);
    }

    const { data: businesses, error: bError } = await businessQuery;

    return NextResponse.json({
        success: true,
        results: {
            products: products || [],
            businesses: businesses || []
        }
    });
}
