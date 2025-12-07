'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card, { CardContent, CardHeader } from '@/components/Card';

export default function SignInPage() {
    const [email, setEmail] = useState('');
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
            const result = await signIn('email', {
                email,
                redirect: false,
                callbackUrl: '/admin',
            });

            if (result?.error) {
                setMessage('❌ Failed to send sign in link. Please try again.');
            } else {
                setMessage('✅ Check your email! A sign in link has been sent.');
                setEmail('');
            }
        } catch (error) {
            setMessage('❌ An error occurred. Please try again.');
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
                        <h2 className="text-center text-lg font-semibold text-stone-900">Email Sign In</h2>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                    />
                                </div>
                            </div>

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
                                {isLoading ? 'Sending Link...' : 'Sign in with Email'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
