'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function MessagesContent() {
    const searchParams = useSearchParams()
    const chatWithParam = searchParams.get('chatWith')

    const [conversations, setConversations] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUser(user)

            const { data: convs } = await supabase
                .from('conversations')
                .select(`
                    id, 
                    last_message, 
                    updated_at,
                    participant_one, 
                    participant_two,
                    p1:participant_one(full_name, avatar_url),
                    p2:participant_two(full_name, avatar_url)
                `)
                .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
                .order('updated_at', { ascending: false })

            setConversations(convs || [])
            setLoading(false)

            if (chatWithParam && convs) {
                const existing = convs.find(c =>
                    (c.participant_one === chatWithParam || c.participant_two === chatWithParam)
                )
                if (existing) {
                    setActiveConversationId(existing.id)
                } else {
                    const { data: newConv } = await supabase
                        .from('conversations')
                        .insert({
                            participant_one: user.id,
                            participant_two: chatWithParam,
                            updated_at: new Date()
                        })
                        .select()
                        .single()

                    if (newConv) {
                        setConversations(prev => [newConv, ...prev])
                        setActiveConversationId(newConv.id)
                    }
                }
            }
        }
        init()
    }, [chatWithParam])

    useEffect(() => {
        if (!activeConversationId) return

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', activeConversationId)
                .order('created_at', { ascending: true })
            setMessages(data || [])
        }
        fetchMessages()

        const channel = supabase
            .channel('messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversationId}` }, (payload) => {
                setMessages(prev => [...prev, payload.new])
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [activeConversationId])

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeConversationId || !currentUser) return

        const tempMsg = {
            id: Math.random(),
            conversation_id: activeConversationId,
            sender_id: currentUser.id,
            content: newMessage,
            created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, tempMsg])
        const msgContent = newMessage
        setNewMessage('')

        const { error } = await supabase.from('messages').insert({
            conversation_id: activeConversationId,
            sender_id: currentUser.id,
            content: msgContent
        })

        if (!error) {
            await supabase.from('conversations')
                .update({ last_message: msgContent, updated_at: new Date() })
                .eq('id', activeConversationId)
        }
    }

    if (loading) return (
        <div className="bg-gray-950 min-h-screen p-8 flex items-center justify-center">
            <div className="text-primary font-black animate-pulse uppercase tracking-[0.4em] italic text-sm">Opening Secure Comm-Link...</div>
        </div>
    )

    return (
        <div className="h-screen bg-gray-950 text-white flex overflow-hidden">
            {/* Sidebar List */}
            <div className="w-full md:w-96 border-r border-gray-900 flex flex-col glass relative z-20">
                <div className="p-8 border-b border-gray-900 space-y-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Secure <span className="text-primary">Comms</span></h1>
                        <Link href="/my-oasis" className="text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">
                            Close →
                        </Link>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {conversations.length > 0 ? conversations.map(c => {
                        const otherUser = c.participant_one === currentUser?.id ? c.p2 : c.p1
                        const name = otherUser?.full_name || 'Signal Node'
                        const avatar = otherUser?.avatar_url
                        const isActive = activeConversationId === c.id

                        return (
                            <div
                                key={c.id}
                                onClick={() => setActiveConversationId(c.id)}
                                className={`p-8 border-b border-gray-900/50 cursor-pointer transition-all relative group ${isActive ? 'bg-primary/5' : 'hover:bg-white/5'}`}
                            >
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(229,180,80,0.5)]" />}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-900 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-800 group-hover:border-primary/30 transition-all">
                                        {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full font-black italic">{name[0]}</div>}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <h4 className="font-black italic uppercase tracking-tight text-sm truncate group-hover:text-primary transition-colors">{name}</h4>
                                        <p className="text-[10px] font-medium text-gray-500 truncate mt-1 italic opacity-60">
                                            {c.last_message ? `"${c.last_message}"` : 'Awaiting handshake...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="p-12 text-center opacity-20 italic font-black text-[9px] uppercase tracking-widest">
                            No active comm-links established
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-950 relative">
                <div className="absolute inset-0 bg-primary/2 opacity-[0.02] pointer-events-none" />

                {activeConversationId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-8 border-b border-gray-900/50 flex items-center justify-between glass z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 italic">Encrypted Connection Established</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
                            {messages.map((m: any) => {
                                const isMe = m.sender_id === currentUser?.id
                                return (
                                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                        <div className={`max-w-[80%] space-y-2`}>
                                            <div className={`px-8 py-5 rounded-[2.5rem] text-sm font-medium leading-relaxed italic shadow-2xl ${isMe
                                                    ? 'bg-primary text-black rounded-br-none'
                                                    : 'bg-gray-900/60 backdrop-blur-xl border border-gray-800 text-gray-200 rounded-bl-none'
                                                }`}>
                                                "{m.content}"
                                            </div>
                                            <div className={`text-[8px] font-black uppercase tracking-widest opacity-30 ${isMe ? 'text-right mr-4' : 'text-left ml-4'}`}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="p-8 glass border-t border-gray-900/50 z-10">
                            <div className="relative group">
                                <input
                                    className="w-full bg-gray-900/40 border border-gray-800 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 rounded-[2rem] px-8 py-5 text-sm font-medium transition-all placeholder:text-gray-700 italic"
                                    placeholder="Transmit response..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                />
                                <button
                                    onClick={sendMessage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary hover:bg-white text-black px-8 py-2.5 rounded-full font-black text-[9px] uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
                                >
                                    Transmit
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-6">
                        <div className="w-24 h-24 bg-gray-900/50 rounded-[2rem] border border-gray-800 flex items-center justify-center text-4xl opacity-20">
                            📡
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-gray-600 font-black text-[10px] uppercase tracking-[0.4em] italic">Comm-Link Standby</p>
                            <p className="text-gray-700 font-bold text-[8px] uppercase tracking-[0.2em]">Select a network node to initiate transmission</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="bg-gray-950 min-h-screen p-8 flex items-center justify-center">
                <div className="text-primary font-black animate-pulse uppercase tracking-[0.4em] italic text-sm">Opening Secure Comm-Link...</div>
            </div>
        }>
            <MessagesContent />
        </Suspense>
    )
}
