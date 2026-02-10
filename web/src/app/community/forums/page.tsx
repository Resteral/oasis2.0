'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ForumsList() {
    const [forums, setForums] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchForums = async () => {
            const { data } = await supabase
                .from('forums')
                .select('*')
                .order('created_at', { ascending: false })
            setForums(data || [])
            setLoading(false)
        }
        fetchForums()
    }, [])

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Forums...</div>

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Community Forums 💬</h1>
                        <p className="text-gray-400">Join the discussion in specialized topics.</p>
                    </div>
                    <Link href="/community/forums/create" className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold transition">
                        + Create Forum
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {forums.map(forum => (
                        <Link key={forum.id} href={`/community/forums/${forum.id}`}>
                            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition cursor-pointer group">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="text-4xl group-hover:scale-110 transition">{forum.icon || '💬'}</div>
                                    <div>
                                        <h2 className="text-xl font-bold group-hover:text-blue-400 transition">{forum.title}</h2>
                                        <p className="text-sm text-gray-400">{new Date(forum.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p className="text-gray-300 line-clamp-2">{forum.description}</p>
                            </div>
                        </Link>
                    ))}
                    {forums.length === 0 && (
                        <div className="col-span-2 text-center py-12 border border-dashed border-gray-700 rounded-xl bg-gray-800/50">
                            No forums yet. Be the first to start a topic!
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
