"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const navItems = [
    { label: 'Overview', href: '/dashboard', icon: '📊' },
    { label: 'Recent Orders', href: '/dashboard/orders', icon: '📋' },
    { label: 'Team / Staff', href: '/dashboard/staff', icon: '🛡️' },
    { label: 'CRM / Customers', href: '/dashboard/crm', icon: '👥' },
    { label: 'Messages', href: '/dashboard/messages', icon: '💬' },
    { label: 'Products', href: '/dashboard/products', icon: '📦' },
    { label: 'Posts & Events', href: '/dashboard/posts', icon: '📢' },
    { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <Link href="/" className={styles.logo} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                <img src="/logo.png" alt="OasisUnited" style={{ height: '60px', width: 'auto' }} className="hover:scale-105 transition-transform" />
            </Link>

            <div className="mt-8 mb-4 px-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Store Management</p>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.link} ${isActive ? styles.active : ''}`}
                        >
                            <span className={`${styles.icon} ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                            <span className="flex-1">{item.label}</span>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>}
                        </Link>
                    );
                })}
            </nav>
            <div className={styles.footer}>
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg">
                        BO
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-black text-gray-900 truncate">Business Owner</div>
                        <div className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-tighter">Premium Vendor</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
