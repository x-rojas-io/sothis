'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import type { Booking, TimeSlot } from '@/lib/supabase';

type BookingWithSlot = Booking & { time_slot: TimeSlot };

export default function BookingsPage() {
    const [bookings, setBookings] = useState<BookingWithSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'today' | 'week'>('upcoming');

    useEffect(() => {
        // Check URL params for filter
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get('filter') as any;
        if (filterParam && ['all', 'upcoming', 'past', 'today', 'week'].includes(filterParam)) {
            setFilter(filterParam);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [filter]);

    async function fetchBookings() {
        try {
            const response = await fetch('/api/admin/bookings');
            if (!response.ok) throw new Error('Failed to fetch bookings');
            const allBookings = await response.json();

            // Client-side filtering
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            let filtered = allBookings;

            if (filter === 'upcoming') {
                filtered = allBookings.filter((b: any) =>
                    b.time_slot.date >= today && b.status === 'confirmed'
                );
            } else if (filter === 'past') {
                filtered = allBookings.filter((b: any) =>
                    b.time_slot.date < today
                );
            } else if (filter === 'today') {
                filtered = allBookings.filter((b: any) =>
                    b.time_slot.date === today && b.status === 'confirmed'
                );
            } else if (filter === 'week') {
                filtered = allBookings.filter((b: any) =>
                    b.time_slot.date >= today && b.time_slot.date <= nextWeek && b.status === 'confirmed'
                );
            } else if (filter === 'all') {
                // Return everything
                filtered = allBookings;
            }

            setBookings(filtered);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCancelBooking(bookingId: string) {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            const response = await fetch('/api/admin/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookingId, status: 'cancelled' }),
            });

            if (!response.ok) throw new Error('Failed to cancel booking');
            await fetchBookings();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking');
        }
    }

    async function handleMarkCompleted(bookingId: string) {
        try {
            const response = await fetch('/api/admin/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookingId, status: 'completed' }),
            });

            if (!response.ok) throw new Error('Failed to update booking');
            await fetchBookings();
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Failed to update booking');
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="text-center py-12">Loading...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-stone-900">Bookings</h1>
                        <p className="mt-2 text-stone-600">Manage all appointments</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'upcoming'
                                ? 'bg-secondary text-white'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setFilter('past')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'past'
                                ? 'bg-secondary text-white'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                }`}
                        >
                            Past
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'all'
                                ? 'bg-secondary text-white'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                }`}
                        >
                            All
                        </button>
                    </div>
                </div>

                {/* Bookings List */}
                <div className="bg-white rounded-lg border border-stone-200">
                    <div className="divide-y divide-stone-200">
                        {bookings.length === 0 ? (
                            <div className="p-6 text-center text-stone-500">
                                No bookings found
                            </div>
                        ) : (
                            bookings.map((booking) => (
                                <div key={booking.id} className="p-6 hover:bg-stone-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="font-semibold text-stone-900 text-lg">
                                                    {booking.client_name}
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${booking.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : booking.status === 'cancelled'
                                                        ? 'bg-red-100 text-red-800'
                                                        : booking.status === 'completed'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-stone-100 text-stone-800'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                <div className="text-sm text-stone-600">
                                                    📧 {booking.client_email}
                                                </div>
                                                {booking.client_phone && (
                                                    <div className="text-sm text-stone-600">
                                                        📱 {booking.client_phone}
                                                    </div>
                                                )}
                                                <div className="text-sm text-stone-600">
                                                    💆 {booking.service_type}
                                                </div>
                                                {booking.notes && (
                                                    <div className="text-sm text-stone-600 mt-2 p-2 bg-stone-50 rounded">
                                                        <strong>Notes:</strong> {booking.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right ml-6">
                                            <div className="font-medium text-stone-900">
                                                {new Date(booking.time_slot.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                            <div className="text-sm text-stone-600 mt-1">
                                                {booking.time_slot.start_time.slice(0, 5)} - {booking.time_slot.end_time.slice(0, 5)}
                                            </div>
                                            {booking.status === 'confirmed' && (
                                                <div className="mt-4 space-y-2">
                                                    <button
                                                        onClick={() => handleMarkCompleted(booking.id)}
                                                        className="block w-full text-sm text-blue-600 hover:text-blue-700"
                                                    >
                                                        Mark Completed
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        className="block w-full text-sm text-red-600 hover:text-red-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
