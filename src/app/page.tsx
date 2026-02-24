import Link from 'next/link';
import styles from './page.module.css';
import AiDiscoveryModal from '@/components/AiDiscoveryModal';

export default function Home() {
  // Verifying deployment
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className={styles.logo} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="OasisUnited" style={{ height: '50px', width: 'auto' }} />
            <span>OasisUnited</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/shop/demo" className={styles.navLink}>Demo Store</Link>
            <Link href="tel:5085070305" className={styles.navLink} style={{ marginRight: '1rem' }}>Contact Me</Link>
            <Link href="/login" className="btn btn-primary">Log In</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            Connect Your Business <br />
            <span className={styles.highlight}>United with People.</span>
          </h1>
          <p className={styles.subtitle}>
            Create your premium digital storefront in minutes.
            Enable direct ordering, messaging, and events.
          </p>
          <div className={styles.cta}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Get Started
            </Link>
            <Link href="/shop/demo" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              View Example Page
            </Link>
          </div>
        </section>

        <section className={`container ${styles.features}`}>
          <div className={`${styles.featureCard} glass`}>
            <h3>Digital Storefront</h3>
            <p>Showcase your products with a beautiful, mobile-first design.</p>
          </div>
          <div className={`${styles.featureCard} glass`}>
            <h3>Direct Connect</h3>
            <p>Orders via SMS, Instagram, or direct checkout. You choose.</p>
          </div>
          <div className={`${styles.featureCard} glass`}>
            <h3>Analytics</h3>
            <p>Track views, orders, and customer engagement in real-time.</p>
          </div>
        </section>

        <section className={styles.discovery}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Suggestions Near You</h2>
            <div className={styles.nearbyGrid}>
              {[1, 2, 3].map((i) => (
                <Link href="/shop/demo" key={i} className={styles.businessCard}>
                  <div className={styles.businessImage} />
                  <div className={styles.businessInfo}>
                    <h4>Local Cafe {i}</h4>
                    <p>Open • 0.8 miles away</p>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button className="btn btn-outline">Use My Location</button>
            </div>
          </div>
        </section>

        <AiDiscoveryModal />
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2026 OasisUnited. All rights reserved.</p>
      </footer>
    </div>
  );
}
