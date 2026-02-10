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

    // Load User & Conversations
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUser(user)

            // Fetch conversations
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

            // Check if we need to start a new chat via URL
            if (chatWithParam && convs) {
                const existing = convs.find(c =>
                    (c.participant_one === chatWithParam || c.participant_two === chatWithParam)
                )
                if (existing) {
                    setActiveConversationId(existing.id)
                } else {
                    // Create new conversation
                    const { data: newConv, error } = await supabase
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
                    } else if (error) {
                        // Likely duplicate key due to race condition or unique constraint, retry fetch
                        console.error("Error creating chat:", error)
                    }
                }
            }
        }
        init()
    }, [chatWithParam])

    // Load Messages for Active Chat
    useEffect(() => {
        if (!activeConversationId) return

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', activeConversationId)
                .order('created_at', { ascending: true })
            setMessages(data || [])

            // Mark read (optional later)
        }
        fetchMessages()

        // Realtime subscription could go here
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

        // Optimistic update
        const tempMsg = {
            id: Date.now(),
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
            // Update conversation last_message
            await supabase.from('conversations')
                .update({ last_message: msgContent, updated_at: new Date() })
                .eq('id', activeConversationId)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Chats...</div>

    return (
        <div className="min-h-screen bg-gray-900 text-white flex">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h1 className="text-xl font-bold">Messages</h1>
                    <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
                        ← Dashboard
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(c => {
                        // Determine other user
                        const otherUser = c.participant_one === currentUser?.id ? c.p2 : c.p1
                        // Fix for weird join structure if user data is missing
                        const name = otherUser?.full_name || 'Unknown User'
                        const avatar = otherUser?.avatar_url

                        return (
                            <div
                                key={c.id}
                                onClick={() => setActiveConversationId(c.id)}
                                className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition ${activeConversationId === c.id ? 'bg-gray-800' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                                        {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full">{name[0]}</div>}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold truncate">{name}</h4>
                                        <p className="text-sm text-gray-400 truncate">{c.last_message || 'Start a conversation'}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-black/20">
                {activeConversationId ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((m: any) => {
                                const isMe = m.sender_id === currentUser?.id
                                return (
                                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2 rounded-xl ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
                            <input
                                className="flex-1 bg-gray-900 rounded p-3 outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            />
                            <button onClick={sendMessage} className="bg-blue-600 px-6 rounded font-bold hover:bg-blue-500">Send</button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center flex-1 text-gray-500">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>
        </div>
    )
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Messages...</div>}>
            <MessagesContent />
        </Suspense>
    )
}
