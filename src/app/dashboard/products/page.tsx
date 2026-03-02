"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// High-quality stock photo placeholders for a premium feel
const AI_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop", // Coffee
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop", // Food
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop", // Retail
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1000&auto=format&fit=crop"  // Skincare
];

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newCategory, setNewCategory] = useState('General');
    const [newStock, setNewStock] = useState('100');
    const [newImage, setNewImage] = useState('');

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: business } = await supabase
                .from('businesses')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (business) {
                setBusinessId(business.id);
                const { data: prods } = await supabase
                    .from('products')
                    .select('*')
                    .eq('business_id', business.id)
                    .order('created_at', { ascending: false });

                if (prods) setProducts(prods);
            }
            setLoading(false);
        }
        fetchProducts();
    }, []);

    const handleGenerateAI = () => {
        const randomImg = AI_PLACEHOLDERS[Math.floor(Math.random() * AI_PLACEHOLDERS.length)];
        setNewImage(randomImg);
    };

    const handleAddProduct = async () => {
        if (!newName || !newPrice || !businessId) return;

        const newProductData = {
            business_id: businessId,
            name: newName,
            price: parseFloat(newPrice),
            stock: parseInt(newStock) || 0,
            category: newCategory,
            image_url: newImage || AI_PLACEHOLDERS[Math.floor(Math.random() * AI_PLACEHOLDERS.length)]
        };

        const { data, error } = await supabase
            .from('products')
            .insert([newProductData])
            .select()
            .single();

        if (error) {
            alert("Error adding product: " + error.message);
        } else if (data) {
            setProducts([data, ...products]);
            setIsAdding(false);
            setNewName('');
            setNewPrice('');
            setNewStock('100');
            setNewCategory('General');
            setNewImage('');
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) alert("Error deleting product: " + error.message);
        else setProducts(products.filter(p => p.id !== id));
    };

    if (loading) return <div className="p-12 text-gray-400 font-black animate-pulse uppercase tracking-widest text-center">Loading Inventory...</div>;

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Product Inventory</h1>
                    <p className="mt-2 text-lg text-gray-500">Manage your items, stock levels, and storefront visibility.</p>
                </div>
                <button
                    className={`px-8 py-4 rounded-2xl font-black text-sm tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 ${isAdding ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white'}`}
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? 'CANCEL' : '+ ADD PRODUCT'}
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                        <span className="text-2xl">📦</span>
                        <h2 className="text-2xl font-bold text-gray-900">New Product Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Product Name</label>
                            <input
                                placeholder="e.g. Artisanal Espresso"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
                            <input
                                placeholder="e.g. Beverages"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Price ($)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Initial Stock</label>
                            <input
                                type="number"
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Product Image</label>
                        <div className="flex gap-4">
                            <input
                                placeholder="Image URL (paste or generate)"
                                value={newImage}
                                onChange={(e) => setNewImage(e.target.value)}
                                className="flex-1 p-4 border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-mono text-xs"
                            />
                            <button
                                onClick={handleGenerateAI}
                                className="px-6 py-4 bg-gray-900 text-white rounded-xl font-black text-[10px] tracking-widest shadow-lg hover:bg-gray-800 transition-all uppercase"
                            >
                                ✨ Generate AI Image
                            </button>
                        </div>
                        {newImage && (
                            <div className="mt-4 relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                                <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setNewImage('')}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleAddProduct}
                            className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg tracking-widest shadow-xl hover:bg-indigo-700 transform transition-all hover:-translate-y-1"
                        >
                            PUBLISH PRODUCT
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.length === 0 && !isAdding && (
                    <div className="col-span-full py-32 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <span className="text-6xl block mb-6">🏜️</span>
                        <h3 className="text-2xl font-black text-gray-900">No products yet</h3>
                        <p className="text-gray-400 mt-2">Start your catalog by adding your first product.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-sm tracking-widest shadow-lg"
                        >
                            ADD FIRST PRODUCT
                        </button>
                    </div>
                )}
                {products.map((product) => (
                    <div key={product.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                        <div className="relative h-56 overflow-hidden">
                            <img
                                src={product.image_url || AI_PLACEHOLDERS[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-4 left-4">
                                <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-gray-900 border border-white/20">
                                    {product.category || 'GENERAL'}
                                </span>
                            </div>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-900 hover:bg-indigo-600 hover:text-white transition-all transform hover:rotate-12">
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all transform hover:-rotate-12"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-black text-gray-900 truncate pr-4">{product.name}</h3>
                                <div className="text-xl font-black text-indigo-600">${Number(product.price).toFixed(2)}</div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                    <span className={`text-[10px] font-black tracking-widest ${product.stock > 10 ? 'text-gray-400' : 'text-red-500'}`}>
                                        {product.stock} IN STOCK
                                    </span>
                                </div>
                                <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline">
                                    View Analytics →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
