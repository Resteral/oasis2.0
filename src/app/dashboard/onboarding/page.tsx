"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [category, setCategory] = useState('Retail');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id);
            else router.push('/login');
        });
    }, [router]);

    const handleCreateBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('businesses')
                .insert([
                    {
                        owner_id: userId,
                        name,
                        slug: slug.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
                        category,
                        description: `Welcome to ${name}!`,
                    }
                ]);

            if (error) throw error;
            router.push('/dashboard');
        } catch (err: any) {
            alert('Error creating business: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-xl w-full">
                {/* Progress Indicator */}
                <div className="mb-10 flex items-center justify-between px-2">
                    <div className="flex gap-2">
                        <div className="h-1.5 w-12 rounded-full bg-indigo-600"></div>
                        <div className="h-1.5 w-12 rounded-full bg-gray-200"></div>
                        <div className="h-1.5 w-12 rounded-full bg-gray-200"></div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 capitalize tracking-widest">Step 01 &bull; Core Identity</span>
                </div>

                <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-gray-100">
                    <div className="mb-10">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Launch Your Store</h1>
                        <p className="mt-2 text-gray-500 font-medium">Tell us about your business to get your automated storefront online.</p>
                    </div>

                    <form onSubmit={handleCreateBusiness} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Business Name</label>
                            <input
                                className="w-full p-4 bg-gray-50 border border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
                                placeholder="e.g. The Espresso Hub"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''));
                                }}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Shop URL (Slug)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm pointer-events-none transition-colors group-focus-within:text-indigo-600">oasis.com/shop/</span>
                                <input
                                    className="w-full p-4 pl-[8.5rem] bg-gray-50 border border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Category</label>
                            <select
                                className="w-full p-4 bg-gray-50 border border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option>Retail</option>
                                <option>Restaurant</option>
                                <option>Cafe</option>
                                <option>Health & Wellness</option>
                                <option>Animal Care</option>
                                <option>Hardware</option>
                                <option>Groceries</option>
                                <option>Services</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] hover:bg-indigo-600 transition-all uppercase shadow-xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Building Store...
                                </>
                            ) : (
                                <>Launch My Store 🚀</>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-10 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">&copy; 2026 Oasis United &bull; Scaling Business Commerce</p>
            </div>
        </div>
    );
}
