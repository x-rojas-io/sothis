'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Button from '@/components/Button';

const STORAGE_SUBSCRIBED_KEY = 'sothis_newsletter_subscribed';
const STORAGE_DISMISSED_KEY = 'sothis_newsletter_dismissed_until';
const DISMISS_DAYS = 30;

export default function NewsletterPopup() {
    const pathname = usePathname();
    const t = useTranslations('NewsletterPopup');

    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        // Do not show in admin or login routes
        if (pathname?.includes('/admin') || pathname?.includes('/auth') || pathname?.includes('/newsletter/unsubscribe')) {
            return;
        }

        // Check localStorage flags
        try {
            const isSubscribed = localStorage.getItem(STORAGE_SUBSCRIBED_KEY);
            if (isSubscribed === 'true') return;

            const dismissedUntil = localStorage.getItem(STORAGE_DISMISSED_KEY);
            if (dismissedUntil && Number(dismissedUntil) > Date.now()) return;
        } catch {
            // Ignore storage access errors in private/strict modes
        }

        // Trigger popup after 5 seconds
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, [pathname]);

    const handleDismiss = () => {
        setIsOpen(false);
        try {
            const dismissUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
            localStorage.setItem(STORAGE_DISMISSED_KEY, dismissUntil.toString());
        } catch {
            // Ignore storage error
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), source: 'home_popup' }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to subscribe');

            setSubmitted(true);
            try {
                localStorage.setItem(STORAGE_SUBSCRIBED_KEY, 'true');
            } catch {
                // Ignore storage error
            }

            // Auto-close after 4 seconds on success
            setTimeout(() => {
                setIsOpen(false);
            }, 4000);
        } catch (err: any) {
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
                        className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-stone-200 z-10 overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
                            aria-label="Close"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>

                        {submitted ? (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-sm">
                                    <CheckCircleIcon className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-stone-900">
                                    {t('successTitle')}
                                </h3>
                                <p className="text-sm text-stone-600 leading-relaxed">
                                    {t('successMessage')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 tracking-wider uppercase mb-1">
                                        <EnvelopeIcon className="w-3.5 h-3.5 text-secondary" />
                                        {t('tagline')}
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-stone-900 leading-tight">
                                        {t('title')}
                                    </h3>
                                    <p className="text-sm text-stone-600 leading-relaxed">
                                        {t('description')}
                                    </p>
                                </div>

                                {errorMessage && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs">
                                        {errorMessage}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t('placeholder')}
                                            required
                                            disabled={loading}
                                            className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-secondary focus:border-secondary shadow-inner disabled:opacity-50"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 justify-center text-sm font-bold shadow-md rounded-xl"
                                    >
                                        {loading ? t('submitting') : t('button')}
                                    </Button>
                                    <p className="text-[11px] text-center text-stone-400">
                                        {t('privacyNotice')}
                                    </p>
                                </form>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
