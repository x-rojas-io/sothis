import React from 'react';
import { getMarkdownContent } from '@/lib/markdown';

export const metadata = {
    title: 'About - Sothis Therapeutic Massage | Nancy Raza, LMT',
    description: 'Learn about Nancy Raza and the meaning of Sothis. Therapeutic massage in Edgewater, NJ focused on renewal, healing, and wellness.',
};

export default async function AboutPage() {
    const { contentHtml, title } = await getMarkdownContent('about');

    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:mx-0">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">{title}</h1>
                </div>
                <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">
                    {/* Nancy's Photo */}
                    <div className="lg:pr-8">
                        <div className="relative overflow-hidden rounded-2xl shadow-xl">
                            <img
                                src="/nancy_raza.png"
                                alt="Nancy Raza - Licensed Massage Therapist"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </div>
                    {/* Bio Content */}
                    <div>
                        <div
                            className="prose prose-lg prose-stone max-w-none"
                            dangerouslySetInnerHTML={{ __html: contentHtml }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
