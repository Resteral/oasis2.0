'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AuthForm() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<'customer' | 'driver'>('customer')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: role, // Metadata used by Trigger to populate profiles table
                            full_name: email.split('@')[0] // Default name
                        }
                    }
                })
                if (error) throw error
                alert('Check your email for the confirmation link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
                router.push(role === 'driver' ? '/driver' : '/dashboard')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-center text-white">
                {isSignUp ? 'Join Oasis' : 'Welcome Back'}
            </h2>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded mb-4 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Password</label>
                    <input
                        type="password"
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {isSignUp && (
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">I am a...</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('customer')}
                                className={`flex-1 py-2 rounded border ${role === 'customer' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400'}`}
                            >
                                Customer
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('driver')}
                                className={`flex-1 py-2 rounded border ${role === 'driver' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600 text-gray-400'}`}
                            >
                                Driver
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-gray-400 hover:text-white text-sm underline"
                >
                    {isSignUp ? 'Already have an account? Sign In' : 'New here? Create Account'}
                </button>
            </div>
        </div>
    )
}
