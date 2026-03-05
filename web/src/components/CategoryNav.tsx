"use client";
import { useState } from 'react';

const categories = [
    { name: 'All', icon: '✨' },
    { name: 'Rewards', icon: '💎', path: '/marketplace/rewards' },
    { name: 'Fashion', icon: '👗' },
    { name: 'Tech', icon: '⚡' },
    { name: 'Home', icon: '🏠' },
    { name: 'Eats', icon: '🍔' },
    { name: 'Beauty', icon: '✨' },
    { name: 'Art', icon: '🎨' },
];

interface CategoryNavProps {
    onCategoryChange: (category: string) => void;
}

export default function CategoryNav({ onCategoryChange }: CategoryNavProps) {
    const [active, setActive] = useState('All');

    const handleSelect = (name: string) => {
        setActive(name);
        onCategoryChange(name);
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
            {categories.map((cat: any) => (
                <button
                    key={cat.name}
                    onClick={() => handleSelect(cat.name)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-lg ${active === cat.name
                        ? 'bg-indigo-600 text-white scale-105 shadow-indigo-500/40 border border-indigo-400'
                        : 'bg-white/5 text-indigo-200/40 border border-white/5 hover:bg-white/10'
                        }`}
                >
                    <span className="text-lg">{cat.icon}</span>
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
