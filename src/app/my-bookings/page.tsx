'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MyBookingsPage() {
    const { data: session, status } = useSession();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            signIn(undefined, { callbackUrl: '/my-bookings' });
        }
        if (status === 'authenticated') {
            fetchMyBookings();
        }
    }, [status]);

    async function fetchMyBookings() {
        try {
            const response = await fetch('/api/user/bookings');
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    }

    if (status === 'loading' || (loading && status === 'authenticated')) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-stone-500">Loading your bookings...</div>
            </div>
        );
    }

    if (!session) return null; // Will redirect

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            <Header />

            <main className="flex-grow pt-32 pb-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-stone-900">My Bookings</h1>
                            <p className="mt-2 text-stone-600">
                                Welcome back, {session.user?.name || session.user?.email}
                            </p>
                        </div>
                        <a href="/book" className="bg-stone-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors">
                            Book New Appointment
                        </a>
                    </div>

                    <div className="space-y-6">
                        {bookings.length === 0 ? (
                            <div className="bg-white rounded-lg p-12 text-center border border-stone-200">
                                <h3 className="text-lg font-medium text-stone-900">No bookings found</h3>
                                <p className="mt-2 text-stone-600">You haven't made any appointments yet.</p>
                                <a href="/book" className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium">
                                    Book your first massage &rarr;
                                </a>
                            </div>
                        ) : (
                            bookings.map((booking) => {
                                const date = new Date(booking.time_slot.date + 'T00:00:00');
                                const isUpcoming = date >= new Date();

                                return (
                                    <div
                                        key={booking.id}
                                        className={`bg-white rounded-lg border p-6 transition-all ${isUpcoming ? 'border-l-4 border-l-stone-900 shadow-sm' : 'border-stone-200 opacity-75'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-stone-100 text-stone-800'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                    {!isUpcoming && <span className="text-xs text-stone-500 font-medium border border-stone-200 px-2 py-1 rounded-full">Past</span>}
                                                </div>
                                                <h3 className="text-xl font-bold text-stone-900">Therapeutic Massage</h3>
                                                <div className="mt-2 space-y-1 text-stone-600">
                                                    <p>📅 {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                    <p>⏰ {booking.time_slot.start_time.slice(0, 5)} - {booking.time_slot.end_time.slice(0, 5)}</p>
                                                    <p>📍 Edgewater, NJ</p>
                                                </div>
                                            </div>

                                            {isUpcoming && booking.status === 'confirmed' && (
                                                <div className="text-right">
                                                    <p className="text-sm text-stone-500 mb-2">Need to change?</p>
                                                    <a href="mailto:sothistherapeutic@gmail.com" className="text-sm text-red-600 hover:text-red-800 font-medium">
                                                        Contact to Cancel
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
