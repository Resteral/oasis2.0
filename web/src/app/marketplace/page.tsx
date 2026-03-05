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

    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setLoading(true)
        setLocalProducts([])

        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    id, name, description, price, image_url, category,
                    business:businesses ( id, name, location )
                `)
                .ilike('name', `%${searchQuery}%`)
                .limit(20)

            if (error) throw error
            setLocalProducts(data || [])
            setActiveTab('products')
        } catch (e) {
            console.error(e)
            alert('Failed to search local products')
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
                                className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xl scale-105'
                                        : 'glass text-[hsl(var(--muted-foreground))] hover:text-white'
                                    }`}
                            >
                                <span>{tab.icon}</span>
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

                        {localProducts.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {localProducts.map(product => (
                                    <div key={product.id} className="group bg-[#121215] rounded-[3rem] border border-white/5 p-2 overflow-hidden hover:border-[hsl(var(--primary))/0.3] transition-all">
                                        <div className="aspect-square relative rounded-[2.5rem] overflow-hidden bg-white/5">
                                            {product.image_url ? (
                                                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-5xl opacity-20 grayscale">📦</div>
                                            )}
                                        </div>
                                        <div className="p-8 space-y-6">
                                            <div className="space-y-1">
                                                <h4 className="font-black text-lg text-white uppercase tracking-tight truncate">{product.name}</h4>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xl font-black text-[hsl(var(--primary))] italic">${product.price}</span>
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{product.business?.name}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleOrder(product, false)}
                                                className="w-full py-4 bg-white/5 rounded-2xl font-black text-[9px] uppercase tracking-widest text-white hover:bg-[hsl(var(--primary))] hover:text-black transition-all"
                                            >
                                                Order Delivery
                                            </button>
                                        </div>
                                    </div>
                                ))}
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

            <footer className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 grid grid-cols-1 md:grid-cols-4 gap-16 opacity-30 italic font-medium">
                <div className="space-y-6">
                    <h2 className="text-3xl font-black italic tracking-tighter text-white">Oasis.</h2>
                    <p className="text-sm">Elevating local independent boutiques into a global discovery engine.</p>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))]">Network</h4>
                    <ul className="space-y-2 text-xs"><li>Global Search</li><li>Marketplace</li><li>Pro Services</li></ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))]">Support</h4>
                    <ul className="space-y-2 text-xs"><li>Order Tracking</li><li>Deliveries</li><li>Terms</li></ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))]">Social</h4>
                    <ul className="space-y-2 text-xs"><li>Instagram</li><li>Twitter</li><li>Journal</li></ul>
                </div>
            </footer>
        </div>
    )
}
