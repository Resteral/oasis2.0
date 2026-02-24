// Direct Google Places API Client
// NOTE: In a production extension, API keys should be restricted by HTTP Referer or specialized checks.
// Since Chrome Extensions run client-side, this key is visible to users.
const GOOGLE_API_KEY = "AIzaSyAq_pFDdZ0Y85mnrig7YrUxDAVsQCR0q6E";
export async function searchNearby(query, latitude, longitude) {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    // Bias towards user location (10km radius preference)
    const googleReq = {
        textQuery: query,
        locationBias: {
            circle: {
                center: { latitude, longitude },
                radius: 10000
            }
        }
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.priceLevel,places.rating,places.userRatingCount,places.businessStatus'
            },
            body: JSON.stringify(googleReq)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Failed to fetch from Google');
        }
        const data = await response.json();
        return data.places || [];
    }
    catch (error) {
        console.error("Search Error:", error);
        throw error;
    }
}
