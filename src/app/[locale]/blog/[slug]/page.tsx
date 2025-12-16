import React from 'react';
import { getBlogPost, getBlogPosts } from '@/lib/markdown';
import { Link } from '@/i18n/routing';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export async function generateStaticParams() {
    const posts = getBlogPosts();
    return posts.map((post) => ({
        slug: post.id,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params;
    const post = await getBlogPost(slug, locale);
    return {
        title: `${post.title} - SOTHIS Blog`,
        description: post.excerpt,
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params;
    const post = await getBlogPost(slug, locale);

    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-3xl px-6 lg:px-8">
                <div className="mb-8">
                    <Link href="/blog" className="flex items-center text-sm font-semibold text-secondary hover:text-secondary/80">
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to Blog
                    </Link>
                </div>
                <article>
                    <header className="mb-10">
                        <div className="text-sm text-stone-500 mb-2">{post.date} • {post.author}</div>
                        <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">{post.title}</h1>
                    </header>
                    <div
                        className="prose prose-lg prose-stone max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                    />
                </article>
            </div>
        </div>
    );
}
