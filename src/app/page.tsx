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
          <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="OasisUnited" style={{ height: '42px', width: 'auto', filter: 'brightness(1.5)' }} className="dark-invert-if-needed" />
          </Link>
          <nav className={styles.nav}>
            <Link href="/marketplace" className="px-5 py-2.5 bg-white/5 text-white/80 rounded-full font-bold text-xs tracking-widest uppercase hover:bg-white/10 transition-all border border-white/10">Marketplace</Link>
            <Link href="/my-oasis" className={styles.navLink}>Orders</Link>
            <Link href="/login" className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:opacity-90 transition-all">Log In</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className="container mx-auto px-6">
            <h1 className={styles.title}>
              The Future of <br />
              <span className={styles.highlight}>Local Commerce.</span>
            </h1>
            <p className={styles.subtitle}>
              An immersive digital storefront for your neighborhood.
              Find premium local goods, order with ease, and experience the Oasis.
            </p>

            <div className="max-w-xl mx-auto mt-12 mb-16 relative z-10 glass p-1 rounded-[2.5rem]">
              <GlobalSearch />
            </div>

            <div className={styles.cta}>
              <Link href="/marketplace" className="px-10 py-5 bg-amber-400 text-black rounded-full font-black text-xl shadow-2xl shadow-amber-900/40 hover:scale-105 transition-all">
                Enter The Oasis →
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.deliveryBanner}>
          <div className="container mx-auto px-6">
            <h2 className={styles.deliveryTitle}>
              Neighborhood <span className={styles.deliveryHighlight}>Concierge</span>
            </h2>
            <p className={styles.deliveryDescription}>
              We bridge the gap between local shops and your door. Seamless logistics for a United community.
            </p>
            <div className={styles.deliveryMethods}>
              <div className={styles.methodCard}>
                <span className={styles.methodIcon}>✨</span>
                <h4>Personal Checkout</h4>
                <p>Curated service for every order. We handle the details so you don't have to.</p>
              </div>
              <div className={styles.methodCard}>
                <span className={styles.methodIcon}>🛡️</span>
                <h4>Secure Payments</h4>
                <p>Integrated trust at every step. Pay securely via PayPal or our direct merchant link.</p>
              </div>
              <div className={styles.methodCard}>
                <span className={styles.methodIcon}>🚀</span>
                <h4>Swift Delivery</h4>
                <p>Local drivers who know your neighborhood. Fast, safe, and reliable.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.discovery}>
          <div className="container mx-auto px-6">
            <h2 className={styles.sectionTitle}>
              {externalPlaces.length > 0 || searchQuery ? 'Discovered Places' : 'Featured Partners'}
            </h2>

            <div className={styles.nearbyGrid}>
              {internalBusinesses.map((business) => (
                <Link href={`/shop/${business.slug || business.id}`} key={business.id} className={styles.businessCard}>
                  <div className={styles.businessImage} style={{ backgroundImage: business.image_url ? `url(${business.image_url})` : 'none' }} />
                  <div className={styles.businessInfo}>
                    <span className={styles.badge}>Oasis Partner</span>
                    <h4 className="mt-3">{business.name}</h4>
                    <p>{business.category || 'Local Business'} • {business.location || 'Nearby'}</p>
                  </div>
                </Link>
              ))}

              {externalPlaces.map((place) => (
                <div key={place.place_id} className={styles.businessCard}>
                  <div className={styles.businessImage} style={{ backgroundImage: place.image ? `url(${place.image})` : 'none' }} />
                  <div className={styles.businessInfo}>
                    <span className={styles.badge}>Local Gem</span>
                    <div className="flex justify-between items-start mt-3">
                      <h4 className="flex-1">{place.name}</h4>
                      {place.rating && <span className="text-amber-400 font-bold text-xs ml-2">★ {place.rating}</span>}
                    </div>
                    <p className="line-clamp-1">{place.formatted_address}</p>
                    <div className="flex gap-2 mt-4">
                      <a href={`tel:${place.phone}`} className="text-[10px] font-black px-4 py-1.5 bg-white/5 text-white/90 rounded-full border border-white/10 hover:bg-white/10 transition-colors">CALL TO ORDER</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className={styles.footer}>
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src="/logo.png" alt="OasisUnited" style={{ height: '48px', width: 'auto', opacity: 0.8, filter: 'brightness(1.5)' }} />
          </div>
          <p className="mb-8">&copy; 2026 OasisUnited. The premium standard for local commerce.</p>
          <div className="flex justify-center gap-8">
            <Link href="/login" className="text-sm border-b border-transparent hover:border-white/20 transition-all">Merchant Portal</Link>
            <Link href="tel:5085070305" className="text-sm border-b border-transparent hover:border-white/20 transition-all">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
