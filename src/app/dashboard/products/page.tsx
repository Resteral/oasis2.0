"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { parseProductCSV, generateCSVTemplate } from '@/lib/import_utils';

// High-quality stock photo placeholders for a premium feel
const AI_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop", // Coffee
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop", // Food
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop", // Retail
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1000&auto=format&fit=crop"  // Skincare
];

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newCategory, setNewCategory] = useState('General');
    const [newStock, setNewStock] = useState('100');
    const [newImage, setNewImage] = useState('');
    const [newDescription, setNewDescription] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
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

            if (prods) setProducts(prods as Product[]);
        }
        setLoading(false);
    };

    const handleGenerateAI = () => {
        const randomImg = AI_PLACEHOLDERS[Math.floor(Math.random() * AI_PLACEHOLDERS.length)];
        setNewImage(randomImg);
    };

    const handleAddProduct = async () => {
        if (!newName || !newPrice || !businessId) {
            alert("Name and Price are required.");
            return;
        }

        const newProductData = {
            business_id: businessId,
            name: newName,
            price: parseFloat(newPrice),
            stock: parseInt(newStock) || 0,
            category: newCategory,
            description: newDescription,
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
            setProducts([data as Product, ...products]);
            setIsAdding(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setNewName('');
        setNewPrice('');
        setNewStock('100');
        setNewCategory('General');
        setNewImage('');
        setNewDescription('');
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) alert("Error deleting product: " + error.message);
        else setProducts(products.filter(p => p.id !== id));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const result = parseProductCSV(text);

            if (result.success && result.data && businessId) {
                const toInsert = result.data.map(p => ({
                    ...p,
                    business_id: businessId,
                    image_url: p.image_url || AI_PLACEHOLDERS[Math.floor(Math.random() * AI_PLACEHOLDERS.length)]
                }));

                const { error } = await supabase.from('products').insert(toInsert);
                if (!error) {
                    alert(`Successfully imported ${result.count} products!`);
                    fetchProducts();
                    setIsImporting(false);
                } else {
                    alert('Error saving products: ' + error.message);
                }
            } else {
                alert(result.error);
            }
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const csv = generateCSVTemplate();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'oasis_product_template.csv';
        a.click();
    };

    if (loading) return (
        <div className="p-12 text-gray-400 font-black animate-pulse uppercase tracking-widest text-center">
            Loading Inventory...
        </div>
    );

    return (
        <div className="space-y-12 max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">Inventory</h1>
                    <p className="mt-2 text-lg text-gray-500 font-medium">Manage your products, stock levels, and bulk updates.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        className="px-6 py-4 bg-white border border-gray-200 rounded-2xl font-black text-xs tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm uppercase"
                        onClick={() => setIsImporting(!isImporting)}
                    >
                        {isImporting ? 'Cancel Import' : 'Bulk Import'}
                    </button>
                    <button
                        className={`px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 uppercase ${isAdding ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white'}`}
                        onClick={() => {
                            setIsAdding(!isAdding);
                            if (!isAdding) setIsImporting(false);
                        }}
                    >
                        {isAdding ? 'Cancel' : '+ Add Product'}
                    </button>
                </div>
            </div>

            {isImporting && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-10 rounded-[3rem] text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Bulk Import Products</h3>
                        <button
                            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            onClick={downloadTemplate}
                        >
                            Download Template
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">Upload a CSV file containing your product list. Required columns: Name, Price.</p>
                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <div
                        className="p-12 border-2 border-white rounded-[2rem] bg-white/50 cursor-pointer hover:bg-white transition-all group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="text-lg font-black text-gray-400 group-hover:text-indigo-600 uppercase tracking-widest">Click to select Oasis CSV File</span>
                    </div>
                </div>
            )}

            {isAdding && (
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 relative z-10">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                        <span className="text-2xl">📦</span>
                        <h2 className="text-2xl font-black text-gray-900 uppercase">New Product Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Name</label>
                            <input
                                placeholder="e.g. Artisanal Espresso"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold italic"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                            <input
                                placeholder="e.g. Beverages"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold italic"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Price ($)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold italic"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Stock</label>
                            <input
                                type="number"
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold italic"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Description (Optional)</label>
                        <textarea
                            placeholder="Tell customers about this product..."
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold italic h-24 resize-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Image</label>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                placeholder="Image URL (paste or generate)"
                                value={newImage}
                                onChange={(e) => setNewImage(e.target.value)}
                                className="flex-1 p-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-mono text-xs overflow-hidden text-ellipsis"
                            />
                            <button
                                onClick={handleGenerateAI}
                                className="px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-lg hover:bg-indigo-600 transition-all uppercase"
                            >
                                ✨ Generate AI Image
                            </button>
                        </div>
                        {newImage && (
                            <div className="mt-4 relative w-48 h-48 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
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
                            className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm tracking-widest shadow-xl hover:bg-indigo-700 transform transition-all hover:-translate-y-1 uppercase"
                        >
                            Publish Product
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.length === 0 && !isAdding && (
                    <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                        <span className="text-6xl block mb-6">🏜️</span>
                        <h3 className="text-2xl font-black text-gray-900 uppercase italic">No products yet</h3>
                        <p className="text-gray-400 mt-2 font-medium">Start your catalog by adding your first product or importing a CSV.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] tracking-widest shadow-lg uppercase"
                        >
                            Add First Product
                        </button>
                    </div>
                )}
                {products.map((product) => (
                    <div key={product.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                        <div className="relative h-64 overflow-hidden">
                            <img
                                src={product.image_url || AI_PLACEHOLDERS[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-6 left-6">
                                <span className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-[9px] font-black tracking-[0.1em] text-gray-900 border border-white/20 shadow-sm uppercase">
                                    {product.category || 'GENERAL'}
                                </span>
                            </div>
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 flex flex-col gap-2">
                                <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-gray-900 hover:bg-indigo-600 hover:text-white transition-all transform hover:rotate-12 active:scale-90">
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform hover:-rotate-12 active:scale-90"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-black text-gray-900 truncate pr-4 leading-tight italic uppercase tracking-tight">{product.name}</h3>
                                <div className="text-2xl font-black text-indigo-600 tracking-tighter">${Number(product.price).toFixed(2)}</div>
                            </div>
                            {product.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 font-medium">{product.description}</p>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}`}></div>
                                    <span className={`text-[10px] font-black tracking-[0.05em] uppercase ${product.stock > 10 ? 'text-gray-400' : 'text-rose-500'}`}>
                                        {product.stock} IN STOCK
                                    </span>
                                </div>
                                <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                                    Analytics →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
