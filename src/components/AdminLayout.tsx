'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminNavigation = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Availability', href: '/admin/availability' },
    { name: 'Time Slots', href: '/admin/slots' },
    { name: 'Bookings', href: '/admin/bookings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Admin Header */}
            <header className="bg-white border-b border-stone-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="text-xl font-serif font-bold text-primary">
                                SOTHIS Admin
                            </Link>
                            <nav className="hidden md:flex gap-6">
                                {adminNavigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`text-sm font-medium transition-colors ${pathname === item.href
                                                ? 'text-secondary'
                                                : 'text-stone-600 hover:text-secondary'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="text-sm text-stone-600 hover:text-stone-900"
                            >
                                View Site
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
