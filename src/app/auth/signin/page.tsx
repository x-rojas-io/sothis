'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card, { CardContent, CardHeader } from '@/components/Card';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'verify'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/admin');
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            if (step === 'email') {
                // Send OTP
                const res = await fetch('/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to send code');
                }

                setMessage('✅ Code sent! Check your email.');
                setStep('verify');
            } else {
                // Verify OTP
                const result = await signIn('credentials', {
                    email,
                    code: otp,
                    redirect: false,
                });

                if (result?.error) {
                    throw new Error('Invalid code or expired.');
                }
                // Success - router/effect will handle redirect
                setMessage('✅ Signed in successfully!');
            }
        } catch (error: any) {
            setMessage(`❌ ${error.message || 'An error occurred'}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'authenticated') {
        return <div className="text-center py-24">Redirecting to dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-stone-900">Sign In</h1>
                    <p className="mt-2 text-stone-600">Admin Dashboard Access</p>
                </div>

                <Card>
                    <CardHeader>
                        <h2 className="text-center text-lg font-semibold text-stone-900">
                            {step === 'email' ? 'Email Sign In' : 'Enter Verification Code'}
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 'email' ? (
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                                        Email address
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-stone-500 sm:text-sm"
                                            placeholder="nancy@example.com"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-stone-700">
                                        Verification Code
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="otp"
                                            name="otp"
                                            type="text"
                                            required
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="block w-full text-center tracking-[1em] font-bold text-2xl rounded-md border border-stone-300 px-3 py-2 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-stone-500"
                                            placeholder="123456"
                                            maxLength={6}
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-center text-stone-500 mt-2">Sent to {email}</p>
                                </div>
                            )}

                            {message && (
                                <div className={`p-4 rounded-md text-sm ${message.startsWith('✅')
                                    ? 'bg-green-50 text-green-800'
                                    : 'bg-red-50 text-red-800'
                                    }`}>
                                    {message}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : (step === 'email' ? 'Send Code' : 'Verify & Sign In')}
                            </Button>

                            {step === 'verify' && (
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="w-full text-center text-sm text-stone-500 hover:text-stone-800 mt-2"
                                >
                                    Back to Email
                                </button>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
