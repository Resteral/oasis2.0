"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Review {
    id: string;
    rating: number;
    content: string;
    created_at: string;
    profiles: {
        full_name: string;
    };
}

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    productId: string;
    productName: string;
    theme: any;
}

export default function ReviewModal({ isOpen, onClose, businessId, productId, productName, theme }: ReviewModalProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchReviews = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                id,
                rating,
                content,
                created_at,
                profiles (
                    full_name
                )
            `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReviews(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) fetchReviews();
    }, [isOpen, productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please sign in to leave a review!');
            setSubmitting(false);
            return;
        }

        const { error } = await supabase
            .from('reviews')
            .insert({
                business_id: businessId,
                product_id: productId,
                user_id: user.id,
                rating: rating,
                content: content
            });

        if (error) {
            alert('Error submitting review. Please try again.');
        } else {
            setContent('');
            setRating(5);
            fetchReviews();
        }
        setSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Reviews for {productName}</h2>
                        <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} className="text-amber-400 text-sm">★</span>
                            ))}
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Verified Feedback</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">✕</button>
                </div>

                <div className="flex flex-col lg:flex-row h-[500px]">
                    {/* Reviews List */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
                        {loading ? (
                            <div className="text-center text-gray-400 font-black animate-pulse uppercase tracking-widest mt-20">Loading Reviews...</div>
                        ) : reviews.length > 0 ? (
                            reviews.map((review) => (
                                <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-gray-900">{review.profiles.full_name}</div>
                                            <div className="flex gap-0.5 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={`text-[10px] ${i < review.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <p className="font-medium">No reviews yet. Be the first!</p>
                            </div>
                        )}
                    </div>

                    {/* Write Review Form */}
                    <div className="w-full lg:w-72 p-8 border-l border-gray-100 bg-white">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Write a Review</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setRating(s)}
                                            className={`text-xl transition-all ${s <= rating ? 'text-amber-400 scale-110' : 'text-gray-200 hover:text-amber-200'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Your Feedback</label>
                                <textarea
                                    className="input w-full min-h-[120px] text-sm py-3"
                                    placeholder="What did you think of the product?"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn btn-primary w-full py-4 font-black text-[10px] tracking-widest uppercase"
                                style={{ backgroundColor: theme.primaryColor }}
                            >
                                {submitting ? 'Sending...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
