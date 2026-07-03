import React from 'react';
import fs from 'fs';
import path from 'path';
import Card, { CardHeader, CardContent, CardFooter } from '@/components/Card';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'TestimonialsPage' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

async function getTestimonials(locale: string): Promise<Testimonial[]> {
    // Determine file based on locale
    const filename = locale === 'es' ? 'testimonials.es.json' : 'testimonials.json';
    const filePath = path.join(process.cwd(), 'data', filename);

    // Fallback to English if file doesn't exist
    const finalPath = fs.existsSync(filePath) ? filePath : path.join(process.cwd(), 'data', 'testimonials.json');

    const jsonData = fs.readFileSync(finalPath, 'utf8');
    return JSON.parse(jsonData);
}

interface Testimonial {
    id: number;
    name: string;
    quote: string;
    rating: number;
    time: string;
    url: string;
}

const StarIcon = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
        <svg className={`${sizeClasses} text-amber-400`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10.868 2.784c-.304-.793-1.432-.793-1.736 0l-2.09 5.448-5.748.42c-.845.062-1.187 1.124-.543 1.691l4.4 3.865-1.378 5.617c-.203.83.693 1.48 1.408 1.002L10 17.587l4.792 2.84c.715.478 1.61-.172 1.408-1.002l-1.379-5.617 4.4-3.865c.644-.567.302-1.629-.543-1.691l-5.748-.42-2.09-5.448z" clipRule="evenodd" />
        </svg>
    );
};

const GoogleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
);

const colors = [
    'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
    'bg-blue-500', 'bg-teal-500', 'bg-green-500', 'bg-yellow-600',
    'bg-orange-500', 'bg-stone-500'
];

function getAvatarColor(name: string) {
    if (!name) return colors[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
        sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
}

function getInitials(name: string) {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function TestimonialsPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const testimonials = await getTestimonials(locale);
    const t = await getTranslations({ locale, namespace: 'TestimonialsPage' });

    return (
        <div className="bg-stone-50 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">{t('heading')}</h1>
                    <p className="mt-2 text-lg leading-8 text-stone-600">
                        {t('subheading')}
                    </p>
                </div>

                {/* Google reviews summary badge */}
                <div className="mx-auto mt-12 max-w-md bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4 text-center sm:max-w-xl sm:flex-row sm:text-left sm:justify-between">
                    <div className="flex flex-col items-center sm:items-start">
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-stone-900">5.0</span>
                            <div className="flex text-amber-400 gap-0.5">
                                <StarIcon />
                                <StarIcon />
                                <StarIcon />
                                <StarIcon />
                                <StarIcon />
                            </div>
                        </div>
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                            <GoogleIcon className="w-3.5 h-3.5" />
                            {t('googleRating')}
                        </p>
                        <p className="text-sm text-stone-600 mt-1">
                            {t('basedOn', { count: testimonials.length })}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <a 
                            href="https://g.page/r/CeMf2YxkFe54EAE/review"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-850 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                            {t('writeReview')}
                        </a>
                    </div>
                </div>

                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {testimonials.map((testimonial: Testimonial) => {
                        const avatarColor = getAvatarColor(testimonial.name);
                        const initials = getInitials(testimonial.name);

                        return (
                            <Card key={testimonial.id} className="bg-white flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
                                <CardHeader className="flex items-center justify-between border-b border-stone-100/50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-inner`}>
                                            {initials}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-stone-900 text-sm">{testimonial.name}</div>
                                            <div className="text-xs text-stone-400 mt-0.5">{testimonial.time}</div>
                                        </div>
                                    </div>
                                    <div className="flex text-amber-400 gap-0.5">
                                        <StarIcon size="sm" />
                                        <StarIcon size="sm" />
                                        <StarIcon size="sm" />
                                        <StarIcon size="sm" />
                                        <StarIcon size="sm" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5 flex-grow">
                                    <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
                                        &quot;{testimonial.quote}&quot;
                                    </p>
                                </CardContent>
                                <CardFooter className="border-t border-stone-50 pt-3 justify-between items-center text-[10px] text-stone-400 uppercase tracking-widest font-semibold bg-stone-50/50 px-6 py-3">
                                    <span className="flex items-center gap-1.5">
                                        <GoogleIcon className="w-3.5 h-3.5" />
                                        Google Review
                                    </span>
                                    {testimonial.url && (
                                        <a 
                                            href={testimonial.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-stone-500 hover:text-stone-850 transition-colors lowercase"
                                        >
                                            verify ↗
                                        </a>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
