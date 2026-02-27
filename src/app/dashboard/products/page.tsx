"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

// Suggest modern images instead of AI placeholders since we want this to act like a real app
const AI_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop", // Coffee Shop
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop", // Food
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop", // Retail items
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1000&auto=format&fit=crop"  // Skincare/Wellness
];

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // New Product Form State
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

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error deleting product: " + error.message);
        } else {
            setProducts(products.filter(p => p.id !== id));
        }
    }

    if (loading) return <div className="p-8 text-gray-500">Loading products...</div>;

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Products</h1>
                    <p className={styles.subtitle}>Manage your inventory and pricing.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    {isAdding ? 'Cancel' : '+ Add Product'}
                </button>
            </div>

            {isAdding && (
                <div className={styles.addProductForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3>Add New Product</h3>
                    <div className={styles.formRow} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input
                            className="input"
                            placeholder="Product Name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <input
                            className="input"
                            placeholder="Category (e.g. Shirts, Entrees, Services)"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                    </div>
                    <div className={styles.formRow} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input
                            className="input"
                            type="number"
                            placeholder="Price ($)"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                        />
                        <input
                            className="input"
                            type="number"
                            placeholder="Stock Quantity"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                        />
                    </div>

                    <div className={styles.imageControl} style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            className="input"
                            style={{ flex: 1 }}
                            placeholder="Image URL (or generate one)"
                            value={newImage}
                            onChange={(e) => setNewImage(e.target.value)}
                        />
                        <button className="btn btn-secondary" onClick={handleGenerateAI}>
                            ✨ Generate Image
                        </button>
                    </div>
                    {newImage && <img src={newImage} alt="Preview" className={styles.preview} style={{ maxWidth: '200px', borderRadius: '8px' }} />}

                    <button className="btn btn-primary" onClick={handleAddProduct} style={{ marginTop: '1rem', width: 'fit-content' }}>
                        Save Product
                    </button>
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
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                    No products found. Add your first product above!
                                </td>
                            </tr>
                        )}
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td>
                                    <div
                                        className={styles.productThumb}
                                        style={{ backgroundImage: `url(${product.image_url || AI_PLACEHOLDERS[0]})`, width: '50px', height: '50px', backgroundSize: 'cover', borderRadius: '4px' }}
                                    />
                                </td>
                                <td className={styles.nameCell} style={{ fontWeight: 'bold' }}>{product.name}</td>
                                <td><span className={styles.badge} style={{ background: '#f0f0f0', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em' }}>{product.category || 'General'}</span></td>
                                <td>${Number(product.price).toFixed(2)}</td>
                                <td>
                                    <span className={product.stock < 10 ? styles.lowStock : ''} style={{ color: product.stock < 10 ? '#e53935' : 'inherit' }}>
                                        {product.stock} units
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.actions} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className={styles.actionBtn} style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>Edit</button>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => handleDeleteProduct(product.id)}
                                            style={{ padding: '4px 8px', border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
