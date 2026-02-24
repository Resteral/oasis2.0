'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'
import CommentsSection from '@/components/CommentsSection'

interface Post {
    id: string
    content: string
    image_url: string
    likes_count: number
    comments_count: number
    created_at: string
    user_id: string
    profiles: {
        full_name: string
        avatar_url: string
        role: string
    }
}

export default function CommunityPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [newPost, setNewPost] = useState('')
    const [expandedPost, setExpandedPost] = useState<string | null>(null)

    const toggleComments = (id: string) => {
        setExpandedPost(expandedPost === id ? null : id)
    }

    const fetchPosts = async () => {
        const { data } = await supabase
            .from('posts')
            .select('*, profiles(full_name, avatar_url, role)')
            .order('created_at', { ascending: false })
            .limit(50)

        // @ts-ignore
        setPosts(data || [])
        setLoading(false)
    }

    const handlePost = async () => {
        if (!newPost.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return alert('Please login to post')

        const { error } = await supabase.from('posts').insert({
            user_id: user.id,
            content: newPost
        })

        if (error) {
            alert(error.message)
        } else {
            setNewPost('')
            fetchPosts()
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [])

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        Oasis Discussions 💬
                    </h1>
                    <div className="flex gap-4">
                        <Link href="/community/forums" className="text-blue-400 hover:text-white font-bold bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-500/30">
                            Or Explore Forums →
                        </Link>
                        <Link href="/dashboard" className="text-gray-400 hover:text-white self-center">Dashboard</Link>
                    </div>
                </div>

                {/* Create Post */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-8">
                    <textarea
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white mb-2"
                        placeholder="What's happening in your area?"
                        rows={3}
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handlePost}
                            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-bold transition"
                        >
                            Post
                        </button>
                    </div>
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="text-center text-gray-400">Loading discussion...</div>
                ) : (
                    <div className="space-y-6">
                        {posts.map(post => (
                            <div key={post.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0 border border-gray-600">
                                        {post.profiles?.avatar_url ? (
                                            <img src={post.profiles.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                                        ) : (
                                            post.profiles?.full_name?.[0] || '?'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">
                                            {post.profiles?.full_name || 'Anonymous'}
                                            {post.profiles?.role === 'business' && <span className="ml-2 text-xs bg-yellow-500 text-black px-1 rounded">BIZ</span>}
                                        </h3>
                                        <div className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <p className="text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>

                                {post.image_url && (
                                    <div className="mb-4 rounded-lg overflow-hidden">
                                        <img src={post.image_url} className="w-full max-h-96 object-cover" />
                                    </div>
                                )}

                                <div className="flex gap-6 border-t border-gray-700 pt-4 text-gray-400 text-sm mb-2">
                                    <button className="hover:text-pink-500 transition flex items-center gap-1">
                                        ❤️ {post.likes_count}
                                    </button>
                                    <button
                                        className="hover:text-blue-500 transition flex items-center gap-1"
                                        onClick={() => toggleComments(post.id)}
                                    >
                                        💬 {post.comments_count} Comments
                                    </button>
                                </div>

                                {/* Comments Section */}
                                {expandedPost === post.id && (
                                    <CommentsSection postId={post.id} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
