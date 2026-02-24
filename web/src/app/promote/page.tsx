'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function Promote() {
    const router = useRouter()
    const [points, setPoints] = useState(0)
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchPoints = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('points')
                .eq('id', user.id)
                .single()

            if (data) setPoints(data.points)
        }
        fetchPoints()
    }, [])

    const handlePromote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setLoading(true)
        try {
            const cost = 100 // Hardcoded cost
            if (points < cost) throw new Error('Insufficient Tokens!')

            const { error } = await supabase.rpc('purchase_promotion', {
                p_details: content,
                p_cost: cost,
                p_duration_hours: 24
            })

            if (error) throw error

            alert('Promotion Active! Your ad is now live.')
            router.push('/dashboard')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl">
                <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Promote Your Business
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Boost your visibility on the Oasis Marketplace.
                </p>

                <div className="bg-gray-700/50 p-4 rounded-lg mb-6 flex justify-between items-center">
                    <span className="text-gray-300">Your Balance</span>
                    <span className="text-xl font-bold text-yellow-500">🪙 {points}</span>
                </div>

                <form onSubmit={handlePromote}>
                    <div className="mb-6">
                        <label className="block text-sm font-bold mb-2 text-gray-300">Ad Content</label>
                        <textarea
                            className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none h-32 resize-none"
                            placeholder="Special Offer: 20% off all Carpentry services this week!"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">Cost: 100 Tokens / 24h</div>
                    </div>

                    <div className="flex gap-4">
                        <Link href="/dashboard" className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold text-center transition">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || points < 100}
                            className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:brightness-110 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Buy Ad (100 🪙)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
