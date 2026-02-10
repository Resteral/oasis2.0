'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Feed from '@/components/Feed'
import CreatePost from '@/components/CreatePost'
import Link from 'next/link'

export default function SingleForumPage({ params }: { params: { id: string } }) {
    const [forum, setForum] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        const fetchForum = async () => {
            const { data } = await supabase
                .from('forums')
                .select('*')
                .eq('id', params.id)
                .single()
            setForum(data)
            setLoading(false)
        }
        fetchForum()
    }, [params.id])

    if (loading) return <div className="text-center p-8 text-gray-500">Loading Forum...</div>
    if (!forum) return <div className="text-center p-8 text-gray-500">Forum not found.</div>

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <Link href="/community/forums" className="text-gray-400 hover:text-white mb-4 block">
                    ← Back to Forums
                </Link>

                <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-8 rounded-xl border border-blue-500/30 mb-8 flex items-center gap-6">
                    <div className="text-6xl">{forum.icon}</div>
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{forum.title}</h1>
                        <p className="text-gray-300 text-lg">{forum.description}</p>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <CreatePost onPostCreated={() => setRefreshKey(prev => prev + 1)} />
                    <Feed key={refreshKey} forumId={forum.id} />
                </div>
            </div>
        </div>
    )
}
