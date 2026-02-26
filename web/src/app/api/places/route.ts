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
        let results: GooglePlace[] = (data.local_results || []).map((item: any) => ({
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

        if (lat && lng) {
            const userLat = parseFloat(lat)
            const userLng = parseFloat(lng)

            results = results.map(r => {
                let calcDist = 9999;
                if (r.location?.latitude && r.location?.longitude) {
                    calcDist = getDistanceFromLatLonInMiles(
                        userLat, userLng,
                        r.location.latitude, r.location.longitude
                    )
                    r.distance = `${calcDist.toFixed(1)} mi`
                }
                return { ...r, _calcDist: calcDist }
            })

            console.log("Results before filter:", results.map(r => ({ name: r.name, dist: (r as any)._calcDist })))

            // Filter out places further than 50 miles and sort by distance
            results = results
                .filter(r => (r as any)._calcDist <= 50)
                .sort((a, b) => (a as any)._calcDist - (b as any)._calcDist)
                .map(r => {
                    const { _calcDist, ...rest } = r as any;
                    return rest as GooglePlace;
                })

            console.log("Results after filter:", results.length)
        }

        return NextResponse.json({ results })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
    }
}

function getDistanceFromLatLonInMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 3958.8; // Radius of the earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}
