import React from 'react';
import { getBlogPosts } from '@/lib/markdown';
import BlogCard from '@/components/BlogCard';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'BlogPage' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function BlogPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const posts = getBlogPosts(locale);
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
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
