import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Footer');
    const navT = useTranslations('Navigation'); // Reuse navigation links if possible, or just use Footer namespace if distinct.
    // Actually, Footer navigation labels matches Navigation keys usually.
    // But let's use the Navigation keys for the links text to be consistent.

    return (
        <footer className="bg-stone-900 text-stone-300">
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Navigation Links */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-semibold text-white">{t('navigation')}</h3>
                        <Link href="/about" className="hover:text-white transition-colors">{navT('about')}</Link>
                        <Link href="/services" className="hover:text-white transition-colors">{navT('services')}</Link>
                        <Link href="/blog" className="hover:text-white transition-colors">{navT('blog')}</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">{navT('contact')}</Link>
                    </div>

                    {/* Location */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-semibold text-white">{t('location')}</h3>
                        <p>{t('locationText')}</p>
                    </div>

                    {/* Social Media */}
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-semibold text-white">{t('connect')}</h3>
                        <a
                            href="https://instagram.com/sothistherapeutic"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors flex items-center gap-2"
                        >
                            <span>📷</span> @sothistherapeutic
                        </a>
                    </div>
                </div>

                <div className="mt-8 border-t border-stone-800 pt-8">
                    <p className="text-center text-xs leading-5">
                        {t('copyright', { year: new Date().getFullYear() })}
                    </p>
                    <p className="text-center text-xs leading-5 mt-2 text-stone-500">
                        Developed by <a href="https://github.com/x-rojas-io" target="_blank" rel="noopener noreferrer" className="hover:text-stone-300 transition-colors">Nestor Rojas</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
