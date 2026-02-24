'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [mediaFile, setMediaFile] = useState<File | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]

            // Validation
            if (file.type.startsWith('video/')) {
                const video = document.createElement('video')
                video.preload = 'metadata'
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src)
                    if (video.duration > 7) {
                        alert('Video must be 7 seconds or less!')
                        setMediaFile(null)
                        e.target.value = '' // Reset input
                    } else {
                        setMediaFile(file)
                    }
                }
                video.src = URL.createObjectURL(file)
            } else {
                setMediaFile(file)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() && !mediaFile) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            let imageUrl = null
            let videoUrl = null

            // Upload Logic
            if (mediaFile) {
                const fileExt = mediaFile.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('posts_media')
                    .upload(filePath, mediaFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('posts_media')
                    .getPublicUrl(filePath)

                if (mediaFile.type.startsWith('video/')) {
                    videoUrl = publicUrl
                } else {
                    imageUrl = publicUrl
                }
            }

            const { error } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    content: content,
                    image_url: imageUrl,
                    video_url: videoUrl
                })

            if (error) throw error

            setContent('')
            setMediaFile(null)
            onPostCreated() // Refresh feed
            alert('Post created! You earned 10 Tokens! 🪙')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
            <form onSubmit={handleSubmit}>
                <textarea
                    className="w-full bg-gray-700 text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="What's on your mind? Share an update or promote your business..."
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                <div className="mt-3 flex items-center gap-4">
                    <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm text-gray-300 transition flex items-center gap-2">
                        <span>📷 Video / Image</span>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                    {mediaFile && <span className="text-xs text-green-400 truncate max-w-[200px]">{mediaFile.name} (Ready)</span>}
                </div>

                <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-400">Max 7s for videos. Earn 10 Tokens!</span>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
                    >
                        {loading ? 'Posting...' : 'Post Update'}
                    </button>
                </div>
            </form>
        </div>
    )
}
