"use client";
<<<<<<< HEAD
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
=======
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { parseProductCSV, generateCSVTemplate } from '@/lib/import_utils';
import styles from './page.module.css';

const AI_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=100&q=80",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80",
    "https://images.unsplash.com/photo-1447933601403-0c60889eeaf6?auto=format&fit=crop&w=100&q=80",
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=100&q=80"
];

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
>>>>>>> 41c0e56 (feat: implement fulfillment dashboard and unified checkout with inventory sync)

    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newCategory, setNewCategory] = useState('General');
    const [newStock, setNewStock] = useState('100');
    const [newImage, setNewImage] = useState('');
    const [newCategory, setNewCategory] = useState('General');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: business } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single();
        if (business) {
            setBusinessId(business.id);
            const { data } = await supabase.from('products').select('*').eq('business_id', business.id).order('created_at', { ascending: false });
            setProducts(data || []);
        }
        setLoading(false);
    }

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

<<<<<<< HEAD
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
=======
        const { data, error } = await supabase.from('products').insert([
            {
                name: newName,
                price: parseFloat(newPrice),
                image_url: newImage || AI_PLACEHOLDERS[0],
                category: newCategory,
                business_id: businessId,
                stock: 100
            }
        ]).select();

        if (!error && data) {
            setProducts([data[0], ...products]);
            setIsAdding(false);
            setNewName('');
            setNewPrice('');
>>>>>>> 41c0e56 (feat: implement fulfillment dashboard and unified checkout with inventory sync)
            setNewImage('');
        }
    };

<<<<<<< HEAD
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
=======
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your inventory...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Inventory</h1>
                    <p className={styles.subtitle}>Manage your products and bulk updates.</p>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-secondary" onClick={() => setIsImporting(!isImporting)}>
                        Bulk Import
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? 'Cancel' : '+ Add Product'}
                    </button>
                </div>
>>>>>>> 41c0e56 (feat: implement fulfillment dashboard and unified checkout with inventory sync)
            </div>

            {isImporting && (
                <div className={styles.addProductForm}>
                    <div className={styles['flex'] + ' ' + styles['justify-between'] + ' ' + styles['items-center'] + ' ' + styles['mb-4']}>
                        <h3 className={styles['text-lg'] + ' ' + styles['font-bold']}>Bulk Import Products</h3>
                        <button className={styles.templateBtn} onClick={downloadTemplate}>
                            Download Template
                        </button>
                    </div>
                    <p className={styles['text-sm'] + ' ' + styles['text-gray-500'] + ' ' + styles['mb-6']}>Upload a CSV file containing your product list. Required columns: Name, Price.</p>
                    <input
                        type="file"
                        accept=".csv"
                        className={styles.hidden}
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <div
                        className={styles.importArea}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className={styles['text-gray-500'] + ' ' + styles['font-bold']}>Click to select Oasis CSV File</span>
                    </div>
                </div>
            )}

            {isAdding && (
<<<<<<< HEAD
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
=======
                <div className={styles.addProductForm}>
                    <h3 className={styles['text-lg'] + ' ' + styles['font-bold'] + ' ' + styles['mb-4']}>Create New Product</h3>
                    <div className={styles.formRow}>
                        <input
                            className="input"
                            placeholder="Product Name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <input
                            className="input"
                            type="number"
                            placeholder="Price ($)"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                        />
                        <input
                            className="input"
                            placeholder="Category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                    </div>

                    <div className={styles.imageControl}>
                        <input
                            className="input"
                            placeholder="Image URL (or generate one)"
                            value={newImage}
                            onChange={(e) => setNewImage(e.target.value)}
                        />
                        <button className="btn btn-secondary" onClick={handleGenerateAI}>
                            ✨ AI Image
                        </button>
                    </div>
                    {newImage && <img src={newImage} alt="Preview" className={styles.preview} />}

                    <div className={styles['flex'] + ' ' + styles['justify-between'] + ' ' + styles['mt-6']}>
                        <div></div>
                        <button className="btn btn-primary px-8" onClick={handleAddProduct}>
                            Save Product
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products found. Start by adding one or importing a list.</td></tr>
                        ) : products.map((product) => (
                            <tr key={product.id}>
                                <td>
                                    <div
                                        className={styles.productThumb}
                                        style={{ backgroundImage: `url(${product.image_url || AI_PLACEHOLDERS[0]})` }}
                                    />
                                </td>
                                <td className={styles.nameCell}>{product.name}</td>
                                <td><span className={styles.badge}>{product.category || 'General'}</span></td>
                                <td className="font-bold">${Number(product.price).toFixed(2)}</td>
                                <td>
                                    <span className={(product.stock || 0) < 20 ? styles.lowStock : ''}>
                                        {product.stock || 0} unit{(product.stock || 0) !== 1 ? 's' : ''}
>>>>>>> 41c0e56 (feat: implement fulfillment dashboard and unified checkout with inventory sync)
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
