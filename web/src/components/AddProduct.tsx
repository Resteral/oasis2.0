'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AddProduct({ onProductAdded }: { onProductAdded: () => void }) {
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [description, setDescription] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [category, setCategory] = useState('food')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('products')
                .insert({
                    seller_id: user.id,
                    name,
                    price: parseFloat(price),
                    description,
                    image_url: imageUrl,
                    category,
                    is_available: true
                })

            if (error) throw error

            setName('')
            setPrice('')
            setDescription('')
            onProductAdded()
            alert('Product listed successfully!')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
            <h3 className="text-xl font-bold mb-4 text-white">Add New Listing</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Product Name</label>
                        <input
                            className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Price ($)</label>
                        <input
                            type="number" step="0.01"
                            className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Description</label>
                    <textarea
                        className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Image URL</label>
                    <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-1">Category</label>
                    <select
                        className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                    >
                        <option value="food">Food & Drink</option>
                        <option value="retail">Retail Item</option>
                        <option value="service">Service</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition disabled:opacity-50"
                >
                    {loading ? 'Listing...' : 'List Item'}
                </button>
            </form>
        </div>
    )
}
