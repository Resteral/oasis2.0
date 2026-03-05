'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ForumsList() {
    const [forums, setForums] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchForums = async () => {
            const { data } = await supabase
                .from('forums')
                .select('*')
                .order('created_at', { ascending: false })
            setForums(data || [])
            setLoading(false)
        }
        fetchForums()
    }, [])

    if (loading) return (
        <div className="bg-gray-950 min-h-screen p-8 flex items-center justify-center">
            <div className="text-primary font-black animate-pulse uppercase tracking-[0.4em] italic text-sm">Accessing Network Topics...</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 lg:p-12 pb-32">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(229,180,80,0.5)]"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70 italic">Specialized Nodes</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter">
                            Community <span className="text-primary italic">Forums</span>
                        </h1>
                    </div>
                    <Link href="/community/forums/create" className="bg-primary hover:bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/10">
                        + Initialize Topic
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {forums.map(forum => (
                        <Link key={forum.id} href={`/community/forums/${forum.id}`} className="group">
                            <div className="bg-gray-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-gray-800 shadow-2xl hover:border-primary/20 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden h-full flex flex-col">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <div className="text-8xl font-black italic">#</div>
                                </div>

                                <div className="flex items-center gap-6 mb-8 relative z-10">
                                    <div className="w-16 h-16 bg-gray-800 rounded-[1.5rem] flex items-center justify-center text-3xl overflow-hidden border border-gray-700 group-hover:bg-primary group-hover:text-black transition-colors duration-500">
                                        {forum.icon || '💬'}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-primary transition-colors">{forum.title}</h2>
                                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">
                                            EST. {new Date(forum.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-400 font-medium leading-relaxed line-clamp-3 mb-8 flex-1 relative z-10 italic">
                                    "{forum.description}"
                                </p>

                                <div className="pt-8 border-t border-gray-800/50 flex justify-between items-center relative z-10">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-primary transition-colors">Enter Network Segment →</span>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[8px] font-bold">👤</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {forums.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-gray-900/20 rounded-[3rem] border-2 border-dashed border-gray-800/50">
                            <p className="text-gray-600 font-black text-[10px] uppercase tracking-widest italic mb-2">No active forums detected in this sector</p>
                            <p className="text-gray-700 font-bold text-[8px] uppercase tracking-[0.4em]">Initialize a new node to begin engagement</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
