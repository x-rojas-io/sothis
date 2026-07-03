import React from 'react';
import { getInstagramPosts } from '@/lib/instagram';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'BlogPage' });

    return {
        title: t('instagramHeading'),
        description: t('instagramSubheading'),
    };
}

const InstagramIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

export default async function BlogPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const instagramPosts = await getInstagramPosts(locale);
    const t = await getTranslations({ locale, namespace: 'BlogPage' });

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 py-24 sm:py-32">
                {/* Decorative gradient blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-pink-500/20 via-rose-500/10 to-transparent blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-yellow-500/15 via-orange-400/10 to-transparent blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    {/* Instagram badge */}
                    <div className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[2px] mb-8 shadow-lg shadow-pink-500/20">
                        <div className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2">
                            <InstagramIcon className="w-4 h-4 text-pink-400" />
                            <span className="text-xs font-semibold tracking-widest text-pink-300 uppercase">@sothistherapeutic</span>
                        </div>
                    </div>

                    <h1 className="text-4xl font-serif font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        {t('instagramHeading')}
                    </h1>
                    <p className="mt-4 text-lg leading-8 text-stone-400 max-w-2xl mx-auto">
                        {t('instagramSubheading')}
                    </p>

                    {/* Follow button */}
                    <div className="mt-8 flex justify-center">
                        <a
                            href="https://instagram.com/sothistherapeutic"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            <InstagramIcon className="w-4 h-4" />
                            {t('followUs')}
                        </a>
                    </div>
                </div>
            </div>

            {/* Instagram Grid */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 sm:py-20">
                {instagramPosts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {instagramPosts.map((post, index) => (
                            <a
                                key={post.id}
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block overflow-hidden rounded-3xl bg-stone-100 shadow-md hover:shadow-2xl hover:shadow-stone-900/20 transition-all duration-500"
                                style={{ aspectRatio: '1/1' }}
                            >
                                {/* Image */}
                                <img
                                    src={post.media_url}
                                    alt={post.caption || 'Instagram Post'}
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading={index < 3 ? 'eager' : 'lazy'}
                                />

                                {/* Gradient overlay always visible at bottom */}
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                                {/* Date badge always visible */}
                                <div className="absolute bottom-3 left-3">
                                    <span className="text-[10px] font-semibold tracking-widest uppercase text-white/80">
                                        {new Date(post.timestamp).toLocaleDateString(locale, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-stone-950/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6 text-white backdrop-blur-[3px]">
                                    <div className="flex justify-between items-start">
                                        <div className="rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-2 shadow-lg">
                                            <InstagramIcon className="w-5 h-5 fill-white" />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold tracking-widest bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                            {new Date(post.timestamp).toLocaleDateString(locale, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs line-clamp-5 leading-relaxed font-sans text-stone-200 italic">
                                            {post.caption}
                                        </p>
                                        <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-pink-400 group-hover:text-pink-300 transition-colors">
                                            View on Instagram ↗
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 text-stone-400">
                        <InstagramIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">No posts available</p>
                    </div>
                )}

                {/* Bottom CTA */}
                <div className="mt-16 text-center">
                    <p className="text-stone-500 text-sm mb-4">Follow us for daily wellness tips and updates</p>
                    <a
                        href="https://instagram.com/sothistherapeutic"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-900 font-semibold text-sm border-b-2 border-stone-300 hover:border-stone-700 pb-0.5 transition-all duration-200"
                    >
                        <InstagramIcon className="w-4 h-4" />
                        @sothistherapeutic
                    </a>
                </div>
            </div>
        </div>
    );
}
