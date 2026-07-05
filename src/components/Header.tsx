'use client';

import React, { useState, useEffect } from 'react';
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
    { name: 'blog', href: '/blog' },
    { name: 'contact', href: '/contact' },
];

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const t = useTranslations('Navigation');

    const isHomePage = pathname === '/';

    // Set mounted flag to prevent SSR/client hydration mismatch
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!isHomePage) { setScrolled(false); return; }
        const handleScroll = () => setScrolled(window.scrollY > 60);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHomePage]);

    // Only apply home-page transparent style after client mounts
    // (avoids SSR/hydration mismatch flicker)
    const isTransparent = mounted && isHomePage && !scrolled;

    // Hide Header on Admin Pages
    if (pathname && (pathname.startsWith('/admin') || pathname.includes('/admin/'))) {
        return null;
    }

    // isTransparent = dark hero style (home page top)
    // NOT "see-through" - it's a dark bg that matches the hero
    const linkClass = (active: boolean) =>
        `text-sm font-semibold leading-6 transition-colors duration-200 ${
            isTransparent
                ? active ? 'text-teal-300' : 'text-white/90 hover:text-white'
                : active ? 'text-teal-700' : 'text-stone-700 hover:text-teal-700'
        }`;

    return (
        <>
            <header
                className={`sticky top-0 z-50 transition-all duration-500 ${
                    isTransparent
                        ? 'bg-stone-950/70 backdrop-blur-sm border-b border-white/10'
                        : 'bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm'
                }`}
            >
                <nav className="mx-auto flex max-w-7xl items-center justify-between p-3 lg:px-8" aria-label="Global">
                    {/* Logo */}
                    <div className="flex lg:flex-1">
                        <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3 group">
                            {/* Logo circle with adaptive ring */}
                            <div className={`relative flex-shrink-0 rounded-full p-0.5 transition-all duration-500 ${
                                isTransparent
                                    ? 'ring-2 ring-white/30 shadow-xl shadow-black/40'
                                    : 'ring-2 ring-teal-200/70 shadow-md shadow-teal-50'
                            }`}>
                                <Image
                                    src="/logo.jpg"
                                    alt="SOTHIS"
                                    width={56}
                                    height={56}
                                    className="h-14 w-14 rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    priority
                                />
                            </div>
                            {/* Brand name - desktop only */}
                            <div className="hidden lg:flex flex-col leading-none">
                                <span className={`font-serif font-bold text-base tracking-wide transition-colors duration-500 ${
                                    isTransparent ? 'text-white' : 'text-stone-900'
                                }`}>SOTHIS</span>
                                <span className={`text-[10px] tracking-widest uppercase font-medium transition-colors duration-500 ${
                                    isTransparent ? 'text-teal-300' : 'text-teal-600'
                                }`}>Therapeutic Massage</span>
                            </div>
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <div className="flex lg:hidden">
                        <button
                            type="button"
                            className={`-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 transition-colors ${
                                isTransparent ? 'text-white' : 'text-stone-700'
                            }`}
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Desktop nav links */}
                    <div className="hidden lg:flex lg:gap-x-10 items-center">
                        {(!session?.user || (session.user as any).role !== 'admin') && navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={linkClass(pathname === item.href)}
                            >
                                {t(`items.${item.name}`)}
                            </Link>
                        ))}

                        {/* Language Switcher Desktop */}
                        <div className={`flex items-center gap-2 border-l pl-4 ml-2 transition-colors duration-200 ${
                            isTransparent ? 'border-white/20' : 'border-stone-200'
                        }`}>
                            <Link
                                href={pathname}
                                locale="en"
                                className={`text-sm font-medium transition-colors duration-200 ${
                                    isTransparent ? 'text-white/80 hover:text-white' : 'text-stone-600 hover:text-teal-700'
                                }`}
                            >EN</Link>
                            <span className={isTransparent ? 'text-white/30' : 'text-stone-300'}>|</span>
                            <Link
                                href={pathname}
                                locale="es"
                                className={`text-sm font-medium transition-colors duration-200 ${
                                    isTransparent ? 'text-white/80 hover:text-white' : 'text-stone-600 hover:text-teal-700'
                                }`}
                            >ES</Link>
                        </div>

                        {/* Desktop Auth Links */}
                        {status === 'authenticated' ? (
                            <div className="flex items-center gap-x-6">
                                {(session?.user as any).role === 'admin' && (
                                    <Link href="/admin" className={linkClass(pathname.startsWith('/admin'))}>
                                        Dashboard
                                    </Link>
                                )}
                                {(session?.user as any).role !== 'admin' && (
                                    <Link href="/my-bookings" className={linkClass(pathname === '/my-bookings')}>
                                        My Bookings
                                    </Link>
                                )}
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className={`text-sm font-semibold leading-6 transition-colors duration-200 ${
                                        isTransparent ? 'text-white/80 hover:text-white' : 'text-stone-700 hover:text-teal-700'
                                    }`}
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <Link href="/book" className={linkClass(false)}>
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Book Now CTA */}
                    <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                        {(!session?.user || (session.user as any).role !== 'admin') && (
                            <Button
                                href="/book"
                                size="sm"
                                className={isTransparent ? '!bg-white !text-stone-900 hover:!bg-teal-50 shadow-lg' : ''}
                            >
                                {t('book')}
                            </Button>
                        )}
                    </div>
                </nav>
            </header>

            {/* Mobile menu drawer */}
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
                                <Image src="/logo.jpg" alt="SOTHIS" width={56} height={56} className="h-12 w-12 rounded-full object-cover" />
                            </Link>
                            <button type="button" className="-m-2.5 rounded-md p-2.5 text-stone-700" onClick={() => setMobileMenuOpen(false)}>
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-stone-500/10">
                                <div className="space-y-2 py-6">
                                    <div className="flex items-center gap-4 py-2">
                                        <Link href={pathname} locale="en" className="text-base font-semibold text-stone-900 hover:bg-stone-50" onClick={() => setMobileMenuOpen(false)}>English</Link>
                                        <Link href={pathname} locale="es" className="text-base font-semibold text-stone-900 hover:bg-stone-50" onClick={() => setMobileMenuOpen(false)}>Español</Link>
                                    </div>
                                    {(!session?.user || (session.user as any).role !== 'admin') && navigation.map((item) => (
                                        <Link key={item.name} href={item.href} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50" onClick={() => setMobileMenuOpen(false)}>
                                            {t(`items.${item.name}`)}
                                        </Link>
                                    ))}
                                    {status === 'authenticated' ? (
                                        <>
                                            {(session?.user as any).role === 'admin' && (
                                                <Link href="/admin" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
                                            )}
                                            {(session?.user as any).role !== 'admin' && (
                                                <Link href="/my-bookings" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50" onClick={() => setMobileMenuOpen(false)}>My Bookings</Link>
                                            )}
                                            <button onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }} className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50">
                                                Sign Out
                                            </button>
                                        </>
                                    ) : (
                                        <Link href="/book" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-stone-900 hover:bg-stone-50" onClick={() => setMobileMenuOpen(false)}>
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
