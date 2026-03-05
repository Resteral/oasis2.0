"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GlobalNav() {
    const pathname = usePathname();

    const navItems = [
        { label: 'Explore', path: '/marketplace', icon: '🌍' },
        { label: 'Chat', path: '/messages', icon: '💬' },
        { label: 'Orders', path: '/my-oasis', icon: '🛍️' },
        { label: 'Home', path: '/', icon: '🏠' },
    ];

    // Don't show on specific administrative pages if needed
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/driver')) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-4rem)] max-w-lg">
            <nav className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-3 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] border border-white/50 flex justify-between items-center overflow-hidden">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-3xl transition-all duration-500 relative group ${isActive
                                ? 'bg-indigo-600/5 text-indigo-600'
                                : 'text-gray-400 hover:text-indigo-400'
                                }`}
                        >
                            <span className={`text-xl transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest transition-all ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-40'
                                }`}>
                                {item.label}
                            </span>

                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-600 rounded-full animate-in fade-in slide-in-from-top-1 duration-500"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
