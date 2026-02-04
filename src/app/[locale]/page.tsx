import React from 'react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Button from '@/components/Button';
import Card, { CardContent, CardHeader } from '@/components/Card';

import { supabase } from '@/lib/supabase';
import type { Service } from '@/lib/supabase';

// Force dynamic to ensure homepage shows latest service details
export const dynamic = 'force-dynamic';

async function getFeaturedService() {
  // Try to find "Therapeutic Massage" first by title (in English), or just get the first one
  // Since title is JSONB, we can't easily ILIKE on it without specific operator or just fetching all.
  // Let's just fetch all active and find one that looks like "therapeutic" or default to first.
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true);

  if (!services || services.length === 0) return null;

  // Find therapeutic preferably
  const featured = services.find(s =>
    (s.title['en'] && s.title['en'].toLowerCase().includes('therapeutic'))
  );

  return (featured || services[0]) as Service;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HomePage' });
  const featuredService = await getFeaturedService();
  const lang = locale as 'en' | 'es';

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-stone-100 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900 sm:text-6xl">
            {t('Hero.title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-stone-600 max-w-2xl mx-auto">
            {t('Hero.description')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button href="/book" size="lg">{t('Hero.bookNow')}</Button>
            <Button href="/services" size="lg" variant="secondary">{t('Hero.viewServices')}</Button>
            <Link href="/about" className="text-sm font-semibold leading-6 text-stone-900">
              {t('Hero.learnMore')} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">{t('Services.title')}</h2>
            <p className="mt-2 text-lg leading-8 text-stone-600">
              {t('Services.subtitle')}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl">
            {featuredService ? (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-bold text-stone-900">{featuredService.title[lang] || featuredService.title['en']}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600 text-lg leading-relaxed">
                    {featuredService.description[lang] || featuredService.description['en']}
                  </p>
                  <div className="mt-6 flex justify-center">
                    <Button href="/book" size="lg">{t('Services.therapeuticMassage.bookAppointment')}</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center text-stone-500">
                <p>No services currently available.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Massage Benefits */}
      <section className="py-24 sm:py-32 bg-stone-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">{t('Benefits.title')}</h2>
            <p className="mt-2 text-lg leading-8 text-stone-600">
              {t('Benefits.subtitle')}
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">❤️</div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">{t('Benefits.circulation.title')}</h3>
                    <p className="text-stone-600">{t('Benefits.circulation.description')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">🧘</div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">{t('Benefits.anxiety.title')}</h3>
                    <p className="text-stone-600">{t('Benefits.anxiety.description')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">💪</div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">{t('Benefits.fibromyalgia.title')}</h3>
                    <p className="text-stone-600">{t('Benefits.fibromyalgia.description')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-4xl">🛡️</div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">{t('Benefits.immuneSystem.title')}</h3>
                    <p className="text-stone-600">{t('Benefits.immuneSystem.description')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">{t('Testimonials.title')}</h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <blockquote className="text-stone-900">
                  <p>{t('Testimonials.review1')}</p>
                </blockquote>
                <div className="mt-6 font-semibold text-stone-900">– Sarah Jenkins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <blockquote className="text-stone-900">
                  <p>{t('Testimonials.review2')}</p>
                </blockquote>
                <div className="mt-6 font-semibold text-stone-900">– Michael Chen</div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-10 text-center">
            <Button href="/testimonials" variant="outline">{t('Testimonials.readMore')}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
