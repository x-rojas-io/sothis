'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function WhatsAppWidget() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const t = useTranslations('WhatsAppWidget');
    const [showPrompt, setShowPrompt] = useState(false);

    // Show prompt after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Strict Role Check: Hide for Admins/Providers on ALL pages
    const role = (session?.user as any)?.role;
    if (pathname?.includes('/admin') || role === 'admin' || role === 'provider') return null;

    const sothisPhone = '15512414652';
    const waLink = `https://wa.me/${sothisPhone}?text=${encodeURIComponent(t('prefilledMessage'))}`;

    return (
        <>
            {/* Call to Action Prompt */}
            <AnimatePresence>
                {showPrompt && (
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        className="fixed bottom-24 left-6 z-50 max-w-[280px]"
                    >
                        <div className="relative bg-white text-stone-800 px-4 py-3 rounded-2xl shadow-xl border border-stone-200 text-sm font-medium pr-8">
                            <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShowPrompt(false)}
                                className="hover:text-[#25D366] transition-colors block"
                            >
                                {t('tooltip')}
                            </a>
                            <button
                                onClick={() => setShowPrompt(false)}
                                className="absolute top-2.5 right-2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                                aria-label="Close prompt"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                            {/* Little speech bubble tail */}
                            <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-r border-b border-stone-200 rotate-45"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* WhatsApp Floating Button */}
            <div className="fixed bottom-6 left-6 z-50 flex items-center justify-center">
                {/* Pulsing Ring for visual highlight */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none scale-150"></span>
                
                <motion.a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowPrompt(false)}
                    className="relative p-4 rounded-full shadow-lg bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow duration-300"
                    aria-label="Chat on WhatsApp"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                    {/* Custom WhatsApp SVG Icon */}
                    <svg
                        className="w-6 h-6 fill-current"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </motion.a>
            </div>
        </>
    );
}
