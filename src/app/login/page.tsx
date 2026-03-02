"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [role, setRole] = useState<'consumer' | 'business'>('consumer');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [smsConsent, setSmsConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // MFA State
    const [requiresMFA, setRequiresMFA] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [factorId, setFactorId] = useState('');
    const [mfaError, setMfaError] = useState<string | null>(null);

    const completeLogin = async (user: any) => {
        const profile = await ensureProfile(user);
        if (profile?.role === 'business') {
            router.push('/dashboard');
        } else {
            router.push('/profile');
        }
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMfaError(null);

        try {
            const challenge = await supabase.auth.mfa.challenge({ factorId });
            if (challenge.error) throw challenge.error;

            const verify = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: mfaCode
            });

            if (verify.error) throw verify.error;

            // Verification successful
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                await completeLogin(data.user);
            }
        } catch (err: any) {
            setMfaError(err.message || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // 1. Sign Up with Metadata
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: role,
                            full_name: email.split('@')[0],
                            sms_consent: smsConsent,
                        }
                    }
                });

                if (authError) throw authError;

                // 2. Handle Profile Creation (Only if session exists immediately - e.g. Auto Confirm)
                if (authData.session) {
                    await ensureProfile(authData.user!);
                    alert("Account created! You are logged in.");
                    router.push(role === 'business' ? '/dashboard' : '/profile');
                } else if (authData.user) {
                    // Email confirmation required
                    alert("Account created! Please check your email to confirm your account before signing in.");
                    setIsSignUp(false); // Switch to login view
                }
            } else {
                // 1. Sign In
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError) throw authError;

                if (authData.user) {
                    // Check if AAL2 (MFA) is required
                    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

                    if (aal?.nextLevel === 'aal2' && aal.currentLevel === 'aal1') {
                        // Needs MFA, find the totp factor
                        const totpFactor = authData.user.factors?.find((f: any) => f.factor_type === 'totp' && f.status === 'verified');
                        if (totpFactor) {
                            setFactorId(totpFactor.id);
                            setRequiresMFA(true);
                            return; // Stop here, wait for MFA submission
                        }
                    }

                    // Otherwise complete normal login
                    await completeLogin(authData.user);
                }
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to ensure profile exists in public table
    const ensureProfile = async (user: any) => {
        // Check if profile exists
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) return profile;

        // If not, create it using metadata
        const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    role: user.user_metadata?.role || 'consumer',
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    sms_consent: user.user_metadata?.sms_consent || false,
                }
            ])
            .select()
            .single();

        if (insertError) {
            // If insert fails (rarity), just return structure or throw
            // It might fail if RLS issues persist, but now we have a session.
            throw new Error("Failed to create profile: " + insertError.message);
        }
        return newProfile;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <img src="/logo.png" alt="OasisUnited" style={{ height: '60px', width: 'auto' }} />
                    <span style={{ color: '#222', fontWeight: 'bold', fontSize: '1.5rem' }}>OasisUnited</span>
                </Link>
            </header>

            <main className={styles.main}>
                <div className={styles.authCard}>
                    <h1 className={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
                    <p className={styles.subtitle}>
                        {isSignUp ? 'Join as a customer or business owner.' : 'Sign in to your account.'}
                    </p>

                    {error && <div className={styles.error}>{error}</div>}

                    {requiresMFA ? (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-center text-gray-900">Two-Factor Authentication</h2>
                            <p className="text-center text-gray-500 text-sm">Enter the 6-digit code from your authenticator app.</p>
                            {mfaError && <div className={styles.error}>{mfaError}</div>}
                            <form onSubmit={handleMfaSubmit} className={styles.form}>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    className="w-full text-center tracking-[0.5em] font-mono text-xl p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn btn-primary mt-4" disabled={loading || mfaCode.length !== 6}>
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRequiresMFA(false)}
                                    className="w-full text-sm text-gray-500 hover:text-gray-900 mt-4"
                                    disabled={loading}
                                >
                                    Cancel & Return
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleAuth} className={styles.form}>
                                {isSignUp && (
                                    <div className={styles.roleSelector}>
                                        <button
                                            type="button"
                                            className={`${styles.roleBtn} ${role === 'consumer' ? styles.active : ''}`}
                                            onClick={() => setRole('consumer')}
                                        >
                                            🛍️ Customer
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.roleBtn} ${role === 'business' ? styles.active : ''}`}
                                            onClick={() => setRole('business')}
                                        >
                                            💼 Business
                                        </button>
                                    </div>
                                )}

                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className={styles.input}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                {isSignUp && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '1rem 0', fontSize: '0.85rem', color: '#555' }}>
                                        <input
                                            type="checkbox"
                                            checked={smsConsent}
                                            onChange={(e) => setSmsConsent(e.target.checked)}
                                            style={{ marginTop: '0.2rem', marginRight: '0.5rem' }}
                                        />
                                        <span>
                                            I agree to receive order updates and promotional messages from <strong>OasisUnited</strong> and its merchants at the number provided. Reply STOP to unsubscribe. Msg & Data rates may apply.
                                        </span>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
                                </button>
                            </form>

                            <p className={styles.switchMode}>
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"} <button className={styles.textBtn} onClick={() => setIsSignUp(!isSignUp)}>
                                    {isSignUp ? 'Log In' : 'Sign Up'}
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
