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
        <div className="min-h-screen bg-gray-950 text-white p-6 lg:p-12 pb-32">
            <div className="max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(229,180,80,0.5)]"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70 italic">Live Feed</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter">
                            Oasis <span className="text-primary italic">Discussions</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/community/forums" className="bg-white/5 border border-white/10 hover:border-primary/30 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all glass">
                            Explore Forums
                        </Link>
                        <Link href="/dashboard" className="bg-primary hover:bg-white text-black px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Dashboard
                        </Link>
                    </div>
                </div>

                {/* Create Post */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-[2.5rem] p-8 mb-12 shadow-2xl">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-800 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-bold border border-gray-700">
                            💬
                        </div>
                        <div className="flex-1">
                            <textarea
                                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-600 resize-none text-lg font-medium"
                                placeholder="Broadcast to the Oasis network..."
                                rows={3}
                                value={newPost}
                                onChange={e => setNewPost(e.target.value)}
                            />
                            <div className="flex justify-between items-center pt-4 border-t border-gray-800/50">
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-gray-800 rounded-xl transition-colors opacity-40 hover:opacity-100">🖼️</button>
                                    <button className="p-2 hover:bg-gray-800 rounded-xl transition-colors opacity-40 hover:opacity-100">📍</button>
                                </div>
                                <button
                                    onClick={handlePost}
                                    className="bg-primary hover:scale-[1.02] active:scale-[0.98] text-black px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
                                >
                                    Transmit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="text-primary font-black animate-pulse uppercase tracking-[0.4em] italic text-sm">Syncing with network...</div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {posts.map(post => (
                            <div key={post.id} className="bg-gray-900/40 backdrop-blur-lg border border-gray-800/60 rounded-[3rem] p-10 hover:border-primary/20 transition-all group shadow-xl">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center font-bold text-xl overflow-hidden flex-shrink-0 border border-gray-700 group-hover:border-primary/30 transition-all">
                                        {post.profiles?.avatar_url ? (
                                            <img src={post.profiles.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                                        ) : (
                                            post.profiles?.full_name?.[0] || '?'
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black italic uppercase tracking-tight text-lg">
                                                {post.profiles?.full_name || 'Anonymous Explorer'}
                                            </h3>
                                            {post.profiles?.role === 'business' && (
                                                <span className="bg-primary text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic tracking-tighter shadow-lg shadow-primary/20">Authorized Merchant</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-300 text-lg font-medium mb-8 leading-relaxed whitespace-pre-wrap break-words italic">
                                    "{post.content}"
                                </p>

                                {post.image_url && (
                                    <div className="mb-8 rounded-[2rem] overflow-hidden border border-gray-800 shadow-2xl">
                                        <img src={post.image_url} className="w-full max-h-[500px] object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                )}

                                <div className="flex gap-8 border-t border-gray-800/40 pt-8 mt-12 mx-2">
                                    <button className="hover:text-primary transition flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-lg">❤️</span> {post.likes_count} Likes
                                    </button>
                                    <button
                                        className="hover:text-primary transition flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => toggleComments(post.id)}
                                    >
                                        <span className="text-lg">💬</span> {post.comments_count} Feedback
                                    </button>
                                </div>

                                {/* Comments Section */}
                                {expandedPost === post.id && (
                                    <div className="mt-8 pt-8 border-t border-gray-800/20">
                                        <CommentsSection postId={post.id} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
