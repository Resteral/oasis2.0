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
    const [phoneNumber, setPhoneNumber] = useState('')

    // Theme State
    const [theme, setTheme] = useState({ bg_color: '#0a0a0c', text_color: '#ffffff', bg_image: '' })

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
                setPhoneNumber(data.phone_number || '')
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
                    theme_settings: theme
                })
                .eq('id', user.id)

            if (error) throw error
            alert('Identity Updated Successfully!')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="bg-gray-950 min-h-screen p-8 flex items-center justify-center">
            <div className="text-primary font-black animate-pulse uppercase tracking-[0.4em] italic text-sm">Authenticating Identity...</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 lg:p-12 pb-32" style={{ backgroundColor: theme.bg_color, color: theme.text_color }}>
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(229,180,80,0.5)]"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70 italic">Global Identity</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter">
                            Oasis <span className="text-primary italic">Profile</span>
                        </h1>
                    </div>
                    <Link href="/my-oasis" className="bg-white/5 border border-white/10 hover:border-primary/30 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all glass">
                        Back to My Oasis
                    </Link>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar / Avatar */}
                    <div className="space-y-8">
                        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                            <div className="relative z-10">
                                <div className="w-32 h-32 bg-gray-800 mx-auto rounded-[2rem] flex items-center justify-center text-5xl font-black overflow-hidden border-4 border-gray-700 mb-6 group-hover:border-primary/50 transition-all duration-500 shadow-xl">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        fullName[0]?.toUpperCase() || '?'
                                    )}
                                </div>
                                <h2 className="text-xl font-black italic uppercase tracking-tight mb-2 truncate">{fullName || 'Unknown Node'}</h2>
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">{role} / OASIS NETWORK</p>
                            </div>
                        </div>

                        <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Display Aesthetics</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-2">Identity Aura (Hex)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={theme.bg_color}
                                            onChange={e => setTheme({ ...theme, bg_color: e.target.value })}
                                            className="h-10 w-10 rounded-xl cursor-pointer border-none bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={theme.bg_color}
                                            onChange={e => setTheme({ ...theme, bg_color: e.target.value })}
                                            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 text-white text-xs font-black uppercase"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-2">Signal Radiance (Hex)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={theme.text_color}
                                            onChange={e => setTheme({ ...theme, text_color: e.target.value })}
                                            className="h-10 w-10 rounded-xl cursor-pointer border-none bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={theme.text_color}
                                            onChange={e => setTheme({ ...theme, text_color: e.target.value })}
                                            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 text-white text-xs font-black uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Settings */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-[3rem] p-10 lg:p-12 shadow-2xl space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic border-l-2 border-primary pl-4">Core Identification</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[9px] font-black text-gray-600 uppercase tracking-widest pl-2">Signal Descriptor (URL)</label>
                                        <input
                                            className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-20 font-medium"
                                            placeholder="https://identity.oasis/avatar.jpg"
                                            value={avatarUrl}
                                            onChange={e => setAvatarUrl(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[9px] font-black text-gray-600 uppercase tracking-widest pl-2">Primary Callsign</label>
                                        <input
                                            className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all font-black text-sm uppercase tracking-tight"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic border-l-2 border-primary pl-4">Network Bio</h3>
                                <textarea
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded-[2rem] p-6 text-white focus:ring-1 focus:ring-primary/40 outline-none h-40 resize-none font-medium text-lg italic leading-relaxed"
                                    placeholder="Define your existence within the Oasis..."
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                />
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic border-l-2 border-primary pl-4">Specializations & Utility</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[9px] font-black text-gray-600 uppercase tracking-widest pl-2">Capabilities (CSV)</label>
                                        <input
                                            className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all font-bold text-xs uppercase"
                                            placeholder="ENG, TECH, ART, MKT"
                                            value={skills}
                                            onChange={e => setSkills(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[9px] font-black text-gray-600 uppercase tracking-widest pl-2">Exchange Rate ($/HR)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all font-black text-lg italic text-primary"
                                            value={hourlyRate}
                                            onChange={e => setHourlyRate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic border-l-2 border-primary pl-4">System Access</h3>
                                <div className="space-y-3">
                                    <label className="block text-[9px] font-black text-gray-600 uppercase tracking-widest pl-2">Role Permissions</label>
                                    <select
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-white focus:ring-1 focus:ring-primary/40 outline-none transition-all font-black text-xs uppercase tracking-[0.2em]"
                                        value={role}
                                        onChange={e => setRole(e.target.value)}
                                    >
                                        <option value="customer">Standard Explorer</option>
                                        <option value="driver">Logistics Operator</option>
                                        <option value="provider">Independent Pro</option>
                                        <option value="business">Authorized Merchant</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-gray-800/50">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-primary hover:bg-white text-black font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-[0.4em] transition-all disabled:opacity-50 shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    {saving ? 'SYNCHRONIZING...' : 'UPDATE IDENTITY'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
