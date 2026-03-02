import { NextResponse } from 'next/server';
import { GooglePlace } from '@/lib/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const apiKey = process.env.SERPAPI_KEY;

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!apiKey) {
        // Return mock data if API key is missing to keep the UI functional during development
        console.warn('SERPAPI_KEY is not set. Returning mock results.');
        return NextResponse.json({
            results: [
                {
                    place_id: 'mock_1',
                    name: `Store near ${query}`,
                    formatted_address: '123 Fake St, Local City',
                    rating: 4.5,
                    distance: '1.2 mi',
                    open_state: 'Open now'
                }
            ]
        });
    }

    try {
        const url = new URL('https://serpapi.com/search.json');
        url.searchParams.set('engine', 'google_maps');
        url.searchParams.set('q', query);
        url.searchParams.set('api_key', apiKey);
        url.searchParams.set('type', 'search');

        if (lat && lng) {
            url.searchParams.set('ll', `@${lat},${lng},14z`);
        }

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        const results: GooglePlace[] = (data.local_results || []).map((item: any) => ({
            place_id: item.place_id || item.data_id,
            name: item.title,
            price: item.price,
            formatted_address: item.address,
            rating: item.rating,
            image: item.thumbnail,
            location: item.gps_coordinates,
            distance: item.distance,
            open_state: item.open_state,
            phone: item.phone
        }));

        return NextResponse.json({ results });
    } catch (error) {
        console.error('SerpApi Error:', error);
        return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
    }
}
