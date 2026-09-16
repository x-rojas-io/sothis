'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { ChatBubbleLeftRightIcon, CheckCircleIcon, PhoneIcon } from '@heroicons/react/24/outline';

const SOTHIS_PHONE = '15512414652';

function ConnectContent() {
    const searchParams = useSearchParams();
    const topic = searchParams.get('topic') || 'Newsletter Inquiry';
    const initialMessage = searchParams.get('message') || `Hi Nancy! I saw your newsletter about "${topic}" and would like to ask a question / reserve a session.`;

    const [contactInfo, setContactInfo] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState(initialMessage);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const waWebUrl = `https://web.whatsapp.com/send?phone=${SOTHIS_PHONE}&text=${encodeURIComponent(message)}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        if (!contactInfo.trim()) {
            setErrorMessage('Please provide your phone number or email address.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim() || 'Newsletter Reader',
                    email: contactInfo.includes('@') ? contactInfo.trim() : `${contactInfo.replace(/[^0-9]/g, '')}@sms.sothis`,
                    subject: `🔥 Newsletter Inquiry: ${topic} (From ${contactInfo.trim()})`,
                    message: `Contact: ${contactInfo.trim()}\nName: ${name.trim() || 'Not specified'}\nTopic: ${topic}\n\nMessage:\n${message}`,
                }),
            });

            if (!res.ok) throw new Error('Failed to deliver message');
            setSubmitted(true);
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || 'Something went wrong. You can also text or call Nancy at (551) 241-4652.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50">
            <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-stone-200">
                
                {submitted ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <CheckCircleIcon className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-stone-900">Message Sent to Nancy!</h2>
                        <p className="text-stone-600 text-sm leading-relaxed">
                            Thank you! Nancy has received your inquiry directly and will reply to <strong>{contactInfo}</strong> as soon as possible.
                        </p>
                        <div className="pt-4 border-t border-stone-100">
                            <p className="text-xs text-stone-500 mb-2">Need an immediate answer?</p>
                            <a
                                href={`tel:${SOTHIS_PHONE}`}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
                            >
                                <PhoneIcon className="w-4 h-4" /> Call Nancy: (551) 241-4652
                            </a>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 mb-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Nancy Raza, LMT · Online & Available
                            </div>
                            <h1 className="text-2xl font-serif font-bold text-stone-900">Direct Message</h1>
                            <p className="text-xs text-stone-500">
                                Send a quick inquiry directly to Nancy with zero login or account required.
                            </p>
                        </div>

                        {errorMessage && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs">
                                {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                                    Your Phone or Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={contactInfo}
                                    onChange={(e) => setContactInfo(e.target.value)}
                                    placeholder="e.g. (201) 555-0199 or name@gmail.com"
                                    required
                                    className="w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:ring-2 focus:ring-secondary focus:border-secondary shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                                    Your Name <span className="text-stone-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your first name"
                                    className="w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:ring-2 focus:ring-secondary focus:border-secondary shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                                    Message
                                </label>
                                <textarea
                                    rows={3}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:ring-2 focus:ring-secondary focus:border-secondary shadow-sm"
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full py-3 justify-center text-sm font-bold shadow-md">
                                {loading ? 'Sending to Nancy...' : '🚀 Send Direct to Nancy'}
                            </Button>
                        </form>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-stone-200"></div>
                            <span className="flex-shrink mx-4 text-xs text-stone-400 font-medium uppercase">or</span>
                            <div className="flex-grow border-t border-stone-200"></div>
                        </div>

                        <div className="space-y-2 text-center">
                            <a
                                href={waWebUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] transition-colors shadow-sm"
                            >
                                <ChatBubbleLeftRightIcon className="w-4 h-4" /> Open in WhatsApp Web
                            </a>
                            <p className="text-[11px] text-stone-400">
                                Prefer phone? Call Nancy directly at <a href={`tel:${SOTHIS_PHONE}`} className="text-stone-700 font-semibold underline">(551) 241-4652</a>
                            </p>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

export default function ConnectPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-stone-500">Loading...</div>}>
            <ConnectContent />
        </Suspense>
    );
}
