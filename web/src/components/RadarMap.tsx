'use client'

import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

const containerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '1rem'
};

const defaultCenter = {
    lat: 40.7128,
    lng: -74.0060
};

export default function RadarMap() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''
    })

    const [businesses, setBusinesses] = useState<any[]>([])
    const [selectedBusiness, setSelectedBusiness] = useState<any>(null)
    const [userLocation, setUserLocation] = useState(defaultCenter)

    useEffect(() => {
        // Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                })
            })
        }

        // Fetch Businesses with Location
        const fetchBusinesses = async () => {
            // In a real app, use PostGIS 'st_dwithin' for radius search
            // For now, fetching all and filtering clientside or just showing all
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, bio, role, is_frontless, business_location, business_address')
                .eq('role', 'business')
                .not('business_address', 'is', null) // Only those with address

            // Mocking coordinates for demo since we only have text address in DB for now
            // In reality, we'd Geocde the address on save. 
            // Generatiing random offsets around user for demo purposes if no coords
            const mapped = (data || []).map((b, i) => ({
                ...b,
                lat: 40.7128 + (Math.random() - 0.5) * 0.1, // Mock lat
                lng: -74.0060 + (Math.random() - 0.5) * 0.1  // Mock lng
            }))

            setBusinesses(mapped)
        }
        fetchBusinesses()
    }, [])

    if (!isLoaded) return <div>Loading Radar...</div>

    return (
        <div className="relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={userLocation}
                zoom={13}
                options={{
                    styles: [
                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    ]
                }}
            >
                {/* User Marker */}
                <Marker position={userLocation} icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" />

                {/* Business Markers */}
                {businesses.map(b => (
                    <Marker
                        key={b.id}
                        position={{ lat: b.lat, lng: b.lng }}
                        onClick={() => setSelectedBusiness(b)}
                        icon={b.is_frontless ? "http://maps.google.com/mapfiles/ms/icons/purple-dot.png" : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                    />
                ))}

                {selectedBusiness && (
                    <InfoWindow
                        position={{ lat: selectedBusiness.lat, lng: selectedBusiness.lng }}
                        onCloseClick={() => setSelectedBusiness(null)}
                    >
                        <div className="text-black p-2 min-w-[200px]">
                            <h3 className="font-bold">{selectedBusiness.full_name}</h3>
                            {selectedBusiness.is_frontless && (
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-bold">Frontless Store</span>
                            )}
                            <p className="text-sm my-2">{selectedBusiness.bio}</p>
                            <Link href={`/messages?chatWith=${selectedBusiness.id}`} className="block bg-blue-600 text-white text-center py-1 rounded text-sm font-bold">
                                Chat Now
                            </Link>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            <div className="absolute top-4 left-4 bg-gray-900/90 p-4 rounded-xl border border-gray-700 text-white shadow-xl max-w-xs">
                <h3 className="font-bold mb-2">🔭 Oasis Radar</h3>
                <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> You
                </div>
                <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> Store
                </div>
                <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span> Frontless (Ghost)
                </div>
            </div>
        </div>
    )
}
