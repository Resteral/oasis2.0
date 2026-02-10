'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function CreateForum() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState('💬')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Login required')

            const { error } = await supabase
                .from('forums')
                .insert({
                    creator_id: user.id,
                    title,
                    description,
                    icon
                })

            if (error) throw error

            alert('Forum created successfully!')
            router.push('/community/forums')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl border border-gray-700">
                <h1 className="text-2xl font-bold mb-6">Create New Forum</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Topic Title</label>
                        <input
                            className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Local Foodies"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Description</label>
                        <textarea
                            className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                            placeholder="What is this forum about?"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Icon (Emoji)</label>
                        <input
                            className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 🍔"
                            value={icon}
                            onChange={e => setIcon(e.target.value)}
                            maxLength={2}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Creating...' : 'Create Forum'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full text-gray-400 hover:text-white mt-2 text-sm"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    )
}
