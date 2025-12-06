import React from 'react';
import { getBlogPosts } from '@/lib/markdown';
import BlogCard from '@/components/BlogCard';

export const metadata = {
    title: 'Blog - SOTHIS Therapeutic Massage',
    description: 'Wellness tips, news, and updates from SOTHIS.',
};

export default function BlogPage() {
    const posts = getBlogPosts();

    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">SOTHIS Blog</h1>
                    <p className="mt-2 text-lg leading-8 text-stone-600">
                        Insights on holistic health, massage therapy, and self-care.
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
