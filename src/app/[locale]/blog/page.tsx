import React from 'react';
import { getAllBlogPosts } from '@/lib/blog';
import { getInstagramPosts } from '@/lib/instagram';
import BlogCard from '@/components/BlogCard';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'BlogPage' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

const InstagramIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

export default async function BlogPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const posts = await getAllBlogPosts(locale);
    const instagramPosts = await getInstagramPosts();
    const t = await getTranslations({ locale, namespace: 'BlogPage' });

    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">{t('heading')}</h1>
                    <p className="mt-2 text-lg leading-8 text-stone-600">
                        {t('subheading')}
                    </p>
                </div>
                
                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {posts.map((post) => (
                        <BlogCard
                            key={post.id}
                            id={post.id}
                            title={post.title}
                            excerpt={post.excerpt}
                            date={post.date}
                            author={post.author}
                            imageUrl={post.imageUrl}
                            href={post.href}
                        />
                    ))}
                </div>

                {/* Instagram Feed Section */}
                {instagramPosts.length > 0 && (
                    <div className="mt-24 border-t border-stone-200 pt-16">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">
                                {t('instagramHeading')}
                            </h2>
                            <p className="mt-2 text-lg leading-8 text-stone-600">
                                {t('instagramSubheading')}
                            </p>
                            <div className="mt-6 flex justify-center">
                                <a
                                    href="https://instagram.com/sothistherapeutic"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <InstagramIcon className="w-5 h-5 fill-current" />
                                    {t('followUs')}
                                </a>
                            </div>
                        </div>

                        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                            {instagramPosts.map((post) => (
                                <a
                                    key={post.id}
                                    href={post.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block overflow-hidden rounded-2xl bg-stone-100 aspect-square shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    {/* Image */}
                                    <img
                                        src={post.media_url}
                                        alt={post.caption || 'Instagram Post'}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6 text-white backdrop-blur-[2px]">
                                        <div className="flex justify-between items-start">
                                            <InstagramIcon className="w-6 h-6 fill-white" />
                                            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                                                {new Date(post.timestamp).toLocaleDateString(locale, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs line-clamp-4 leading-relaxed font-sans text-stone-100 italic">
                                                {post.caption}
                                            </p>
                                            <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-pink-400 group-hover:text-pink-300">
                                                view post ↗
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
