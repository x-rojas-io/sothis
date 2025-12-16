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

    // We can iterate over keys if there were multiple, but for now we can hardcode the one service 
    // or genericize it. Given there is only one, accessing directly is fine or array mapping
    const services = ['therapeutic'];

    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">{t('heading')}</h1>
                    <p className="mt-2 text-lg leading-8 text-stone-600">
                        {t('subheading')}
                    </p>
                </div>

                {/* Benefits Graphic */}
                <div className="mx-auto mt-12 max-w-4xl">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg">
                        <img
                            src="/sothis_benefits.png"
                            alt="Sothis Therapeutic Massage Benefits"
                            className="w-full h-auto"
                        />
                    </div>
                </div>

                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                    {services.map((key) => (
                        <Card key={key} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-xl font-bold text-stone-900">{t(`items.${key}.title`)}</h3>
                                    <span className="text-lg font-semibold text-secondary">{t(`items.${key}.price`)}</span>
                                </div>
                                <p className="text-sm text-stone-500 mt-1">{t(`items.${key}.duration`)}</p>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-stone-600">{t(`items.${key}.description`)}</p>
                            </CardContent>
                            <CardFooter>
                                <Button href="/book" className="w-full">{t('bookNow')}</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
