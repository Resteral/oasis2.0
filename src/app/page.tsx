"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import { GooglePlace } from '@/lib/types';
import GlobalSearch from '@/components/GlobalSearch';

export default function Home() {
  const [internalBusinesses, setInternalBusinesses] = useState<any[]>([]);
  const [externalPlaces, setExternalPlaces] = useState<GooglePlace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadInitialBusinesses() {
      const { data } = await supabase.from('businesses').select('*').limit(4);
      if (data) setInternalBusinesses(data);
    }
    loadInitialBusinesses();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      // 1. Search internal businesses
      const { data: internal } = await supabase
        .from('businesses')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .limit(4);

      if (internal) setInternalBusinesses(internal);

      // 2. Search external places via SerpApi
      const res = await fetch(`/api/places?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.results) setExternalPlaces(data.results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className="container px-6 mx-auto flex justify-between items-center">
          <Link href="/" className={styles.logo} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="OasisUnited" style={{ height: '50px', width: 'auto' }} />
            <span className="font-black tracking-tight text-2xl text-gray-900 border-l-2 border-gray-100 pl-4 ml-2">OasisUnited</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/marketplace" className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-full font-black text-xs tracking-widest uppercase hover:bg-indigo-100 transition-all border border-indigo-100">Marketplace</Link>
            <Link href="/my-oasis" className={styles.navLink}>Orders</Link>
            <Link href="/login" className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-all">Log In</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className="container mx-auto px-6">
            <h1 className={styles.title}>
              Connect Your Business <br />
              <span className={styles.highlight}>United with People.</span>
            </h1>
            <p className={styles.subtitle}>
              The premium digital storefront for local commerce.
              Find hidden gems, order direct, and get it delivered.
            </p>

            <div className="max-w-xl mx-auto mt-12 mb-16 relative z-10">
              <GlobalSearch />
            </div>

            <div className={styles.cta}>
              <Link href="/marketplace" className="px-10 py-5 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 transition-all scale-110">
                Explore The Oasis →
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.deliveryBanner}>
          <div className="container mx-auto px-6">
            <h2 className={styles.deliveryTitle}>
              We Bring Your <span className={styles.deliveryHighlight}>Neighborhood</span> to You
            </h2>
            <p className={styles.deliveryDescription}>
              Buy anything from local businesses directly. Whether they have a storefront or not, we handle the logistics so you can support local easily.
            </p>
            <div className={styles.deliveryMethods}>
              <div className={styles.methodCard}>
                <span className={styles.methodIcon}>📞</span>
                <h4>Order by Phone</h4>
                <p>Call any business you find. Place your order over the phone and we'll pick it up and deliver it for a flat fee.</p>
              </div>
              <div className={styles.methodCard}>
                <span className={styles.methodIcon}>💳</span>
                <h4>Pay Us, We Pay Them</h4>
                <p>Transfer the cost + delivery fee to us, and we'll handle the transaction and bring your goods to your door.</p>
              </div>
              <div className={styles.methodCard}>
                <span className={styles.methodIcon}>🚚</span>
                <h4>On-Demand Delivery</h4>
                <p>Our network of local drivers ensures your products arrive fresh and fast from any shop in the city.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.discovery}>
          <div className="container mx-auto px-6">
            <h2 className={styles.sectionTitle}>
              {externalPlaces.length > 0 || searchQuery ? 'Search Results' : 'Local Favorites'}
            </h2>

            <div className={styles.nearbyGrid}>
              {/* Internal Businesses */}
              {internalBusinesses.map((business) => (
                <Link href={`/shop/${business.slug || business.id}`} key={business.id} className={styles.businessCard}>
                  <div className={styles.businessImage} style={{ backgroundImage: business.image_url ? `url(${business.image_url})` : 'none' }} />
                  <div className={styles.businessInfo}>
                    <h4>{business.name}</h4>
                    <p>{business.category || 'Local Business'} • {business.location || 'Nearby'}</p>
                    <span className={styles.badge}>Oasis Partner</span>
                  </div>
                </Link>
              ))}

              {/* SerpApi Results */}
              {externalPlaces.map((place) => (
                <div key={place.place_id} className={styles.businessCard}>
                  <div className={styles.businessImage} style={{ backgroundImage: place.image ? `url(${place.image})` : 'none' }} />
                  <div className={styles.businessInfo}>
                    <div className="flex justify-between items-start">
                      <h4 className="flex-1">{place.name}</h4>
                      {place.rating && <span className="text-amber-500 font-bold text-xs ml-2">★ {place.rating}</span>}
                    </div>
                    <p className="line-clamp-1">{place.formatted_address}</p>
                    {place.distance && <p className="text-xs mt-1 font-bold">{place.distance}</p>}
                    <div className="flex gap-2 mt-3">
                      <a href={`tel:${place.phone}`} className="text-[10px] font-black px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">CALL TO ORDER</a>
                      <span className={styles.badge}>Local Place</span>
                    </div>
                  </div>
                </div>
              ))}

              {internalBusinesses.length === 0 && externalPlaces.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <span className="text-4xl block mb-4">🔍</span>
                  <p className="text-gray-400 font-bold">No results found for "{searchQuery}". Try searching for specific items or shops.</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      <footer className={styles.footer}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="OasisUnited" style={{ height: '30px', width: 'auto' }} />
              <span className="font-black text-gray-900">OasisUnited</span>
            </div>
            <p className="text-sm">&copy; 2026 OasisUnited. The future of local commerce.</p>
            <div className="flex gap-6">
              <Link href="/login" className="text-gray-400 hover:text-gray-900 transition-colors">Vendor Login</Link>
              <Link href="tel:5085070305" className="text-gray-400 hover:text-gray-900 transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
