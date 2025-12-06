'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';
import Card, { CardContent } from '@/components/Card';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch (_error) {
            setStatus('error');
        }
    };

    return (
        <div className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">Contact Us</h1>
                    <p className="mt-2 text-lg leading-8 text-stone-600">
                        Have questions or want to book a session? Reach out to us.
                    </p>
                </div>

                <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">
                    {/* Contact Form */}
                    <Card>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-stone-900">Name</label>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="block w-full rounded-md border-0 py-1.5 text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-secondary sm:text-sm sm:leading-6 px-3"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-stone-900">Email</label>
                                    <div className="mt-2">
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="block w-full rounded-md border-0 py-1.5 text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-secondary sm:text-sm sm:leading-6 px-3"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium leading-6 text-stone-900">Subject</label>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="subject"
                                            id="subject"
                                            required
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="block w-full rounded-md border-0 py-1.5 text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-secondary sm:text-sm sm:leading-6 px-3"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium leading-6 text-stone-900">Message</label>
                                    <div className="mt-2">
                                        <textarea
                                            name="message"
                                            id="message"
                                            rows={4}
                                            required
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="block w-full rounded-md border-0 py-1.5 text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-secondary sm:text-sm sm:leading-6 px-3"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                                        {status === 'submitting' ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </div>
                                {status === 'success' && (
                                    <p className="text-green-600 text-sm text-center">Message sent successfully!</p>
                                )}
                                {status === 'error' && (
                                    <p className="text-red-600 text-sm text-center">Failed to send message. Please try again.</p>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Contact Info & Map Placeholder */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-stone-900">Location</h3>
                            <p className="mt-2 text-stone-600">
                                Edgewater, NJ<br />
                                <span className="text-sm text-stone-500">Serving Edgewater and surrounding areas</span>
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-stone-900">Hours</h3>
                            <p className="mt-2 text-stone-600">
                                By Appointment Only<br />
                                <span className="text-sm text-stone-500">Flexible scheduling available</span>
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-stone-900">Contact</h3>
                            <p className="mt-2 text-stone-600">
                                Email: <a href="mailto:sothistherapeutic@gmail.com" className="text-secondary hover:underline">sothistherapeutic@gmail.com</a><br />
                                Instagram: <a href="https://instagram.com/sothistherapeutic" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">@sothistherapeutic</a>
                            </p>
                        </div>
                        <div className="aspect-video bg-stone-200 rounded-lg flex items-center justify-center text-stone-500">
                            📍 Edgewater, NJ
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
