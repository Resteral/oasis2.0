'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RadarMap from '@/components/RadarMap'
import GlobalSearch from '@/components/GlobalSearch'
import CategoryNav from '@/components/CategoryNav'
import DiscoveryFeed from '@/components/DiscoveryFeed'

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
    const [localProducts, setLocalProducts] = useState<any[]>([])
    const [shoutouts, setShoutouts] = useState<any[]>([])
    const [activeCategory, setActiveCategory] = useState('All')
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'discovery' | 'pros' | 'products' | 'radar'>('discovery')

    // Location
    const defaultCenter = { lat: 34.052235, lng: -118.243683 }
    const [userLocation, setUserLocation] = useState(defaultCenter)

    // Search
    const [searchQuery, setSearchQuery] = useState('')
    const [googlePlaces, setGooglePlaces] = useState<GooglePlace[]>([])

    // Auth
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                })
            })
        }
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            // 1. Fetch Pros
            const { data: prosData } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['provider', 'business'])
                .limit(20)

            // 2. Fetch Shoutouts
            const { data: globalShoutouts } = await supabase
                .from('shoutouts')
                .select('*, businesses(name, location, logo_url)')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(4)

            setPros(prosData || [])
            setShoutouts(globalShoutouts || [])
            setLoading(false)
        }
        fetchData()
    }, [])

    const [localShops, setLocalShops] = useState<any[]>([])

    const handleSerpApiSearch = async () => {
        try {
            const res = await fetch(`/api/places?query=${encodeURIComponent(searchQuery)}&lat=${userLocation.lat}&lng=${userLocation.lng}`)
            const data = await res.json()
            if (data.results) {
                setGooglePlaces(data.results)
                // If we found external results, switch to a view that might show them
                // For now we'll just log them or add to a new state
                console.log("External results found:", data.results.length)
            }
        } catch (e) {
            console.error("External Discovery Failed:", e)
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setLoading(true)
        setLocalProducts([])
        setLocalShops([])
        setGooglePlaces([])

        try {
            // 1. Search Products
            const { data: products, error: pError } = await supabase
                .from('products')
                .select(`
                    id, name, description, price, image_url, category,
                    business:businesses ( id, name, location )
                `)
                .ilike('name', `%${searchQuery}%`)
                .limit(20)

            if (pError) throw pError
            setLocalProducts(products || [])

            // 2. Search Businesses (Local Discovery)
            const { data: shops, error: bError } = await supabase
                .from('businesses')
                .select('*')
                .or(`name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
                .limit(20)

            if (bError) throw bError
            setLocalShops(shops || [])

            setActiveTab('products')

            // Fallback: If no local results, try SerpApi
            if ((!products || products.length === 0) && (!shops || shops.length === 0)) {
                console.log("No local results found. Network scan initiated...")
                await handleSerpApiSearch()
            }

        } catch (e: any) {
            console.error("Search Error:", e)
            if (e.message?.includes('mock') || e.message?.includes('fetch')) {
                console.warn("Using mock environment - attempting external discovery.")
                await handleSerpApiSearch()
            } else {
                alert('Search connectivity interrupted.')
            }
        }
        setLoading(false)
    }

    const handleOrder = async (product: any, isSerpApiPlace: boolean = false) => {
        if (!user) {
            alert('Please sign in to order delivery!')
            router.push('/auth')
            return
        }

        const itemName = isSerpApiPlace ? product.name : product.name
        const confirm = window.confirm(`Request delivery for ${itemName}?\n\nThis will include a $5 delivery fee.`)
        if (!confirm) return

        try {
            const itemPrice = isSerpApiPlace ? 0 : parseFloat(product.price || 0)
            const deliveryFee = 5.00
            const total = itemPrice + deliveryFee

            let orderData: any = {
                consumer_id: user.id,
                status: 'pending',
                type: 'shipping',
                total: total,
                address: "Current Location",
                items: [{ name: itemName, price: itemPrice }]
            }

            const { error } = await supabase.from('orders').insert({
                ...orderData,
                business_id: isSerpApiPlace ? null : product.business?.id,
                customer_name: user?.user_metadata?.full_name || 'Customer'
            })
            if (error) throw error

            alert(`Order Created! 🚚\nTotal: $${total.toFixed(2)}\nWaiting for a driver to accept.`)
        } catch (e: any) {
            console.error(e)
            alert('Failed to create order: ' + e.message)
        }
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-[hsl(var(--primary))] selection:text-[hsl(var(--primary-foreground))]">
            {/* Premium Hero Section */}
            <div className="relative pt-32 pb-48 px-8 overflow-hidden oasis-gradient">
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[60%] bg-[hsl(var(--primary))/0.05] blur-[150px] rounded-full"></div>

                <div className="max-w-7xl mx-auto relative z-10 text-center space-y-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[hsl(var(--primary))/0.1] border border-[hsl(var(--primary))/0.2] rounded-full">
                            <span className="w-1.5 h-1.5 bg-[hsl(var(--primary))] rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[hsl(var(--primary))]">The Global Oasis</span>
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-none">
                            Discover <span className="text-[hsl(var(--primary))]">Everything.</span>
                        </h1>
                        <p className="max-w-xl mx-auto text-[hsl(var(--muted-foreground))] font-medium text-lg leading-relaxed">
                            Boutiques, treasures, and experiences from the world's most premium independent ecosystem.
                        </p>
                    </div>

                    <Suspense fallback={<div className="h-16 w-full max-w-2xl mx-auto bg-white/5 animate-pulse rounded-full"></div>}>
                        <div className="max-w-xl mx-auto glass p-1 rounded-[3rem]">
                            <GlobalSearch />
                        </div>
                    </Suspense>

                    <div className="flex justify-center gap-6 mt-12 overflow-x-auto pb-4 no-scrollbar">
                        {[
                            { id: 'discovery', label: 'Discovery Feed', icon: '✨' },
                            { id: 'pros', label: 'Pros & Biz', icon: '🛠️' },
                            { id: 'products', label: 'Find Nearby', icon: '📍' },
                            { id: 'radar', label: 'Radar Map', icon: '🔭' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap snap-center ${activeTab === tab.id
                                    ? 'bg-[hsl(var(--primary))] text-black shadow-xl scale-105'
                                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <span className="text-xl">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-8 -mt-24 pb-32 space-y-32">
                {/* Discovery Tab */}
                {activeTab === 'discovery' && (
                    <div className="space-y-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <section className="relative z-50">
                            <Suspense fallback={<div className="h-16 w-full max-w-2xl mx-auto bg-white/5 animate-pulse rounded-full"></div>}>
                                <CategoryNav onCategoryChange={setActiveCategory} />
                            </Suspense>
                        </section>

                        <section className="space-y-12">
                            <div className="flex justify-between items-end px-4">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black italic tracking-tight uppercase">Oasis Discovery</h2>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Curated Fresh Arrivals</p>
                                </div>
                            </div>
                            <DiscoveryFeed />
                        </section>

                        {/* Shoutouts Section */}
                        <section className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-[4rem] p-12 md:p-20 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none grayscale group-hover:grayscale-0 transition-all duration-700">
                                <span className="text-[200px] italic font-black select-none">📢</span>
                            </div>
                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div className="space-y-8">
                                    <h2 className="text-6xl font-black italic tracking-tighter leading-tight">Global <br />Shoutouts.</h2>
                                    <p className="opacity-60 font-medium text-lg max-w-sm italic">Real-time drops and events from the network.</p>
                                </div>
                                <div className="space-y-4">
                                    {shoutouts.map((shout: any) => (
                                        <div key={shout.id} className="bg-[hsl(var(--background))/0.1] backdrop-blur-xl p-6 rounded-[2.5rem] flex items-center gap-6 border border-white/5">
                                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
                                                {shout.type === 'promo' ? '💎' : '✨'}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-60">
                                                    <span>{shout.businesses?.name}</span>
                                                    <span>{new Date(shout.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="font-bold text-sm leading-relaxed">{shout.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* Pros & Businesses Tab */}
                {activeTab === 'pros' && (
                    <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-24">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {pros.map(pro => (
                                <div key={pro.id} className="glass p-8 rounded-[3rem] border border-white/5 hover:border-[hsl(var(--primary))/0.3] transition-all group">
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-2xl font-black text-[hsl(var(--primary))] border border-white/5 group-hover:scale-110 transition-transform shadow-xl">
                                            {pro.full_name?.[0]}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-xl tracking-tight uppercase group-hover:text-[hsl(var(--primary))] transition-colors">{pro.full_name}</h3>
                                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">⭐ {pro.rating || 'Premium Provider'}</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))] font-medium line-clamp-3 mb-8 h-12 italic">{pro.bio || 'No bio provided for this specialized independent professional.'}</p>
                                    <div className="flex gap-3">
                                        <Link href={`/messages?chatWith=${pro.id}`} className="flex-1 py-4 bg-white/5 rounded-2xl font-black text-[9px] uppercase tracking-widest text-center hover:bg-[hsl(var(--primary))] hover:text-black transition-all">Message</Link>
                                        <button className="flex-1 py-4 border border-[hsl(var(--primary))/0.3] rounded-2xl font-black text-[9px] uppercase tracking-widest text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/0.1] transition-all">Hire Now</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Nearby Products Tab */}
                {activeTab === 'products' && (
                    <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-24">
                        <div className="glass p-12 rounded-[4rem] border border-white/5 text-center space-y-8">
                            <h2 className="text-4xl font-black italic tracking-tighter">Nearby <span className="text-[hsl(var(--primary))]">Inventory.</span></h2>
                            <div className="max-w-xl mx-auto flex gap-4">
                                <input
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-8 py-5 text-sm font-bold outline-none focus:border-[hsl(var(--primary))/0.5] transition-all"
                                    placeholder="Search 'Milk', 'Batteries', 'Hardware'..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleSearch}
                                    className="bg-[hsl(var(--primary))] text-black px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition shadow-2xl"
                                >
                                    Scan Hub
                                </button>
                            </div>
                        </div>

                        {(localProducts.length > 0 || localShops.length > 0) && (
                            <div className="space-y-16">
                                {localShops.length > 0 && (
                                    <div className="space-y-8">
                                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] px-4">Local Boutiques Found</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {localShops.map(shop => (
                                                <Link key={shop.id} href={`/shop/${shop.id}`} className="glass p-8 rounded-[3rem] border border-white/5 hover:border-primary/30 transition-all group flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl font-black text-primary border border-white/5 group-hover:scale-110 transition-transform shadow-xl">
                                                        {shop.logo_url ? <img src={shop.logo_url} className="w-full h-full object-cover rounded-2xl" /> : shop.name[0]}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <h4 className="font-black text-lg text-white uppercase tracking-tight truncate group-hover:text-primary transition-colors">{shop.name}</h4>
                                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest truncate">{shop.location || 'Oasis Network'}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {googlePlaces.length > 0 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="flex items-center gap-4 px-4 overflow-hidden relative">
                                            <div className="flex-1 h-[1px] bg-white/5" />
                                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] whitespace-nowrap">External Discoveries (Global Network)</h3>
                                            <div className="flex-1 h-[1px] bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {googlePlaces.map((place: any) => (
                                                <div key={place.place_id} className="glass p-8 rounded-[3rem] border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                                    <div className="absolute top-4 right-4 text-[8px] font-black text-white/10 uppercase tracking-widest border border-white/5 px-2 py-1 rounded-full">External Signal</div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl font-black text-indigo-400 border border-white/5 group-hover:scale-110 transition-transform shadow-xl overflow-hidden">
                                                            {place.image ? <img src={place.image} className="w-full h-full object-cover" /> : '📍'}
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <h4 className="font-black text-lg text-white uppercase tracking-tight truncate group-hover:text-indigo-400 transition-colors">{place.name}</h4>
                                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest truncate">{place.formatted_address}</p>
                                                            {place.rating && <div className="text-[9px] font-black text-emerald-400 mt-1 uppercase tracking-widest">⭐ {place.rating} / Verified</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {localProducts.length === 0 && localShops.length === 0 && googlePlaces.length === 0 && !loading && (
                                    <div className="py-24 text-center space-y-4">
                                        <div className="text-4xl opacity-20 grayscale">📡</div>
                                        <div className="space-y-2">
                                            <p className="font-black text-white uppercase tracking-widest text-[10px] opacity-40">No signals detected within range</p>
                                            <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest italic">Ensure your location services are active or try a broader term.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Radar Map Tab */}
                {activeTab === 'radar' && (
                    <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 mt-24">
                        <div className="glass rounded-[4rem] overflow-hidden border border-white/5 h-[700px] relative shadow-2xl">
                            <RadarMap />
                        </div>
                    </section>
                )}
            </main>

            <footer className="max-w-7xl mx-auto px-8 py-48 border-t border-white/5 grid grid-cols-1 md:grid-cols-4 gap-24 opacity-30 italic font-medium">
                <div className="space-y-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl">🌴</div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white">United Oasis.</h2>
                        <p className="text-sm leading-relaxed">Elevating local independent boutiques into a global discovery engine. Built for the community since 2026.</p>
                    </div>
                </div>
                <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[hsl(var(--primary))]">Network</h4>
                    <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
                        <li><Link href="/discovery">Global Search</Link></li>
                        <li><Link href="/marketplace">The Marketplace</Link></li>
                        <li><Link href="/pros">Pro Services</Link></li>
                    </ul>
                </div>
                <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[hsl(var(--primary))]">Support</h4>
                    <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
                        <li><Link href="/dashboard/orders" className="text-indigo-400">Merchant Portal</Link></li>
                        <li><Link href="/help">Support Center</Link></li>
                        <li><Link href="/terms">Legal Terms</Link></li>
                    </ul>
                </div>
                <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[hsl(var(--primary))]">Social</h4>
                    <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
                        <li><Link href="https://instagram.com">Instagram</Link></li>
                        <li><Link href="https://twitter.com">Twitter</Link></li>
                        <li><Link href="/journal">The Journal</Link></li>
                    </ul>
                </div>
            </footer>
        </div>
    )
}
