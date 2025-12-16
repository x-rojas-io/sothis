'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

export default function GenerateSlotsPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const today = new Date();
        const twoWeeksLater = new Date(today);
        twoWeeksLater.setDate(today.getDate() + 14);

        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(twoWeeksLater.toISOString().split('T')[0]);
    }, []);

    async function handleGenerateSlots(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/admin/generate-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate, endDate }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`✅ Successfully generated ${data.count} time slots!`);
                // Optional: Redirect to bookings to see them? Or just stay here to generate more.
            } else {
                setMessage(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            setMessage('❌ Failed to generate slots. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Top Nav: Back to Dashboard */}
                <div>
                    <Link href="/admin" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors mb-4">
                        <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Dashboard
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-stone-900">Generate Availability</h1>
                        <p className="mt-1 text-stone-600">
                            Bulk create time slots based on your default schedule.
                        </p>
                    </div>
                    {/* Link to Master Calendar */}
                    <Link href="/admin/bookings" className="text-primary hover:text-primary-dark font-medium text-sm">
                        View Calendar &rarr;
                    </Link>
                </div>

                {/* Generate Form */}
                <div className="bg-white rounded-lg border border-stone-200 p-6 max-w-2xl mx-auto shadow-sm">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">Select Date Range</h2>
                    <form onSubmit={handleGenerateSlots} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-md border border-stone-300 px-3 py-2 focus:ring-primary focus:border-primary transition-shadow"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-md border border-stone-300 px-3 py-2 focus:ring-primary focus:border-primary transition-shadow"
                                    required
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm font-bold text-blue-900 mb-2">How it works:</h3>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>Slots are generated based on your <strong>Availability Templates</strong> (e.g. 9am - 5pm).</li>
                                <li><strong>15-minute buffer</strong> is automatically added between slots.</li>
                                <li><strong>Existing slots</strong> are skipped (no duplicates).</li>
                                <li>After generating, go to the <strong><Link href="/admin/bookings" className="underline hover:text-blue-600">Calendar</Link></strong> to block specific times.</li>
                            </ul>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-lg ${message.startsWith('✅')
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                {message}
                            </div>
                        )}

                        <Button type="submit" disabled={loading} className="w-full justify-center py-3 text-base">
                            {loading ? 'Generating...' : 'Generate Slots'}
                        </Button>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
