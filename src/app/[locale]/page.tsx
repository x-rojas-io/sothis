import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { supabase } from '@/lib/supabase';
import { getInstagramPosts } from '@/lib/instagram';
import type { Service } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return {
        title: 'Therapeutic Massage in Edgewater, NJ | Sothis Therapeutic Massage',
        description: 'Expert therapeutic massage in Edgewater, NJ. Relieve back pain, reduce stress, and restore energy. Book your session with Nancy Raza, Licensed Massage Therapist.',
        alternates: { canonical: `https://sothistherapeutic.com/${locale}` },
    };
}

async function getAllServices() {
    const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
    return (services || []) as Service[];
}

const CheckIcon = () => (
    <svg className="w-5 h-5 text-teal-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const InstagramIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'HomePage' });
    const lang = locale as 'en' | 'es';
    const [services, instagramPosts] = await Promise.all([getAllServices(), getInstagramPosts(locale)]);
    const previewPosts = instagramPosts.slice(0, 3);

    const painPoints = locale === 'es' ? [
        { icon: '😣', title: 'Dolor de espalda crónico', quote: '"He normalizado el dolor."' },
        { icon: '😓', title: 'Estrés y ansiedad diaria', quote: '"No puedo desconectarme."' },
        { icon: '😴', title: 'Energía baja, mal sueño', quote: '"Me despierto agotado/a."' },
    ] : [
        { icon: '😣', title: 'Chronic back pain', quote: '"I\'ve just normalized the pain."' },
        { icon: '😓', title: 'Daily stress & anxiety', quote: '"I can\'t seem to switch off."' },
        { icon: '😴', title: 'Low energy, poor sleep', quote: '"I wake up already exhausted."' },
    ];

    const steps = locale === 'es' ? [
        { num: '01', title: 'Elige tu sesión', desc: 'Selecciona el servicio que más se adapta a tus necesidades.' },
        { num: '02', title: 'Reserva en línea', desc: 'Elige fecha y hora. Fácil y sin llamadas telefónicas.' },
        { num: '03', title: 'Ven y siéntelo', desc: 'Llega, relájate y sal sintiéndote transformado/a.' },
    ] : [
        { num: '01', title: 'Choose your session', desc: 'Pick the service that fits your needs.' },
        { num: '02', title: 'Book online in 60 sec', desc: 'Select your date and time - no phone calls needed.' },
        { num: '03', title: 'Come in & feel the change', desc: 'Arrive, relax, and leave feeling transformed.' },
    ];

    return (
        <div className="flex flex-col">

            {/* ═══════════════════════════════════════════
                1. HERO - Cinematic full-bleed
            ═══════════════════════════════════════════ */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden">
                {/* Background image */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/services/sothis-therapeutic-massage.jpg"
                        alt="Sothis Therapeutic Massage session in Edgewater NJ"
                        fill
                        className="object-cover object-center"
                        priority
                        quality={90}
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-900/70 to-stone-900/30" />
                </div>

                {/* Content */}
                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-24 w-full">
                    <div className="max-w-2xl">
                        {/* Location badge */}
                        <div className="inline-flex items-center gap-2 rounded-full bg-teal-600/20 border border-teal-500/30 backdrop-blur-sm px-4 py-1.5 mb-8">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                            <span className="text-teal-300 text-xs font-semibold tracking-widest uppercase">Edgewater, NJ · New Clients Welcome</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight tracking-tight">
                            {locale === 'es' ? (
                                <>Tu cuerpo <span className="text-teal-400">habla.</span><br />¿Lo estás escuchando?</>
                            ) : (
                                <>Your body is <span className="text-teal-400">talking.</span><br />Are you listening?</>
                            )}
                        </h1>

                        <p className="mt-6 text-lg sm:text-xl text-stone-300 leading-relaxed max-w-xl">
                            {locale === 'es'
                                ? 'Masaje terapéutico personalizado en Edgewater, NJ. Alivia el dolor, reduce el estrés y recarga tu energía.'
                                : 'Expert therapeutic massage in Edgewater, NJ. Relieve pain, reduce stress, and restore your energy - personalized to you.'}
                        </p>

                        {/* Trust signals */}
                        <div className="mt-6 flex flex-wrap gap-4 text-sm text-stone-400">
                            <span className="flex items-center gap-1.5"><CheckIcon /> {locale === 'es' ? 'Terapeuta licenciada' : 'Licensed Therapist'}</span>
                            <span className="flex items-center gap-1.5"><CheckIcon /> {locale === 'es' ? 'Sesiones personalizadas' : 'Personalized Sessions'}</span>
                            <span className="flex items-center gap-1.5"><CheckIcon /> {locale === 'es' ? 'Resultados reales' : 'Real Results'}</span>
                        </div>

                        {/* CTAs */}
                        <div className="mt-10 flex flex-col sm:flex-row gap-4">
                            <Link
                                href={`/${locale}/book`}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-900/40 hover:bg-teal-500 hover:scale-105 active:scale-95 transition-all duration-200"
                            >
                                {locale === 'es' ? 'Reservar mi sesión' : 'Book My Session'} →
                            </Link>
                            <Link
                                href={`/${locale}/services`}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all duration-200"
                            >
                                {locale === 'es' ? 'Ver servicios' : 'See Services'}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Scroll hint */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 animate-bounce">
                    <span className="text-xs tracking-widest uppercase">Scroll</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                2. TRUST STRIP
            ═══════════════════════════════════════════ */}
            <div className="bg-teal-900 border-y border-teal-800">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 py-5">
                    <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-center">
                        {[
                            { stat: '50+', label: locale === 'es' ? 'Clientes felices' : 'Happy clients' },
                            { stat: locale === 'es' ? 'Licenciada' : 'Licensed & Insured', label: locale === 'es' ? 'y asegurada' : 'Therapist' },
                            { stat: locale === 'es' ? 'Personalizado' : 'Personalized', label: locale === 'es' ? 'cada sesión' : 'every session' },
                            { stat: locale === 'es' ? 'Edgewater' : 'Edgewater, NJ', label: locale === 'es' ? 'Nueva Jersey' : 'Easy parking' },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <span className="text-lg font-bold text-white">{item.stat}</span>
                                <span className="text-xs text-teal-300 uppercase tracking-wider">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                3. PAIN POINTS - "Do you feel this way?"
            ═══════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 bg-stone-50">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-teal-600 text-sm font-bold tracking-widest uppercase mb-3">
                            {locale === 'es' ? 'Reconoces esto?' : 'Sound familiar?'}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
                            {locale === 'es' ? '¿Te sientes así?' : 'Do you feel this way?'}
                        </h2>
                        <p className="mt-3 text-stone-500 max-w-xl mx-auto">
                            {locale === 'es'
                                ? 'El masaje terapéutico no es un lujo, es una solución real para tu bienestar.'
                                : 'Therapeutic massage isn\'t a luxury, it\'s a real solution for how you feel.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {painPoints.map((point, i) => (
                            <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="text-5xl mb-4">{point.icon}</div>
                                <h3 className="font-bold text-stone-900 text-lg mb-2">{point.title}</h3>
                                <p className="text-stone-500 italic text-sm leading-relaxed">{point.quote}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <Link
                            href={`/${locale}/book`}
                            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-sm font-bold text-white hover:bg-teal-700 hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                            {locale === 'es' ? 'Quiero sentirme mejor →' : 'I want to feel better →'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                4. SERVICES
            ═══════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 bg-white">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-teal-600 text-sm font-bold tracking-widest uppercase mb-3">
                            {locale === 'es' ? 'Lo que ofrecemos' : 'What we offer'}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">{t('Services.title')}</h2>
                        <p className="mt-3 text-stone-500">{t('Services.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <div key={service.id} className="group rounded-3xl bg-stone-50 border border-stone-100 p-8 hover:bg-teal-900 hover:border-teal-800 transition-all duration-300 flex flex-col">
                                <h3 className="text-xl font-bold text-stone-900 group-hover:text-white transition-colors mb-3">
                                    {service.title[lang] || service.title['en']}
                                </h3>
                                <p className="text-stone-500 group-hover:text-teal-200 text-sm leading-relaxed flex-1 transition-colors">
                                    {service.description[lang] || service.description['en']}
                                </p>
                                {service.price && (service.price[lang] || service.price['en']) && (
                                    <p className="mt-4 text-2xl font-bold text-teal-700 group-hover:text-teal-300 transition-colors">
                                        {service.price[lang] || service.price['en']}
                                        <span className="text-sm font-normal text-stone-400 group-hover:text-teal-400 ml-1">{locale === 'es' ? '/ sesión' : '/ session'}</span>
                                    </p>
                                )}
                                <Link
                                    href={`/${locale}/book`}
                                    className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-stone-200 group-hover:border-teal-500 py-2.5 text-sm font-semibold text-stone-700 group-hover:text-white group-hover:bg-teal-600 hover:scale-105 transition-all duration-200"
                                >
                                    {locale === 'es' ? 'Reservar' : 'Book Now'}
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Link href={`/${locale}/services`} className="text-sm font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-4 transition-colors">
                            {locale === 'es' ? 'Ver todos los servicios →' : 'View all services →'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                5. HOW IT WORKS - 3 Steps
            ═══════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 bg-stone-900 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-teal-800/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-700/15 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-teal-400 text-sm font-bold tracking-widest uppercase mb-3">
                            {locale === 'es' ? 'Así de simple' : 'Simple as this'}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                            {locale === 'es' ? '¿Cómo funciona?' : 'How it works'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting line on desktop */}
                        <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-teal-700/0 via-teal-600/60 to-teal-700/0" />

                        {steps.map((step, i) => (
                            <div key={i} className="relative flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-teal-800/50 border border-teal-600/50 flex items-center justify-center mb-6 z-10">
                                    <span className="text-2xl font-bold text-teal-300">{step.num}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-stone-400 text-sm leading-relaxed max-w-xs">{step.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-14 text-center">
                        <Link
                            href={`/${locale}/book`}
                            className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-10 py-4 text-base font-bold text-white hover:bg-teal-500 hover:scale-105 transition-all duration-200 shadow-lg shadow-teal-900/50"
                        >
                            {locale === 'es' ? 'Reservar ahora →' : 'Book Now →'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                6. INSTAGRAM PREVIEW
            ═══════════════════════════════════════════ */}
            {previewPosts.length > 0 && (
                <section className="py-20 sm:py-28 bg-white">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                            <div>
                                <p className="text-teal-600 text-sm font-bold tracking-widest uppercase mb-2">
                                    {locale === 'es' ? 'Síguenos' : 'Follow along'}
                                </p>
                                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
                                    {locale === 'es' ? 'Desde nuestro Instagram' : 'From Our Instagram'}
                                </h2>
                            </div>
                            <a
                                href="https://instagram.com/sothistherapeutic"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-5 py-2.5 text-sm font-semibold text-white hover:scale-105 transition-transform duration-200 shadow-md whitespace-nowrap self-start sm:self-auto"
                            >
                                <InstagramIcon /> @sothistherapeutic
                            </a>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {previewPosts.map((post, i) => (
                                <a
                                    key={post.id}
                                    href={post.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block overflow-hidden rounded-2xl bg-stone-100"
                                    style={{ aspectRatio: '1/1' }}
                                >
                                    <img
                                        src={post.media_url}
                                        alt={post.caption || 'Sothis Instagram post'}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                    />
                                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/60 transition-all duration-300 flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-4">
                                            <InstagramIcon />
                                            <p className="text-white text-xs mt-2 line-clamp-3 leading-relaxed">{post.caption}</p>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>

                        <div className="mt-8 text-center">
                            <Link href={`/${locale}/blog`} className="text-sm font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-4 transition-colors">
                                {locale === 'es' ? 'Ver todos los posts →' : 'See all posts →'}
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            <section className="relative overflow-hidden bg-stone-900 py-24 sm:py-32">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-teal-800/20 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal-700/15 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

                <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 text-center">
                    <h2 className="text-4xl sm:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
                        {locale === 'es' ? '¿Listo para sentirte mejor?' : 'Ready to feel better?'}
                    </h2>
                    <p className="mt-4 text-lg sm:text-xl text-stone-300 max-w-xl mx-auto font-normal leading-relaxed">
                        {locale === 'es'
                            ? 'Tu primera sesión podría ser esta semana. Nuevos clientes bienvenidos.'
                            : 'Your first session could be this week. New clients always welcome.'}
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={`/${locale}/book`}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-10 py-4 text-base font-bold text-white hover:bg-teal-500 hover:scale-105 transition-all duration-200 shadow-lg shadow-teal-950/50"
                        >
                            {locale === 'es' ? 'Reservar mi sesión →' : 'Book My Appointment →'}
                        </Link>
                        <a
                            href="tel:+12012345678"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all duration-200"
                        >
                            📍 Edgewater, NJ
                        </a>
                    </div>
                </div>
            </section>

        </div>
    );
}
