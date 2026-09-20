"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navLinks } from '@/data/HeaderData/HeaderData';
import { cn } from '@/lib/utils';

export default function HeaderClient() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Navigation — segmented pill control */}
            <nav className={cn(
                "hidden md:flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-100/70 p-1",
                "dark:border-white/10 dark:bg-white/5"
            )}>
                {navLinks.map((link) => {
                    const isActive = pathname === link.url;
                    return (
                        <Link
                            key={link.id}
                            href={link.url}
                            className={cn(
                                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-300",
                                isActive 
                                    ? "bg-white text-gray-950 shadow-sm dark:bg-gray-950 dark:text-white"
                                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                            )}
                        >
                            {link.title}
                        </Link>
                    );
                })}
            </nav>

            {/* Mobile Menu Toggle — custom animated hamburger */}
            <button
                className={cn(
                    "md:hidden relative size-9 rounded-full text-gray-700 outline-hidden focus-visible:ring-2 focus-visible:ring-gray-950",
                    "dark:text-gray-200 dark:focus-visible:ring-white"
                )}
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-panel"
            >
                <span
                    className={`absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 bg-current transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-2'
                        }`}
                />
                <span
                    className={`absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 bg-current transition-opacity duration-200 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                        }`}
                />
                <span
                    className={`absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 bg-current transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-2'
                        }`}
                />
            </button>

            {/* Mobile Navigation Panel — solid card, native CSS entrance */}
            {isMobileMenuOpen && (
                <div
                    id="mobile-nav-panel"
                    className={cn(
                        "md:hidden absolute inset-x-3 top-full mt-2 rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-950/5 transition-[opacity,transform] duration-300 ease-out starting:opacity-0 starting:scale-95",
                        "dark:border-white/10 dark:bg-gray-950"
                    )}
                >
                    <nav className="flex flex-col gap-1 p-2">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.url;
                            return (
                                <Link
                                    key={link.id}
                                    href={link.url}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200",
                                        isActive
                                            ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                                    )}
                                >
                                    {link.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </>
    );
}