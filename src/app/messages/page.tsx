"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ChatInterface from '@/components/ChatInterface';

export default function MessagesPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedConv, setSelectedConv] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInbox = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            setCurrentUser(user);

            const res = await fetch(`/api/messages?userId=${user.id}`);
            const data = await res.json();
            if (data.success) setConversations(data.conversations);
            setLoading(false);
        };
        loadInbox();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!currentUser) return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-8 text-center">
            <div className="space-y-6">
                <span className="text-6xl">🔐</span>
                <h1 className="text-4xl font-black italic text-white tracking-tighter">Secure Your Oasis.</h1>
                <p className="text-indigo-200/40 font-medium">Please sign in to access your global conversations.</p>
                <Link href="/login" className="inline-block px-10 py-4 bg-indigo-600 text-white rounded-full font-black text-lg shadow-xl">Sign In →</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white pt-32 pb-48 px-8">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Personal Inbox</span>
                    </div>
                    <h1 className="text-6xl font-black italic tracking-tighter leading-none">Your <span className="text-indigo-500">Conversations.</span></h1>
                    <p className="text-indigo-200/40 font-medium max-w-md italic">Persistent connections with your favorite independent boutiques and creators.</p>
                </header>

                <main className="space-y-4">
                    {conversations.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-6 bg-white/5 rounded-[3rem] border border-white/5 text-center">
                            <span className="text-5xl grayscale opacity-20">🕊️</span>
                            <div className="space-y-2">
                                <p className="font-bold text-xl">The Oasis is quiet.</p>
                                <p className="text-sm text-white/30">Start a chat with any boutique to see it here.</p>
                            </div>
                            <Link href="/marketplace" className="px-8 py-3 bg-white/10 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">Explore Marketplace</Link>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConv(conv)}
                                className="w-full bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all flex items-center gap-8 group text-left"
                            >
                                <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-2xl font-black italic text-indigo-600 border border-white/5 group-hover:scale-110 transition-transform shadow-2xl">
                                    {conv.businesses?.name[0]}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-black text-xl group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{conv.businesses?.name}</h3>
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{new Date(conv.updated_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-indigo-100/40 text-sm font-medium line-clamp-1 italic">"{conv.last_message || 'New conversation started...'}"</p>
                                </div>
                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:text-indigo-400 group-hover:border-indigo-400/30 transition-all">
                                    →
                                </div>
                            </button>
                        ))
                    )}
                </main>
            </div>

            {selectedConv && (
                <ChatInterface
                    customerId={currentUser.id}
                    businessId={selectedConv.business_id}
                    senderId={currentUser.id}
                    businessName={selectedConv.businesses?.name}
                    onClose={() => setSelectedConv(null)}
                />
            )}
        </div>
    );
}
