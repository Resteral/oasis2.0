"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ChatInterface from '@/components/ChatInterface';

export default function MerchantMessagesPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConv, setSelectedConv] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [business, setBusiness] = useState<any>(null);

    useEffect(() => {
        const loadMerchantInbox = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch which business this user manages
            const { data: bus } = await supabase
                .from('businesses')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (bus) {
                setBusiness(bus);
                // 2. Fetch conversations for this business
                const { data: convs } = await supabase
                    .from('conversations')
                    .select('*, profiles:customer_id(full_name, email)')
                    .eq('business_id', bus.id)
                    .order('updated_at', { ascending: false });

                if (convs) setConversations(convs);
            }
            setLoading(false);
        };
        loadMerchantInbox();
    }, []);

    if (loading) return (
        <div className="p-12 flex justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 md:p-12 space-y-12">
            <header className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-widest">Merchant Support Hub</span>
                </div>
                <h1 className="text-5xl font-black italic tracking-tighter text-gray-900 leading-tight">Customer <span className="text-indigo-600">Messages.</span></h1>
                <p className="text-gray-400 font-medium max-w-md italic">Direct engagement with your shoppers. Close more sales through premium customer care.</p>
            </header>

            <main className="grid grid-cols-1 gap-4">
                {conversations.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-6 bg-gray-50 rounded-[3rem] border border-gray-100 text-center">
                        <span className="text-5xl grayscale opacity-20 bg-white p-6 rounded-full shadow-sm">📬</span>
                        <div className="space-y-2">
                            <p className="font-bold text-xl text-gray-900 italic">No messages yet.</p>
                            <p className="text-sm text-gray-400">Customer inquiries will appear here as soon as they reach out.</p>
                        </div>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => setSelectedConv(conv)}
                            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex items-center gap-6 group text-left w-full"
                        >
                            <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-2xl font-black italic text-indigo-600 border border-gray-100 group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
                                {conv.profiles?.full_name?.[0] || 'U'}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-lg text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{conv.profiles?.full_name || 'Anonymous User'}</h3>
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{new Date(conv.updated_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-400 text-sm font-medium line-clamp-1 italic">"{conv.last_message || 'New customer inquiry...'}"</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                →
                            </div>
                        </button>
                    ))
                )}
            </main>

            {selectedConv && (
                <ChatInterface
                    customerId={selectedConv.customer_id}
                    businessId={business.id}
                    senderId={business.owner_id} // Merchant sends as boutique owner profile
                    businessName={business.name}
                    onClose={() => setSelectedConv(null)}
                />
            )}
        </div>
    );
}
