import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// import { OpenAI } from 'openai'; // Once API key is added, uncomment this

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, distance, delivery } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // --- FUTURE OPENAI INTEGRATION ---
        // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        // const aiResponse = await openai.chat.completions.create({
        //     model: "gpt-3.5-turbo",
        //     messages: [
        //         { role: "system", content: "You are an AI assistant helping a user find local businesses. Extract key categories or intent from their query." },
        //         { role: "user", content: query }
        //     ]
        // });
        // const intent = aiResponse.choices[0].message.content;

        // --- MOCKED AI LOGIC ---
        // For now, we simulate the AI extracting keywords from the user's query
        const searchKeyword = query.split(' ')[0].toLowerCase(); // Basic mock: grab first word

        // 1. Fetch businesses from Supabase that might match
        // In a real app with AI, we would do embedding similarity search (pgvector)
        // Here, we'll just do a basic text search on the name or description
        let { data: businesses, error } = await supabase
            .from('businesses')
            .select('id, name, slug, description, location')
            .or(`name.ilike.%${searchKeyword}%,description.ilike.%${searchKeyword}%`)
            .limit(5);

        if (error) {
            console.error('Supabase search error:', error);
            // Fallback: if search fails or returns nothing, just grab the most recent ones 
            // so the modal always shows something for the demo
            const fallback = await supabase.from('businesses').select('id, name, slug, description, location').limit(3);
            businesses = fallback.data;
        }

        if (!businesses || businesses.length === 0) {
            // Ultimate fallback if DB is entirely empty
            businesses = [
                { id: '1', slug: 'demo', name: 'Demo Catch-All Store', description: 'This is a demo store.', location: 'Local' }
            ];
        }

        // Return the "AI" curated list of businesses
        return NextResponse.json({
            success: true,
            matches: businesses,
            ai_insight: `I found ${businesses.length} great spots matching "${query}" near you!`
        }, { status: 200 });

    } catch (error: any) {
        console.error('AI Discover Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
