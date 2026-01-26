import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Define the request structure
interface SearchRequest {
  query: string;
  latitude: number;
  longitude: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { query, latitude, longitude } = await req.json() as SearchRequest;
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || "AIzaSyAq_pFDdZ0Y85mnrig7YrUxDAVsQCR0q6E";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API Key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Google Places API (New) Text Search
    // https://places.googleapis.com/v1/places:searchText
    const url = 'https://places.googleapis.com/v1/places:searchText';

    // Bias towards user location but allow broader search
    // Using 10km radius for bias
    const googleReq = {
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude, longitude },
          radius: 10000
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Requesting fields used by the frontend
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.priceLevel,places.rating,places.userRatingCount,places.businessStatus'
      },
      body: JSON.stringify(googleReq)
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
