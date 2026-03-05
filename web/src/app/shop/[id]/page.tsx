import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ShopClient from './ShopClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const supabase = await createClient();
    const { id } = params;

    let { data: business } = await supabase
        .from('businesses')
        .select('name, description, image_url, slug')
        .or(`slug.eq.${id},id.eq.${id}`)
        .single();

    if (!business) return { title: 'Oasis Store' };

    return {
        title: `${business.name} | Oasis United`,
        description: business.description || `Shop local at ${business.name} on Oasis.`,
        openGraph: {
            title: business.name,
            description: business.description || `Shop local at ${business.name} on Oasis.`,
            images: [business.image_url || '/og-image.png'],
        },
    };
}

export default async function ShopPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = params;

    // Fetch business by slug (or id)
    let { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', id)
        .single();

    if (!business) {
        const { data: businessById } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', id)
            .single();
        business = businessById;
    }

    if (!business) {
        return <div className="p-32 text-center font-black italic tracking-tighter text-white/20 uppercase">Boutique not found</div>;
    }

    // Fetch products
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', business.id);

    // Fetch posts
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

    return (
        <ShopClient business={business} products={products || []} posts={posts || []} />
    );
}
