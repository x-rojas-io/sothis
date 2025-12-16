'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import { usePathname, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

const navigation = [
    { name: 'home', href: '/' },
    { name: 'about', href: '/about' },
    { name: 'services', href: '/services' },
    { name: 'testimonials', href: '/testimonials' },
    { name: 'blog', href: '/blog' },
    { name: 'contact', href: '/contact' },
];

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const t = useTranslations('Navigation');

    return (
        <>
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-100">
                <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
                    <div className="flex lg:flex-1">
                        <Link href="/" className="-m-1.5 p-1.5 flex items-center">
                            <Image
                                src="/logo.jpg"
                                alt="SOTHIS"
                                width={192}
                                height={64}
                                className="h-16 w-auto"
                                priority
                            />
                        </Link>
                    </div>
                    <div className="flex lg:hidden">
                        <button
                            type="button"
                            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-stone-700"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="hidden lg:flex lg:gap-x-12 items-center">
                        {(!session?.user || (session.user as any).role !== 'admin') && navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-sm font-semibold leading-6 transition-colors ${pathname === item.href ? 'text-secondary' : 'text-stone-900 hover:text-secondary'
                                    }`}
                            >
                                {t(`items.${item.name}`)}
                            </Link>
                        ))}

                        {/* Language Switcher Desktop */}
                        <div className="flex items-center gap-2 border-l border-stone-200 pl-4 ml-2">
                            <Link href={pathname} locale="en" className="text-sm font-medium hover:text-secondary">EN</Link>
                            <span className="text-stone-300">|</span>
                            <Link href={pathname} locale="es" className="text-sm font-medium hover:text-secondary">ES</Link>
                        </div>

                        {/* Desktop Auth Links */}
                        {status === 'authenticated' ? (
                            <div className="flex items-center gap-x-6">
                                {(session?.user as any).role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        className={`text-sm font-semibold leading-6 transition-colors ${pathname.startsWith('/admin') ? 'text-secondary' : 'text-stone-900 hover:text-secondary'}`}
                                    >
                                        Dashboard
                                    </Link>
                                )}
                                {(session?.user as any).role !== 'admin' && (
                                    <Link
                                        href="/my-bookings"
                                        className={`text-sm font-semibold leading-6 transition-colors ${pathname === '/my-bookings' ? 'text-secondary' : 'text-stone-900 hover:text-secondary'}`}
                                    >
                                        My Bookings
                                    </Link>
                                )}
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="text-sm font-semibold leading-6 text-stone-900 hover:text-secondary transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/book"
                                className="text-sm font-semibold leading-6 text-stone-900 hover:text-secondary transition-colors"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                    <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                        {(!session?.user || (session.user as any).role !== 'admin') && (
                            <Button href="/book" size="sm" >{t('book')}</Button>
                        )}
                    </div>
                </nav>
            </header>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-white px-6 py-6 lg:hidden sm:max-w-sm sm:ring-1 sm:ring-stone-900/10 w-full h-full"
                    >
                        <div className="flex items-center justify-between">
                            <Link href="/" className="-m-1.5 p-1.5 flex items-center" onClick={() => setMobileMenuOpen(false)}>
                                <Image
                                    src="/logo.jpg"
                                    alt="SOTHIS"
                                    width={192}
                                    height={64}
                                    className="h-16 w-auto"
                                />
                            </Link>
                            <button
                                type="button"
                                className="-m-2.5 rounded-md p-2.5 text-stone-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-stone-500/10">
                                <div className="space-y-2 py-6">
                                    {/* Language Switcher Mobile */}
                                    <div className="flex items-center gap-4 py-2">
                                        <Link href={pathname} locale="en" className="text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50" onClick={() => setMobileMenuOpen(false)}>English</Link>
                                        <Link href={pathname} locale="es" className="text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50" onClick={() => setMobileMenuOpen(false)}>Español</Link>
                                    </div>

                                    {(!session?.user || (session.user as any).role !== 'admin') && navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {t(`items.${item.name}`)}
                                        </Link>
                                    ))}
                                    {status === 'authenticated' ? (
                                        <>
                                            {(session?.user as any).role === 'admin' && (
                                                <Link
                                                    href="/admin"
                                                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            {(session?.user as any).role !== 'admin' && (
                                                <Link
                                                    href="/my-bookings"
                                                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    My Bookings
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setMobileMenuOpen(false);
                                                    signOut({ callbackUrl: '/' });
                                                }}
                                                className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50"
                                            >
                                                Sign Out
                                            </button>
                                        </>
                                    ) : (
                                        <Link
                                            href="/book"
                                            className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Sign In
                                        </Link>
                                    )}
                                </div>
                                <div className="py-6">
                                    {(!session?.user || (session.user as any).role !== 'admin') && (
                                        <Button href="/book" className="w-full justify-center" onClick={() => setMobileMenuOpen(false)}>
                                            {t('book')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
