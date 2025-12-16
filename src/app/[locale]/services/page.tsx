import React from 'react';
import Button from '@/components/Button';
import Card, { CardContent, CardFooter, CardHeader } from '@/components/Card';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ServicesPage' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

export default function ServicesPage() {
    const t = useTranslations('ServicesPage');

    const services = [
        { key: 'therapeutic', image: '/images/services/therapeutic.png' },
        { key: 'deepTissue', image: '/images/services/deep-tissue.png' },
        { key: 'sports', image: '/images/services/sports.png' },
        { key: 'triggerPoint', image: '/images/services/trigger-point.png' }
    ] as const;

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
                    {services.map(({ key, image }) => (
                        <Card key={key} className="flex flex-col justify-between overflow-hidden">
                            {/* Image - Natural Aspect Ratio */}
                            <div className="w-full relative">
                                <img
                                    src={image}
                                    alt={t(`items.${key}.title`)}
                                    className="w-full h-auto block"
                                />
                            </div>
                            <CardContent className="pt-6">
                                <h3 className="text-lg font-semibold leading-8 text-stone-900">{t(`items.${key}.title`)}</h3>
                                <p className="mt-4 text-base leading-7 text-stone-600">
                                    {t(`items.${key}.description`)}
                                </p>
                            </CardContent>
                            <div className="border-t border-stone-100 bg-stone-50 p-6">
                                <div className="flex items-center justify-between text-sm leading-6">
                                    <div className="font-semibold text-stone-900">{t(`items.${key}.duration`)}</div>
                                    <div className="text-stone-500">{t(`items.${key}.price`)}</div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
