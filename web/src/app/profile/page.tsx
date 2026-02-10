'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function Profile() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Profile State
    const [fullName, setFullName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [bio, setBio] = useState('')
    const [skills, setSkills] = useState('') // Comma separated for UI
    const [hourlyRate, setHourlyRate] = useState('')
    const [role, setRole] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('') // Added State

    // Theme State
    const [theme, setTheme] = useState({ bg_color: '#111827', text_color: '#ffffff', bg_image: '' })

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth')
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                setFullName(data.full_name || '')
                setAvatarUrl(data.avatar_url || '')
                setBio(data.bio || '')
                setSkills((data.skills || []).join(', '))
                setHourlyRate(data.hourly_rate || '')
                setRole(data.role || 'customer')
                setPhoneNumber(data.phone_number || '') // Load Phone
                if (data.theme_settings) setTheme(data.theme_settings)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s)

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    bio,
                    skills: skillsArray,
                    hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
                    role: role,
                    theme_settings: theme // Save Myspace Theme
                })
                .eq('id', user.id)

            if (error) throw error
            alert('Profile Updated Successfully!')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="text-white text-center py-20">Loading profile...</div>

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6" style={{ backgroundColor: theme.bg_color, color: theme.text_color }}>
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Edit Profile</h1>
                    <Link href="/dashboard" className="text-gray-400 hover:text-white">Back to Dashboard</Link>
                </div>

                <form onSubmit={handleSave} className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-6">

                    {/* Myspace Theme Section */}
                    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 rounded-xl border border-purple-500/30 mb-8">
                        <h3 className="text-xl font-bold mb-4 text-purple-300">🎨 Page Customization</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Background Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={theme.bg_color}
                                        onChange={e => setTheme({ ...theme, bg_color: e.target.value })}
                                        className="h-10 w-10 rounded cursor-pointer border-none"
                                    />
                                    <input
                                        type="text"
                                        value={theme.bg_color}
                                        onChange={e => setTheme({ ...theme, bg_color: e.target.value })}
                                        className="flex-1 bg-gray-700 rounded px-2 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Text Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={theme.text_color}
                                        onChange={e => setTheme({ ...theme, text_color: e.target.value })}
                                        className="h-10 w-10 rounded cursor-pointer border-none"
                                    />
                                    <input
                                        type="text"
                                        value={theme.text_color}
                                        onChange={e => setTheme({ ...theme, text_color: e.target.value })}
                                        className="flex-1 bg-gray-700 rounded px-2 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-gray-400 text-sm mb-2">Background Image URL</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/background.jpg"
                                    value={theme.bg_image}
                                    onChange={e => setTheme({ ...theme, bg_image: e.target.value })}
                                    className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                {theme.bg_image && (
                                    <div className="mt-2 text-xs text-green-400">Preview: Image Loaded</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-4xl font-bold overflow-hidden border-4 border-gray-600">
                            {avatarUrl ? (
                                <img src={avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                fullName[0]?.toUpperCase()
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="block text-gray-400 text-sm mb-2">Profile Picture URL</label>
                            <input
                                className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="https://..."
                                value={avatarUrl}
                                onChange={e => setAvatarUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">
                            {role === 'business' ? 'Business Name' : 'Display Name'}
                        </label>
                        <input
                            className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">
                            {role === 'business' ? 'Business Description' : 'Bio / About Me'}
                        </label>
                        <textarea
                            className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                            placeholder={role === 'business' ? "We sell the best..." : "Tell others what you do..."}
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Skills (Comma separated)</label>
                        <input
                            className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Carpentry, Roofing, Plumbing"
                            value={skills}
                            onChange={e => setSkills(e.target.value)}
                        />
                    </div>

                    {role === 'business' && (
                        <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                            <label className="block text-yellow-500 text-sm font-bold mb-2">Business Location (Required for Radar)</label>
                            <input
                                className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none mb-4"
                                placeholder="Street Address (e.g. 123 Main St, New York)"
                            // In a real app, this would use Google Places Autocomplete
                            />

                            <label className="block text-yellow-500 text-sm font-bold mb-2">Phone Number (For Call Button)</label>
                            <input
                                className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none mb-4"
                                placeholder="+1 (555) 000-0000"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                            />

                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="frontless" className="w-4 h-4" />
                                <label htmlFor="frontless" className="text-sm text-gray-300">This is a "Frontless" Store (Ghost Kitchen / No Storefront)</label>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Hourly Rate ($)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={hourlyRate}
                                onChange={e => setHourlyRate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Account Type</label>
                            <select
                                className="w-full bg-gray-700 rounded p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                            >
                                <option value="customer">Customer</option>
                                <option value="driver">Driver (Delivery)</option>
                                <option value="provider">Service Provider (Pro)</option>
                                <option value="business">Business (Restaurant/Store)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-700">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
