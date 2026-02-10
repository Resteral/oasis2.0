import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface SearchRequest {
    query: string;
    lat?: number;
    lng?: number;
}

serve(async (req) => {
    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query, lat, lng } = await req.json() as SearchRequest
        const apiKey = Deno.env.get('SERPAPI_KEY')

        if (!query || !apiKey) {
            return new Response(JSON.stringify({ error: 'Query and SERPAPI_KEY required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Prepare Google Maps Search
        // Engine: google_maps
        const type = 'search' // standard search
        let ll = undefined

        // Construct LL string if location provided
        if (lat && lng) {
            ll = `@${lat},${lng},14z`
        }

        const url = new URL('https://serpapi.com/search.json')
        url.searchParams.set('engine', 'google_maps')
        url.searchParams.set('q', query)
        url.searchParams.set('api_key', apiKey)
        url.searchParams.set('type', type)
        if (ll) url.searchParams.set('ll', ll)

        console.log(`Fetching SerpApi: ${url.toString().replace(apiKey, 'HIDDEN')}`)

        const res = await fetch(url.toString())
        const data = await res.json()

        if (data.error) {
            throw new Error(data.error)
        }

        // Transform Results
        const results = (data.local_results || []).map((item: any) => ({
            place_id: item.place_id || item.data_id,
            name: item.title,
            price: item.price,
            formatted_address: item.address,
            rating: item.rating,
            image: item.thumbnail,
            location: item.gps_coordinates, // { latitude, longitude }
            distance: item.distance, // "2.3 mi" string from Google
            open_state: item.open_state
        }))

        return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
