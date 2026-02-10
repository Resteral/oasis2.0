'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import RadarMap from '@/components/RadarMap'

import { GooglePlace } from '@/types'

interface Pro {
    id: string
    full_name: string
    bio: string
    skills: string[]
    hourly_rate: number
    avatar_url: string
    rating: number
}

interface Ad {
    id: string
    content: string
    image_url: string
    profiles: { full_name: string }
}

export default function Marketplace() {
    // State
    const [pros, setPros] = useState<Pro[]>([])
    const [ads, setAds] = useState<Ad[]>([])
    // Local Product State
    const [localProducts, setLocalProducts] = useState<any[]>([])
    const defaultCenter = { lat: 34.052235, lng: -118.243683 } // Default to Los Angeles
    const [userLocation, setUserLocation] = useState(defaultCenter)

    // Get Location on Mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({
                    // @ts-ignore
                    lat: pos.coords.latitude,
                    // @ts-ignore
                    lng: pos.coords.longitude
                })
            })
        }
    }, [])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'pros' | 'products' | 'radar'>('pros')

    // Google API State
    const [searchQuery, setSearchQuery] = useState('')
    const [googlePlaces, setGooglePlaces] = useState<GooglePlace[]>([])

    // Auth State
    const [user, setUser] = useState<any>(null)

    // Local Search Logic Only
    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setLoading(true)
        setGooglePlaces([])

        // Only Google Places Search (Local)
        try {
            const res = await fetch(`/api/places?query=${encodeURIComponent(searchQuery)}&lat=${userLocation?.lat}&lng=${userLocation?.lng}`)
            const data = await res.json()
            setGooglePlaces(data.results || [])
        } catch (e) {
            console.error(e)
            alert('Failed to search local places')
        }
        setLoading(false)
    }

    const handleOrder = async (place: GooglePlace) => {
        if (!user) {
            alert('Please login to order delivery!')
            return
        }

        const confirm = window.confirm(`Request delivery for ${place.name}?\n\nThis will look for drivers near ${place.formatted_address}.`)
        if (!confirm) return

        try {
            const { error } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    product_name: place.name,
                    store_name: place.name,
                    store_address: place.formatted_address,
                    // store_location: place.location ? `POINT(${place.location.longitude} ${place.location.latitude})` : null, 
                    // PostGIS insertion often requires specific format or casting. 
                    // For now, let's stick to simple text/null or rely on lat/lng columns if we added them.
                    // The schema has geography(POINT). Supabase JS handles WKT 'POINT(lng lat)' usually.

                    delivery_address: "My Saved Address", // Mock for now, or fetch from profile
                    status: 'pending'
                })

            if (error) throw error
            alert('Order Created! 🚚\nWaiting for a driver to accept.')
        } catch (e: any) {
            console.error(e)
            alert('Failed to create order: ' + e.message)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            // Get Current User
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            // Fetch Service Providers & Businesses
            const { data: prosData } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['provider', 'business']) // Include Businesses
                .limit(20)

            // Fetch Promoted Posts (Ads)
            const { data: adsData } = await supabase
                .from('posts')
                .select('*, profiles(full_name)')
                .eq('is_promoted', true)
                .limit(5)

            setPros(prosData || [])
            // @ts-ignore
            setAds(adsData || [])
            setLoading(false)
        }
        fetchData()
    }, [])

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            Marketplace
                        </h1>
                        <p className="text-gray-400">Find professionals, products, and services.</p>
                    </div>
                    <Link href="/dashboard" className="text-gray-400 hover:text-white">Back to Dashboard</Link>
                </div>

                {/* Featured Ads Carousel */}
                {ads.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-4">Sponsored</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {ads.map(ad => (
                                <div key={ad.id} className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-yellow-500/30 relative overflow-hidden">
                                    <div className="absolute top-2 right-2 text-xs bg-yellow-500 text-black font-bold px-2 py-1 rounded">AD</div>
                                    <h3 className="font-bold mb-2">{ad.profiles.full_name}</h3>
                                    <p className="text-sm text-gray-300">{ad.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-6 mb-8 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('pros')}
                        className={`pb-4 px-2 font-medium transition ${activeTab === 'pros' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        Pros & Businesses
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`pb-4 px-2 font-medium transition ${activeTab === 'products' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        Find Products
                    </button>
                    <button
                        onClick={() => setActiveTab('radar')}
                        className={`pb-4 px-2 font-medium transition ${activeTab === 'radar' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        Radar Map 🔭
                    </button>
                </div>

                {/* Pros List */}
                {activeTab === 'pros' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {pros.map(pro => (
                            <div key={pro.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold">
                                        {pro.full_name?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold">{pro.full_name}</h3>
                                        <div className="text-xs text-blue-400 font-medium">⭐ {pro.rating || 'New'}</div>
                                    </div>
                                    {pro.hourly_rate && (
                                        <div className="text-right">
                                            <div className="text-lg font-bold">${pro.hourly_rate}</div>
                                            <div className="text-xs text-gray-500">/hr</div>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{pro.bio || 'No bio provided.'}</p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {(pro.skills || []).slice(0, 3).map(skill => (
                                        <span key={skill} className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Link href={`/messages?chatWith=${pro.id}`} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition text-center text-sm">
                                        Message
                                    </Link>
                                    <button className="flex-1 border border-blue-600 text-blue-400 hover:bg-blue-600/10 py-2 rounded-lg font-medium transition text-sm">
                                        Hire Now
                                    </button>
                                </div>
                            </div>
                        ))}

                        {pros.length === 0 && !loading && (
                            <div className="col-span-3 text-center py-10 text-gray-500">
                                No professionals found. <Link href="/profile" className="text-blue-400 underline">Become one!</Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Radar Map */}
                {activeTab === 'radar' && (
                    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                        <RadarMap />
                    </div>
                )}

                {/* Products Search */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center">
                            <h2 className="text-2xl font-bold mb-4">Find Products Locally 📍</h2>
                            <div className="max-w-md mx-auto flex gap-2">
                                <input
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2"
                                    placeholder="Search 'Milk', 'Batteries', 'Hardware'..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="bg-blue-600 px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                                >
                                    {loading ? 'Searching...' : 'Find Nearby'}
                                </button>
                            </div>
                        </div>

                        {/* Local Business Listings (Oasis) */}
                        {localProducts.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-4 text-green-400">Scraped / Oasis Inventory</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {localProducts.map(product => (
                                        <div key={product.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                            <div className="h-32 bg-gray-700 rounded mb-4 flex items-center justify-center text-4xl overflow-hidden">
                                                {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : '🍱'}
                                            </div>
                                            <h4 className="font-bold">{product.name}</h4>
                                            <div className="text-green-400 font-bold">${product.price}</div>
                                            <p className="text-xs text-gray-400 line-clamp-2 mt-1">{product.description}</p>
                                            <div className="flex gap-2 mt-3">
                                                <button className="flex-1 bg-blue-600/20 text-blue-400 py-1 rounded text-xs font-bold border border-blue-600/50">
                                                    Order / Chat
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Google Shopping Results (SerpApi) */}
                        {googlePlaces.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-yellow-400">📍 Found in Nearby Stores</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {googlePlaces.map((place: GooglePlace, i: number) => {
                                        // Calculate distance if not provided
                                        let distDisplay = place.distance
                                        if (!distDisplay && place.location && userLocation.lat !== 0) {
                                            const R = 6371; // km
                                            const dLat = (place.location.latitude - userLocation.lat) * Math.PI / 180;
                                            const dLon = (place.location.longitude - userLocation.lng) * Math.PI / 180;
                                            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                                Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(place.location.latitude * Math.PI / 180) *
                                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                            const d = R * c * 0.621371; // Convert to miles
                                            distDisplay = `${d.toFixed(1)} mi`
                                        }

                                        return (
                                            <div key={i} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex gap-4 hover:border-yellow-500 transition">
                                                <div className="w-20 h-20 bg-white rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden p-2">
                                                    {place.image ? <img src={place.image} className="w-full h-full object-contain" /> : <span className="text-2xl">🏪</span>}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-sm line-clamp-2">{place.name}</h3>
                                                    {place.price && <div className="text-green-400 font-bold text-lg">{place.price}</div>}
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                                        <span>📍 {place.formatted_address}</span>
                                                        {place.rating && <span className="text-yellow-500">⭐ {place.rating}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {distDisplay && <div className="text-xs text-blue-300 font-bold">📏 {distDisplay}</div>}
                                                        {place.open_state && <div className="text-xs text-green-300">{place.open_state}</div>}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 self-center">
                                                    <button
                                                        onClick={() => handleOrder(place)}
                                                        className="text-xs bg-green-600 hover:bg-green-700 h-8 px-3 rounded flex items-center justify-center font-bold transition"
                                                    >
                                                        Order 🚚
                                                    </button>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.formatted_address)}`}
                                                        target="_blank"
                                                        className="text-xs bg-gray-700 hover:bg-gray-600 h-8 px-3 rounded flex items-center justify-center font-bold transition"
                                                    >
                                                        Map 🗺️
                                                    </a>
                                                    {place.phone && (
                                                        <a
                                                            href={`tel:${place.phone}`}
                                                            className="text-xs bg-indigo-600 hover:bg-indigo-700 h-8 px-3 rounded flex items-center justify-center font-bold transition"
                                                        >
                                                            Call 📞
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
