'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Feed from '@/components/Feed'
import CreatePost from '@/components/CreatePost'
import AddProduct from '@/components/AddProduct'
import Link from 'next/link'

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const [stats, setStats] = useState({ points: 0, level: 1 })
    const [role, setRole] = useState('customer')

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth')
                return
            }
            setUser(user)

            // Fetch Stats
            const { data } = await supabase
                .from('profiles')
                .select('points, level')
                .eq('id', user.id)
                .single()

            if (data) setStats(data)
        }
        checkUser()
    }, [])

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Navbar */}
            <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Oasis
                    </h1>
                    <div className="flex gap-4 text-sm">
                        <Link href="/dashboard" className="text-white font-medium">Feed</Link>
                        <Link href="/marketplace" className="text-gray-400 hover:text-white">Marketplace</Link>
                        <Link href="/community" className="text-gray-400 hover:text-white">Community</Link>
                        <Link href="/messages" className="text-gray-400 hover:text-white">Messages</Link>
                        <Link href="/profile" className="text-gray-400 hover:text-white">Profile</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-bold text-yellow-500 flex items-center gap-1">
                            <span>🪙 {stats.points}</span>
                        </div>
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {user.email[0].toUpperCase()}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Left Sidebar: Profile / Nav */}
                <div className="hidden md:block">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-24 text-center">
                        <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                            {user.email[0].toUpperCase()}
                        </div>
                        <h2 className="font-bold text-lg mb-1">{user.user_metadata?.full_name || 'User'}</h2>
                        <p className="text-sm text-gray-400 mb-4">{user.user_metadata?.role || 'Member'}</p>

                        <div className="bg-gray-700/50 rounded-lg p-3 mb-6">
                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Level {stats.level}</div>
                            <div className="w-full bg-gray-600 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full w-[45%]"></div>
                            </div>
                        </div>

                        <Link href="/profile" className="block w-full text-center bg-gray-700 hover:bg-gray-600 py-2 rounded mb-2 text-sm transition">
                            Edit Profile
                        </Link>
                        <Link href="/promote" className="block w-full text-center bg-gradient-to-r from-yellow-600 to-yellow-500 hover:brightness-110 text-white py-2 rounded text-sm transition font-bold">
                            Promote Yourself 🚀
                        </Link>
                    </div>

                    {user.user_metadata?.role === 'business' && (
                        <AddProduct onProductAdded={() => alert('Item added to Marketplace!')} />
                    )}
                </div>

                {/* Center: Feed */}
                <div className="md:col-span-2">
                    <CreatePost onPostCreated={() => setRefreshKey(prev => prev + 1)} />
                    <Feed key={refreshKey} />
                </div>

                {/* Right Sidebar: Suggestions / Ads */}
                <div className="hidden md:block">
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
                        <h3 className="font-bold mb-3 text-sm text-gray-400 uppercase tracking-wider">Suggested Pros</h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                                    <div>
                                        <div className="text-sm font-bold">Pro User {i}</div>
                                        <div className="text-xs text-gray-500">Carpenter</div>
                                    </div>
                                    <button className="ml-auto text-blue-400 text-xs font-bold">Hire</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ad Space */}
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-center h-48 text-gray-600 text-sm">
                        Ad Configuration
                    </div>
                </div>

            </div>
        </div >
    )
}
