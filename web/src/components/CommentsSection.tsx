import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function CommentsSection({ postId }: { postId: string }) {
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)

    const fetchComments = async () => {
        const { data } = await supabase
            .from('comments')
            .select('*, profiles(full_name, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        setComments(data || [])
        setLoading(false)
    }

    const handleComment = async () => {
        if (!newComment.trim()) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return alert('Login required')

        const { error } = await supabase.from('comments').insert({
            post_id: postId,
            user_id: user.id,
            content: newComment
        })

        if (!error) {
            setNewComment('')
            fetchComments()
            // Increment comment count locally or refetch post
        }
    }

    useEffect(() => {
        fetchComments()
    }, [postId])

    if (loading) return <div className="text-xs text-gray-500">Loading comments...</div>

    return (
        <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="space-y-3 mb-4">
                {comments.map(c => (
                    <div key={c.id} className="flex gap-2 text-sm">
                        <Link href={`/shop/${c.user_id}`} className="block flex-shrink-0">
                            <div className="w-6 h-6 bg-gray-600 rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition">
                                {c.profiles?.avatar_url ? (
                                    <img src={c.profiles.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[10px]">{c.profiles?.full_name?.[0]}</div>
                                )}
                            </div>
                        </Link>
                        <div className="bg-gray-700/50 rounded-lg px-3 py-1 flex-1">
                            <Link href={`/shop/${c.user_id}`} className="font-bold text-gray-300 mr-2 hover:underline">
                                {c.profiles?.full_name}
                            </Link>
                            <span className="text-gray-400">{c.content}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-1 text-sm"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                />
                <button onClick={handleComment} className="text-blue-400 text-sm font-bold">Send</button>
            </div>
        </div>
    )
}
