import React from 'react';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import { Link } from '@/i18n/routing';
import { getTranslations, getLocale } from 'next-intl/server';

// ── Types ──────────────────────────────────────────────────────────
interface Testimonial {
    id: number;
    name: string;
    quote: string;
    rating: number;
    time: string;
    url: string;
}

// ── Data fetching ──────────────────────────────────────────────────
async function getTestimonials(locale: string): Promise<Testimonial[]> {
    const filename = locale === 'es' ? 'testimonials.es.json' : 'testimonials.json';
    const filePath = path.join(process.cwd(), 'data', filename);
    const finalPath = fs.existsSync(filePath) ? filePath : path.join(process.cwd(), 'data', 'testimonials.json');
    return JSON.parse(fs.readFileSync(finalPath, 'utf8'));
}

// ── Sub-components ─────────────────────────────────────────────────
const avatarColors = [
    'bg-teal-600', 'bg-emerald-600', 'bg-cyan-700',
    'bg-indigo-600', 'bg-violet-600', 'bg-rose-600',
    'bg-amber-600', 'bg-orange-600', 'bg-stone-600',
];

function getAvatarColor(name: string) {
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return avatarColors[sum % avatarColors.length];
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Stars = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-stone-600'}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.868 2.784c-.304-.793-1.432-.793-1.736 0l-2.09 5.448-5.748.42c-.845.062-1.187 1.124-.543 1.691l4.4 3.865-1.378 5.617c-.203.83.693 1.48 1.408 1.002L10 17.587l4.792 2.84c.715.478 1.61-.172 1.408-1.002l-1.379-5.617 4.4-3.865c.644-.567.302-1.629-.543-1.691l-5.748-.42-2.09-5.448z" />
            </svg>
        ))}
    </div>
);

const GoogleIcon = () => (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
);

const InstagramIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

// ── Main Footer ────────────────────────────────────────────────────
export default async function Footer() {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: 'Footer' });
    const navT = await getTranslations({ locale, namespace: 'Navigation' });

    const allTestimonials = await getTestimonials(locale);
    const googleRating = '5.0';
    const reviewCount = allTestimonials.length;

    return (
        <footer className="bg-stone-950 text-stone-300 border-t-4 border-teal-700">


            {/* ══════════════════════════════════════════════
                MAIN FOOTER - Horizontal Layout
            ══════════════════════════════════════════════ */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
                {/* Row 1: Brand & Nav */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-stone-800">
                    <Link href="/" className="inline-flex items-center gap-3 group w-fit">
                        <div className="rounded-full ring-2 ring-teal-700/50 p-0.5">
                            <Image
                                src="/logo.jpg"
                                alt="Sothis Therapeutic Massage"
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="font-serif font-bold text-sm text-white tracking-wide">SOTHIS</span>
                            <span className="text-[10px] text-teal-400 tracking-widest uppercase font-medium">Therapeutic Massage</span>
                        </div>
                    </Link>

                    <nav className="flex flex-wrap items-center gap-x-8 gap-y-3">
                        {[
                            { href: '/', label: navT('items.home') },
                            { href: '/about', label: navT('items.about') },
                            { href: '/blog', label: navT('items.blog') },
                            { href: '/contact', label: navT('items.contact') },
                            { href: '/book', label: locale === 'es' ? 'Reservar' : 'Book Now' },
                        ].map(item => (
                            <Link key={item.href} href={item.href} className="text-sm text-stone-400 hover:text-teal-400 transition-colors">
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Row 2: Location & Connect details */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pt-8 text-sm text-stone-400">
                    {/* Location Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-y-3 gap-x-8">
                        <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>{t('locationText')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>🕐</span>
                            <span>
                                {locale === 'es'
                                    ? 'Lun–Sáb: 9am – 7pm'
                                    : 'Mon–Sat: 9am – 7pm'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>🅿️</span>
                            <span>{locale === 'es' ? 'Estacionamiento disponible' : 'Parking available'}</span>
                        </div>
                    </div>

                    {/* Connect & Rating */}
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-4">
                            <a
                                href="https://instagram.com/sothistherapeutic"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-pink-400 transition-colors group"
                            >
                                <span className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center border border-stone-800 group-hover:bg-pink-500/20 transition-colors">
                                    <InstagramIcon />
                                </span>
                                <span>Instagram</span>
                            </a>
                            <a
                                href="https://g.page/r/CeMf2YxkFe54EAE/review"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-teal-400 transition-colors group"
                            >
                                <span className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center border border-stone-800 group-hover:bg-teal-500/20 transition-colors">
                                    <GoogleIcon />
                                </span>
                                <span>{locale === 'es' ? 'Reseñas' : 'Reviews'}</span>
                            </a>
                        </div>

                        {/* Mini rating badge */}
                        <div className="flex items-center gap-2 bg-stone-900 rounded-lg px-3 py-1.5 border border-stone-800">
                            <Stars rating={5} />
                            <span className="text-xs text-stone-400">
                                <strong className="text-white">{googleRating}</strong> · {reviewCount} {locale === 'es' ? 'reseñas' : 'reviews'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                ZONE 3 - Copyright Bar
            ══════════════════════════════════════════════ */}
            <div className="border-t border-stone-800">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-stone-500">
                        {t('copyright', { year: new Date().getFullYear() })}
                    </p>
                    <p className="text-xs text-stone-600">
                        Developed by{' '}
                        <a href="https://github.com/x-rojas-io" target="_blank" rel="noopener noreferrer" className="hover:text-stone-400 transition-colors">
                            Nestor Rojas
                        </a>
                    </p>
                </div>
            </div>

        </footer>
    );
}
