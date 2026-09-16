'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [valid, setValid] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setErrorMessage('Invalid unsubscribe link. No token provided.');
            return;
        }

        async function verifyToken() {
            try {
                const res = await fetch(`/api/newsletter/unsubscribe?token=${token}`);
                const data = await res.json();

                if (!res.ok || !data.valid) {
                    setErrorMessage(data.error || 'This unsubscribe link is invalid or has expired.');
                } else {
                    setValid(true);
                    setMaskedEmail(data.maskedEmail);
                    setIsActive(data.isActive);
                }
            } catch (err: any) {
                setErrorMessage('Unable to verify subscription. Please check your connection.');
            } finally {
                setLoading(false);
            }
        }

        verifyToken();
    }, [token]);

    const handleAction = async (action: 'unsubscribe' | 'resubscribe') => {
        setSubmitting(true);
        setErrorMessage(null);
        try {
            const res = await fetch('/api/newsletter/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, action })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update subscription');

            setIsActive(data.isActive);
            setMessage(data.message);
        } catch (err: any) {
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-stone-50">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-stone-200 text-center space-y-6">
                
                <div className="flex flex-col items-center">
                    <img
                        src="/logo.jpg"
                        alt="Sothis Logo"
                        className="w-14 h-14 rounded-full object-cover border-2 border-teal-600 shadow-sm mb-2"
                    />
                    <div className="font-serif text-lg font-bold tracking-wider text-stone-900 uppercase">
                        SOTHIS
                    </div>
                    <div className="text-[10px] text-teal-600 uppercase font-bold tracking-widest mt-0.5">
                        THERAPEUTIC MASSAGE
                    </div>
                </div>

                {loading ? (
                    <div className="py-8 text-stone-500 text-sm">Verifying subscription link...</div>
                ) : errorMessage ? (
                    <div className="py-6 space-y-4">
                        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                            <ExclamationTriangleIcon className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-stone-900">Link Invalid</h2>
                        <p className="text-xs text-stone-600 leading-relaxed">{errorMessage}</p>
                    </div>
                ) : !isActive ? (
                    <div className="py-6 space-y-4">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <CheckCircleIcon className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-stone-900">Unsubscribed</h2>
                        <p className="text-sm text-stone-600 leading-relaxed">
                            <strong>{maskedEmail}</strong> has been unsubscribed from our newsletter. You will no longer receive weekly tips or promotional emails.
                        </p>
                        <div className="pt-4 border-t border-stone-100">
                            <p className="text-xs text-stone-400 mb-3">Unsubscribed by mistake?</p>
                            <Button
                                variant="outline"
                                onClick={() => handleAction('resubscribe')}
                                disabled={submitting}
                                className="w-full justify-center text-xs font-semibold"
                            >
                                {submitting ? 'Restoring...' : '↩️ Keep Me Subscribed (Undo)'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 space-y-5">
                        <h2 className="text-xl font-serif font-bold text-stone-900">
                            Unsubscribe from Newsletter?
                        </h2>
                        <p className="text-sm text-stone-600 leading-relaxed">
                            Are you sure you want to stop receiving wellness insights, seasonal relief tips, and exclusive specials at <strong>{maskedEmail}</strong>?
                        </p>

                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={() => handleAction('unsubscribe')}
                                disabled={submitting}
                                className="w-full justify-center py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md"
                            >
                                {submitting ? 'Unsubscribing...' : 'Yes, Unsubscribe Me'}
                            </Button>

                            <a
                                href="/"
                                className="block text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors py-2"
                            >
                                Cancel and return to website
                            </a>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-stone-500">Loading...</div>}>
            <UnsubscribeContent />
        </Suspense>
    );
}
