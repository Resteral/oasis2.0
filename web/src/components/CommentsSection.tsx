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
        if (!user) return alert('Login required to engage')

        const { error } = await supabase.from('comments').insert({
            post_id: postId,
            user_id: user.id,
            content: newComment
        })

        if (!error) {
            setNewComment('')
            fetchComments()
        }
    }

    useEffect(() => {
        fetchComments()
    }, [postId])

    if (loading) return (
        <div className="flex items-center gap-2 py-4 opacity-30 italic font-black text-[9px] uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            Syncing Feedback...
        </div>
    )

    return (
        <div className="mt-8 pt-8 border-t border-gray-800/30">
            <div className="space-y-6 mb-8">
                {comments.length > 0 ? comments.map(c => (
                    <div key={c.id} className="flex gap-4 group">
                        <div className="w-8 h-8 bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 border border-gray-700/50 group-hover:border-primary/30 transition-all shadow-lg">
                            {c.profiles?.avatar_url ? (
                                <img src={c.profiles.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-[10px] font-black">{c.profiles?.full_name?.[0]}</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-black italic uppercase tracking-tighter text-xs text-white">
                                    {c.profiles?.full_name || 'Network Node'}
                                </span>
                                <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">
                                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed italic">
                                "{c.content}"
                            </p>
                        </div>
                    </div>
                )) : (
                    <div className="py-4 text-center opacity-20 italic font-black text-[9px] uppercase tracking-widest">
                        Awaiting social engagement
                    </div>
                )}
            </div>

            <div className="relative group">
                <input
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 rounded-2xl px-5 py-3 text-sm font-medium transition-all placeholder:text-gray-700"
                    placeholder="Contribute to the discussion..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                />
                <button
                    onClick={handleComment}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5"
                >
                    Submit
                </button>
            </div>
        </div>
    )
}
