"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SecuritySettingsPage() {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [factorId, setFactorId] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        checkEnrollment();
    }, []);

    const checkEnrollment = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const factors = user.factors || [];
            const totpFactor = factors.find(factor => factor.factor_type === 'totp' && factor.status === 'verified');
            if (totpFactor) {
                setIsEnrolled(true);
                setFactorId(totpFactor.id);
            } else {
                setIsEnrolled(false);
            }
        }
        setLoading(false);
    };

    const startEnrollment = async () => {
        setError('');
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
        if (error) {
            setError(error.message);
            return;
        }
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
    };

    const verifyEnrollment = async () => {
        setError('');
        if (!factorId) return;

        const challenge = await supabase.auth.mfa.challenge({ factorId });
        if (challenge.error) {
            setError(challenge.error.message);
            return;
        }

        const verify = await supabase.auth.mfa.verify({
            factorId,
            challengeId: challenge.data.id,
            code: verifyCode
        });

        if (verify.error) {
            setError(verify.error.message);
            return;
        }

        setIsEnrolled(true);
        setQrCode(null);
        setSecret(null);
        alert('MFA Successfully Enrolled!');
    };

    const unenroll = async () => {
        setError('');
        if (!factorId) return;

        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) {
            setError(error.message);
            return;
        }

        setIsEnrolled(false);
        setFactorId(null);
        alert('MFA Disabled.');
    };

    if (loading) return <div className="p-8">Loading security settings...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-20 p-8">
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Security Settings</h1>
                <p className="mt-2 text-lg text-gray-500">Add an extra layer of protection to your business account.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                    <span className="text-2xl">🔒</span>
                    <h2 className="text-2xl font-bold text-gray-900">Multi-Factor Authentication (MFA)</h2>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium">{error}</div>}

                {isEnrolled ? (
                    <div className="space-y-6">
                        <div className="p-6 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4">
                            <span className="text-3xl">✅</span>
                            <div>
                                <h3 className="font-bold text-green-900">MFA is Active</h3>
                                <p className="text-green-700 text-sm">Your account is secured with a TOTP Authenticator App.</p>
                            </div>
                        </div>
                        <button
                            onClick={unenroll}
                            className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors"
                        >
                            Disable MFA
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {!qrCode ? (
                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    Secure your account using an authenticator app like Google Authenticator, Authy, or 1Password.
                                </p>
                                <button
                                    onClick={startEnrollment}
                                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200"
                                >
                                    Enable MFA Authentication
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <p className="font-bold text-gray-900">1. Scan this QR Code with your Authenticator App</p>
                                <div className="p-4 bg-white border-2 border-dashed border-gray-200 inline-block rounded-2xl">
                                    <div dangerouslySetInnerHTML={{ __html: qrCode }} className="w-48 h-48" />
                                </div>
                                <p className="text-sm text-gray-500 font-mono bg-gray-50 p-3 rounded-lg inline-block">Secret: {secret}</p>

                                <div className="space-y-4 pt-4">
                                    <p className="font-bold text-gray-900">2. Enter the 6-digit code to verify</p>
                                    <div className="flex gap-4 max-w-sm">
                                        <input
                                            type="text"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value)}
                                            className="w-full text-center tracking-[0.5em] font-mono text-xl p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <button
                                            onClick={verifyEnrollment}
                                            disabled={verifyCode.length !== 6}
                                            className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
