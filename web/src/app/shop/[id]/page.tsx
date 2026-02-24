'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ShopPage({ params }: { params: { id: string } }) {
    const [profile, setProfile] = useState<any>(null)
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!params?.id) return

            // 1. Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', params.id)
                .single()

            setProfile(profileData)

            if (profileData) {
                // 2. Fetch Products
                const { data: productsData } = await supabase
                    .from('products')
                    .select('*')
                    .eq('seller_id', profileData.id)
                    .eq('is_available', true)
                setProducts(productsData || [])
            }
            setLoading(false)
        }
        fetchData()
    }, [params.id])

    const handleOrder = async (product: any) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return alert('Please login to order')

        if (confirm(`Order ${product.name} for $${product.price}?`)) {
            const { error } = await supabase.from('orders').insert({
                user_id: user.id,
                product_name: product.name,
                store_name: profile.full_name,
                store_address: profile.business_address,
                store_location: null, // Can add if profile has location
                delivery_address: 'User Address', // Placeholder
                price: product.price,
                quantity: 1,
                status: 'pending'
            })

            if (error) {
                console.error(error)
                alert('Error placing order: ' + error.message)
            } else {
                alert('Order placed successfully! 🚚')
            }
        }
    }

    if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">Loading Shop...</div>
    if (!profile) return <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">Shop not found!</div>

    // Myspace Theme Application
    const theme = profile.theme_settings || {}
    const bgStyle = theme.bg_image
        ? { backgroundImage: `url(${theme.bg_image})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }
        : { backgroundColor: theme.bg_color || '#111827' }
    const textStyle = { color: theme.text_color || '#ffffff' }
    const cardStyle = {
        backgroundColor: theme.bg_color ? 'rgba(0,0,0,0.6)' : '#1f2937',
        borderColor: theme.text_color ? `${theme.text_color}40` : '#374151',
        color: theme.text_color || '#ffffff'
    }

    return (
        <div className="min-h-screen" style={bgStyle}>
            {/* Nav Home */}
            <Link href="/dashboard" className="fixed top-4 left-4 z-50 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20 transition flex items-center gap-2">
                <span>🏠</span> <span className="font-bold">Oasis</span>
            </Link>

            <div className="max-w-5xl mx-auto p-4 md:p-8 pt-20">
                {/* Profile Header */}
                <div className="backdrop-blur-md p-8 rounded-2xl border mb-8" style={cardStyle}>
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 flex-shrink-0">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-4xl">{profile.full_name[0]}</div>
                            )}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-4xl font-bold mb-2" style={textStyle}>{profile.full_name}</h1>
                            <p className="opacity-80 mb-4 text-lg">{profile.bio || 'Welcome to my page.'}</p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <Link
                                    href={`/messages?chatWith=${profile.id}`}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition"
                                >
                                    Message
                                </Link>

                                {profile.phone_number && (
                                    <a
                                        href={`tel:${profile.phone_number}`}
                                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-full font-bold transition flex items-center gap-2"
                                    >
                                        📞 Call Now
                                    </a>
                                )}

                                <button className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full font-bold transition" style={textStyle}>
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Col: Details */}
                    <div className="space-y-6">
                        <div className="backdrop-blur-md p-6 rounded-xl border" style={cardStyle}>
                            <h3 className="font-bold mb-4 border-b border-white/10 pb-2">About</h3>
                            <div className="space-y-2 text-sm opacity-80">
                                {profile.business_address && <p>📍 {profile.business_address}</p>}
                                <p>⭐ {profile.rating || 'New Member'}</p>
                                <p>Joined: {new Date(profile.created_at || Date.now()).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {profile.skills && (
                            <div className="backdrop-blur-md p-6 rounded-xl border" style={cardStyle}>
                                <h3 className="font-bold mb-4 border-b border-white/10 pb-2">Interests</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((s: string) => (
                                        <span key={s} className="bg-white/10 px-2 py-1 rounded text-xs">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Inventory */}
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-6" style={textStyle}>Inventory / Posts</h2>

                        {products.length === 0 ? (
                            <div className="backdrop-blur-md p-12 rounded-xl border text-center opacity-70" style={cardStyle}>
                                Empty inventory.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {products.map(product => (
                                    <div key={product.id} className="backdrop-blur-md rounded-xl overflow-hidden border group" style={cardStyle}>
                                        <div className="aspect-video bg-black/20 relative overflow-hidden">
                                            {product.image_url ? (
                                                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-4xl">📦</div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold truncate">{product.name}</h3>
                                                <span className="font-bold text-green-400">${product.price}</span>
                                            </div>
                                            <p className="text-sm opacity-70 line-clamp-2 mb-4">{product.description}</p>
                                            <button
                                                onClick={() => handleOrder(product)}
                                                className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white py-2 rounded font-bold transition text-sm"
                                            >
                                                Order Now
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
