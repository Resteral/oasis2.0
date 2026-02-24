import { NextResponse } from 'next/server'
import { GooglePlace } from '@/types'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const apiKey = process.env.SERPAPI_KEY

    if (!query || !apiKey) {
        return NextResponse.json({ error: 'Query and API Key required' }, { status: 400 })
    }

    try {
        // Switch to 'google_maps' to get Stores + Distance + Coordinates
        // This is better for "Radar" and "Delivery" logic than generic Shopping
        const ll = lat && lng ? `@${lat},${lng},14z` : undefined

        const url = new URL('https://serpapi.com/search.json')
        url.searchParams.set('engine', 'google_maps')
        url.searchParams.set('q', query)
        url.searchParams.set('api_key', apiKey)
        url.searchParams.set('type', 'search')
        if (ll) url.searchParams.set('ll', ll)

        const res = await fetch(url.toString())
        const data = await res.json()

        if (data.error) throw new Error(data.error)

        // Transform Google Maps results
        // They typically have: title, gps_coordinates, address, thumbnail, data_id
        const results: GooglePlace[] = (data.local_results || []).map((item: any) => ({
            place_id: item.place_id || item.data_id,
            name: item.title,
            price: item.price, // Sometimes null in Maps
            formatted_address: item.address,
            rating: item.rating,
            image: item.thumbnail,
            location: item.gps_coordinates, // { latitude, longitude }
            distance: item.distance, // Sometimes provided string e.g. "2.3 mi"
            open_state: item.open_state, // "Open now"
            phone: item.phone // Phone number
        }))

        return NextResponse.json({ results })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
    }
}
