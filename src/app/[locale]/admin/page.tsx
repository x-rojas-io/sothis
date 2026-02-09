'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { Booking, TimeSlot } from '@/lib/supabase';
import ProviderFilter from '@/components/ProviderFilter';
import Button from '@/components/Button';

import BookingNoteModal from '@/components/BookingNoteModal';
import { getLastNote } from '@/lib/notes';

export default function AdminDashboard() {
    const [upcomingBookings, setUpcomingBookings] = useState<(Booking & { time_slot: TimeSlot })[]>([]);
    const [stats, setStats] = useState({
        todayBookings: 0,
        weekBookings: 0,
        monthBookings: 0,
    });
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);

    // Role & Filter State
    const [userRole, setUserRole] = useState<string>('');
    const [selectedProvider, setSelectedProvider] = useState<string>('all');

    // Notes Modal
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [noteModalOpen, setNoteModalOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Re-fetch when filter changes (only if not initial load to avoid double fetch? handled by useEffect logic usually)
    useEffect(() => {
        if (!loading) {
            fetchDashboardData(selectedProvider);
        }
    }, [selectedProvider]);

    async function fetchDashboardData(providerId: string = 'all') {
        try {
            setLoading(true);
            const query = providerId !== 'all' ? `?provider_id=${providerId}` : '';
            const response = await fetch(`/api/admin/dashboard${query}`);
            if (!response.ok) throw new Error('Failed to fetch dashboard data');

            const data = await response.json();

            setUpcomingBookings(data.upcomingBookings || []);
            setStats(data.stats || {
                todayBookings: 0,
                weekBookings: 0,
                monthBookings: 0,
            });

            // Set role on first load
            if (!userRole && data.userRole) {
                setUserRole(data.userRole);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function saveBookingNote(newNotes: string) {
        if (!selectedBooking) return;

        const res = await fetch('/api/admin/bookings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedBooking.id,
                notes: newNotes
            })
        });

        if (!res.ok) throw new Error('Failed to update notes');

        // Optimistic update
        setUpcomingBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, notes: newNotes } : b));
    }


    // Force HMR update
    return (
        <>
            {(loading && !userRole) ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="space-y-8">
                    {/* Note Modal */}
                    {selectedBooking && (
                        <BookingNoteModal
                            isOpen={noteModalOpen}
                            onClose={() => setNoteModalOpen(false)}
                            bookingId={selectedBooking.id}
                            clientName={selectedBooking.client_name}
                            date={selectedBooking.time_slot.date}
                            initialNotes={selectedBooking.notes}
                            onSave={saveBookingNote}
                        />
                    )}

                    {/* Header with Filter */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-stone-900">Dashboard</h1>
                            <p className="mt-2 text-stone-600">
                                {userRole === 'provider' ? 'Your Schedule' : `Welcome back, ${session?.user?.name || 'Administrator'}!`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">

                            {/* Provider Filter (Admin Only) */}
                            {userRole === 'admin' && (
                                <ProviderFilter
                                    selectedProvider={selectedProvider}
                                    onSelectProvider={setSelectedProvider}
                                />
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Link href={`/admin/bookings?filter=today`} className="block transform transition-all hover:scale-105">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                                <h3 className="text-stone-500 font-medium font-sans">Today's Bookings</h3>
                                <p className="text-3xl font-bold text-stone-900 mt-2">{stats.todayBookings}</p>
                            </div>
                        </Link>

                        <Link href={`/admin/bookings?filter=week`} className="block transform transition-all hover:scale-105">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                                <h3 className="text-stone-500 font-medium font-sans">This Week</h3>
                                <p className="text-3xl font-bold text-stone-900 mt-2">{stats.weekBookings}</p>
                            </div>
                        </Link>

                        <Link href={`/admin/bookings?filter=month`} className="block transform transition-all hover:scale-105">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                                <h3 className="text-stone-500 font-medium font-sans">This Month</h3>
                                <p className="text-3xl font-bold text-stone-900 mt-2">{stats.monthBookings}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Upcoming Bookings */}
                    <div className={`bg-white rounded-lg border border-stone-200 ${loading ? 'opacity-50' : ''}`}>
                        <div className="p-6 border-b border-stone-200 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-semibold text-stone-900">Upcoming Bookings</h2>
                                {loading && <span className="text-sm text-stone-500 animate-pulse">Updating...</span>}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={async () => {
                                        if (!confirm('Send email reminders for TOMORROW\'s appointments?')) return;
                                        setLoading(true);
                                        try {
                                            const res = await fetch('/api/cron/reminders');
                                            const data = await res.json();
                                            if (res.ok) {
                                                alert(`Success! ${data.processed} reminders sent.`);
                                            } else {
                                                alert(`Error: ${data.error || 'Failed to send'}`);
                                            }
                                        } catch (e) {
                                            alert('Failed to trigger reminders');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    variant="secondary"
                                >
                                    📩 Send Reminders
                                </Button>
                                <Button href="/admin/book">
                                    Book Appointment
                                </Button>
                            </div>
                        </div>
                        <div className="divide-y divide-stone-200">
                            {upcomingBookings.length === 0 ? (
                                <div className="p-6 text-center text-stone-500">
                                    No upcoming bookings
                                </div>
                            ) : (
                                upcomingBookings.map((booking: any) => (
                                    <div key={booking.id} className="p-6 hover:bg-stone-50 border-b border-stone-100 last:border-0">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

                                            {/* Column 1: Client Info (3 cols) - Made smaller to give room to notes */}
                                            <div className="md:col-span-3">
                                                <div className="font-semibold text-stone-900 flex items-center gap-2">
                                                    {booking.client_name}
                                                    {/* Show Provider badge if Admin viewing All */}
                                                    {userRole === 'admin' && selectedProvider === 'all' && booking.provider && (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                            {booking.provider.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-stone-600 mt-1">{booking.client_email}</div>
                                                {booking.client_phone && (
                                                    <div className="text-sm text-stone-600">{booking.client_phone}</div>
                                                )}
                                                <div className="text-sm text-stone-500 mt-2 font-medium bg-stone-100 inline-block px-2 py-1 rounded">
                                                    {booking.service_type}
                                                </div>
                                            </div>

                                            {/* Column 2: Notes (6 cols) - Wider */}
                                            <div className="md:col-span-6">
                                                <div
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setNoteModalOpen(true);
                                                    }}
                                                    className="group cursor-pointer relative"
                                                >
                                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 block group-hover:text-secondary transition-colors">Latest Note</label>
                                                    <div className="text-sm p-3 rounded border border-stone-200 bg-stone-50 group-hover:bg-white group-hover:border-secondary/50 group-hover:shadow-sm transition-all h-full min-h-[80px]">
                                                        <span className={booking.notes ? 'text-stone-700 line-clamp-3' : 'text-stone-400 italic'}>
                                                            {booking.notes ? getLastNote(booking.notes) : 'No notes recorded.'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 3: Edit Button (1 col) - Next to notes */}
                                            <div className="md:col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setNoteModalOpen(true);
                                                    }}
                                                    className="p-2 text-stone-400 hover:text-secondary hover:bg-stone-100 rounded-full transition-colors"
                                                    title="Edit Notes"
                                                >
                                                    ✏️
                                                </button>
                                            </div>

                                            {/* Column 4: Date & Time (2 cols) */}
                                            <div className="md:col-span-2 text-right">
                                                <div className="font-medium text-stone-900 text-lg">
                                                    {(() => {
                                                        const [y, m, d] = booking.time_slot.date.split('-').map(Number);
                                                        const localDate = new Date(y, m - 1, d);
                                                        return localDate.toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        });
                                                    })()}
                                                </div>
                                                <div className="text-stone-600 font-mono mt-1 text-lg">
                                                    {/* Convert 24h to 12h */}
                                                    {(() => {
                                                        const [hours, minutes] = booking.time_slot.start_time.split(':');
                                                        const h = parseInt(hours, 10);
                                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                                        const h12 = h % 12 || 12;
                                                        return `${h12}:${minutes} ${ampm}`;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
