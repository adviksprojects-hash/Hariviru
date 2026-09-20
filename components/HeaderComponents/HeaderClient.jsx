"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navLinks } from '@/data/HeaderData/HeaderData';
import { cn } from '@/lib/utils';

export default function HeaderClient({ user }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Prepare links based on role
    let links = [...navLinks];

    if (user?.role === 'ADMIN') {
        links.unshift({ id: 'admin-dash', title: '⚡ Admin Portal', url: '/admin', isBadge: true });
    } else if (user?.role === 'MANAGER') {
        links.unshift({ id: 'mgr-dash', title: '💼 Manager Portal', url: '/manager', isBadge: true });
    }

    return (
        <>
            {/* Desktop Navigation */}
            <nav className={cn(
                "hidden md:flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50/80 p-1.5",
                "dark:border-gray-800 dark:bg-gray-900/60"
            )}>
                {links.map((link) => {
                    const isActive = pathname === link.url;
                    return (
                        <Link
                            key={link.id}
                            href={link.url}
                            className={cn(
                                "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                                link.isBadge
                                    ? "bg-linear-to-r from-rose-600 to-amber-600 text-white font-semibold shadow-sm hover:opacity-90"
                                    : isActive 
                                        ? "bg-white text-gray-950 shadow-xs dark:bg-gray-950 dark:text-white font-semibold"
                                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                            )}
                        >
                            {link.title}
                        </Link>
                    );
                })}
            </nav>

            {/* Mobile Menu Toggle Button */}
            <button
                className={cn(
                    "md:hidden relative size-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 outline-hidden flex items-center justify-center",
                    "dark:text-gray-200"
                )}
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
            >
                <span
                    className={`absolute h-0.5 w-5 bg-current transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`}
                />
                <span
                    className={`absolute h-0.5 w-5 bg-current transition-opacity duration-200 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}
                />
                <span
                    className={`absolute h-0.5 w-5 bg-current transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`}
                />
            </button>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div
                    id="mobile-nav-panel"
                    className={cn(
                        "md:hidden absolute inset-x-4 top-full mt-3 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-xl p-3 shadow-2xl transition-all duration-300 z-50",
                        "dark:border-gray-800 dark:bg-gray-950/95"
                    )}
                >
                    <nav className="flex flex-col gap-1.5">
                        {links.map((link) => {
                            const isActive = pathname === link.url;
                            return (
                                <Link
                                    key={link.id}
                                    href={link.url}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200 flex items-center justify-between",
                                        link.isBadge
                                            ? "bg-linear-to-r from-rose-600 to-amber-600 text-white font-semibold"
                                            : isActive
                                                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-semibold"
                                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900"
                                    )}
                                >
                                    <span>{link.title}</span>
                                    {isActive && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </>
    );
}