import React from 'react';
import fs from 'fs';
import path from 'path';
import Card, { CardContent } from '@/components/Card';

export const metadata = {
    title: 'Testimonials - SOTHIS Therapeutic Massage',
    description: 'Read what our clients have to say about their experience.',
};

async function getTestimonials() {
    const filePath = path.join(process.cwd(), 'data', 'testimonials.json');
    const jsonData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(jsonData);
}

interface Testimonial {
    id: number;
    name: string;
    quote: string;
    role: string;
}

export default async function TestimonialsPage() {
    const testimonials = await getTestimonials();

    return (
        <div className="bg-stone-50 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">Client Testimonials</h1>
                    <p className="mt-2 text-lg leading-8 text-stone-600">
                        We are honored to be part of our clients&apos; healing journeys.
                    </p>
                </div>
                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {testimonials.map((testimonial: Testimonial) => (
                        <Card key={testimonial.id} className="bg-white">
                            <CardContent className="pt-6">
                                <blockquote className="text-stone-900 italic">
                                    &quot;{testimonial.quote}&quot;
                                </blockquote>
                                <div className="mt-6 border-t border-stone-100 pt-4">
                                    <div className="font-semibold text-stone-900">{testimonial.name}</div>
                                    <div className="text-sm text-stone-500">{testimonial.role}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
