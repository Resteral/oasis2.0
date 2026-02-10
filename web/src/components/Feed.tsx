'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import CommentsSection from './CommentsSection'

interface Post {
    id: string
    content: string
    image_url?: string
    video_url?: string
    created_at: string
    likes_count: number
    is_promoted: boolean
    user_id: string
    forum_id?: string
    profiles: {
        full_name: string
        avatar_url: string | null
        role: string
    }
}

interface FeedProps {
    key?: number
    forumId?: string
}

export default function Feed({ key, forumId }: FeedProps) {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPosts = async () => {
        try {
            let query = supabase
                .from('posts')
                .select(`
          *,
          profiles (full_name, avatar_url, role)
        `)
                .order('created_at', { ascending: false })

            if (forumId) {
                query = query.eq('forum_id', forumId)
            }

            const { data, error } = await query

            if (error) throw error
            setPosts(data || [])
        } catch (err) {
            console.error('Error fetching posts:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [key, forumId])

    const handleLike = async (postId: string, currentLikes: number) => {
        try {
            const { error } = await supabase
                .from('posts')
                .update({ likes_count: currentLikes + 1 })
                .eq('id', postId)

            if (error) throw error
            // Optimistic update
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
            ))
        } catch (err) {
            console.error('Error liking:', err)
        }
    }

    const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null)

    const toggleComments = (postId: string) => {
        if (activeCommentPost === postId) setActiveCommentPost(null)
        else setActiveCommentPost(postId)
    }

    if (loading) return <div className="text-center text-gray-500 py-10">Loading feed...</div>

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <div key={post.id} className={`bg-gray-800 p-5 rounded-xl border ${post.is_promoted ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-gray-700'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <Link href={`/shop/${post.user_id}`} className="block flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                                {post.profiles?.avatar_url ? (
                                    <img src={post.profiles.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    post.profiles?.full_name?.[0] || '?'
                                )}
                            </div>
                        </Link>
                        <div>
                            <Link href={`/shop/${post.user_id}`} className="hover:underline">
                                <h3 className="font-bold flex items-center gap-2">
                                    {post.profiles?.full_name || 'Anonymous'}
                                    {post.profiles?.role === 'provider' && (
                                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">Pro</span>
                                    )}
                                </h3>
                            </Link>
                            <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                        {post.is_promoted && (
                            <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded border border-yellow-500/30 font-bold uppercase tracking-wider">
                                Promoted
                            </span>
                        )}
                    </div>

                    <p className="text-gray-200 mb-4 whitespace-pre-wrap">{post.content}</p>

                    {post.image_url && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-gray-700">
                            <img src={post.image_url} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" />
                        </div>
                    )}

                    {post.video_url && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-gray-700 aspect-video bg-black">
                            <video src={post.video_url} controls className="w-full h-full" />
                        </div>
                    )}

                    <div className="flex gap-4 border-t border-gray-700 pt-3 text-sm text-gray-400">
                        <button
                            onClick={() => handleLike(post.id, post.likes_count)}
                            className="hover:text-red-400 transition flex items-center gap-1 group"
                        >
                            <span className="group-hover:scale-125 transition">❤️</span> {post.likes_count}
                        </button>
                        <button
                            onClick={() => toggleComments(post.id)}
                            className="hover:text-blue-400 transition"
                        >
                            💬 Comment
                        </button>
                        <button className="ml-auto hover:text-yellow-400 transition">
                            🔥 Boost Post
                        </button>
                    </div>

                    {/* Comments Section */}
                    {activeCommentPost === post.id && (
                        <CommentsSection postId={post.id} />
                    )}
                </div>
            ))}
            {posts.length === 0 && (
                <div className="text-center text-gray-500 py-10 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                    No posts yet in this feed.
                </div>
            )}
        </div>
    )
}
