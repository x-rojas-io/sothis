'use client';

import React from 'react';
import Card, { CardContent } from '@/components/Card';
import { useTranslations } from 'next-intl';
import type { Service } from '@/lib/supabase';

interface ClientServicesPageProps {
    locale: string;
    services: Service[];
}

export default function ClientServicesPage({ locale, services }: ClientServicesPageProps) {
    const t = useTranslations('ServicesPage');
    const lang = locale as 'en' | 'es'; // Enforce type safety for key access

    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">{t('heading')}</h1>
                    <p className="mt-2 text-lg leading-8 text-stone-600">
                        {t('subheading')}
                    </p>
                </div>

                {/* Benefits Section */}
                <div className="mx-auto mt-16 max-w-4xl bg-stone-50 rounded-2xl p-8 mb-16">
                    <h2 className="text-2xl font-bold text-center text-stone-900 mb-8">{t('benefits.title')}</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['0', '1', '2', '3', '4'] as const).map((idx) => (
                            <li key={idx} className="flex items-start">
                                <span className="mr-2 text-primary">✓</span>
                                <span className="text-stone-700">{t(`benefits.items.${idx}`)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {services.map((service) => (
                        <Card key={service.id} className="flex flex-col justify-between overflow-hidden">
                            {/* Image - Natural Aspect Ratio */}
                            <div className="w-full relative">
                                <img
                                    src={service.image_url}
                                    alt={service.title[lang] || service.title['en']}
                                    className="w-full h-64 object-cover block"
                                />
                            </div>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-semibold leading-8 text-stone-900">
                                    {service.title[lang] || service.title['en']}
                                </h3>
                                <p className="mt-4 text-base leading-7 text-stone-600">
                                    {service.description[lang] || service.description['en']}
                                </p>
                            </CardContent>
                            <div className="border-t border-stone-100 bg-stone-50 p-6">
                                <div className="flex items-center justify-between text-sm leading-6">
                                    <div className="font-semibold text-stone-900">
                                        {service.duration[lang] || service.duration['en']}
                                    </div>
                                    <div className="text-stone-500">
                                        {service.price[lang] || service.price['en']}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {services.length === 0 && (
                        <div className="col-span-full text-center text-stone-500 py-12">
                            No services found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
