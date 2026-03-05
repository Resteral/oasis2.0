"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ChatInterfaceProps {
    customerId: string;
    businessId: string;
    senderId: string;
    businessName: string;
    onClose: () => void;
}

export default function ChatInterface({ customerId, businessId, senderId, businessName, onClose }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadHistory() {
            setLoading(true);
            // 1. Get or Create Conversation and fetch messages
            const res = await fetch(`/api/messages?userId=${customerId}`);
            const data = await res.json();

            const conv = data.conversations?.find((c: any) => c.business_id === businessId);
            if (conv) {
                setConversationId(conv.id);
                const msgRes = await fetch(`/api/messages?conversationId=${conv.id}`);
                const msgData = await msgRes.json();
                if (msgData.success) setMessages(msgData.messages);
            }
            setLoading(false);
        }
        loadHistory();
    }, [customerId, businessId]);

    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`conv-${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                setMessages((prev) => {
                    if (prev.find(m => m.id === payload.new.id)) return prev;
                    return [...prev, payload.new];
                });
            })
            .subscribe();

        return () => { channel.unsubscribe(); };
    }, [conversationId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        const res = await fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({
                customerId,
                businessId,
                senderId,
                content
            })
        });
        const data = await res.json();
        if (data.success) {
            setContent('');
            if (!conversationId) setConversationId(data.conversationId);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border border-gray-100">
                {/* Chat Header */}
                <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-indigo-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-black italic text-indigo-600 border border-gray-100 shadow-sm">
                            {businessName[0]}
                        </div>
                        <div>
                            <h3 className="font-black text-lg text-gray-900 leading-tight">{businessName}</h3>
                            <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Active Support</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-sm">✕</button>
                </header>

                {/* Messages Body */}
                <div className="h-[400px] md:h-[500px] overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Encrypting Connection...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 text-center px-12">
                            <span className="text-4xl grayscale opacity-20 bg-indigo-50 p-6 rounded-full">💬</span>
                            <p className="font-bold text-sm leading-relaxed italic text-gray-500">Ask {businessName} about their treasures, delivery, or custom orders.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMine = msg.sender_id === senderId;
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} gap-1.5`}>
                                    <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${isMine
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-gray-100 text-gray-900 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[8px] font-black uppercase text-gray-300 tracking-widest px-2">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Chat Footer Input */}
                <footer className="p-8 bg-gray-50/50 border-t border-gray-100">
                    <form onSubmit={handleSendMessage} className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-1 bg-white border border-gray-100 px-6 py-4 rounded-full text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-gray-300 shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={!content.trim()}
                            className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            🚀
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
}
