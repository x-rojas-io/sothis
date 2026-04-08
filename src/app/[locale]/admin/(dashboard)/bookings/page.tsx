'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Booking, TimeSlot } from '@/lib/supabase';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    isToday,
    addDays,
    subDays
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ListBulletIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import ProviderFilter from '@/components/ProviderFilter';

// Extended Type: A Slot that might have a Booking attached
type MasterSlot = TimeSlot & {
    booking?: Booking; // Attached if status === 'booked'
};

import BookingNoteModal from '@/components/BookingNoteModal';
import { getLastNote } from '@/lib/notes';

export default function MasterCalendarPage() {
    const [slots, setSlots] = useState<MasterSlot[]>([]);
    const [loading, setLoading] = useState(true);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'day'>('month');

    // Filter State
    const [selectedProvider, setSelectedProvider] = useState<string>('all');

    // Notes Modal
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [noteModalOpen, setNoteModalOpen] = useState(false);

    useEffect(() => {
        // Check URL params for filter to auto-set view
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get('filter') as any;
        if (filterParam === 'today') {
            setView('day');
            setCurrentDate(new Date());
        } else if (filterParam === 'month') {
            setView('month');
            // If viewing month, stick to current month (no change needed essentially)
        }
    }, []);

    useEffect(() => {
        fetchMasterData();
    }, []);

    async function fetchMasterData() {
        try {
            // Parallel Fetch: All Slots (Structure) AND All Bookings (Details)
            const [slotsRes, bookingsRes] = await Promise.all([
                fetch('/api/admin/slots'),
                fetch('/api/admin/bookings?filter=all')
            ]);

            if (!slotsRes.ok || !bookingsRes.ok) throw new Error('Failed to fetch calendar data');

            const slotsData: TimeSlot[] = await slotsRes.json();
            const bookingsData: Booking[] = await bookingsRes.json();

            // Merge: Attach booking details to the corresponding slot
            const mergedData: MasterSlot[] = slotsData.map(slot => {
                const bookingDetails = bookingsData.find((b: any) => b.time_slot.id === slot.id || b.time_slot_id === slot.id);

                // If slot says booked but we have booking details, attach them
                if (slot.status === 'booked' && bookingDetails) {
                    return { ...slot, booking: bookingDetails };
                }
                return slot;
            });

            setSlots(mergedData);
        } catch (error) {
            console.error('Error fetching master calendar:', error);
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

        // Refresh data to update UI
        await fetchMasterData();
    }

    // --- Actions ---

    async function toggleSlotStatus(id: string, currentStatus: string) {
        if (currentStatus === 'booked') return; // Cannot toggle booked slots here

        const newStatus = currentStatus === 'available' ? 'blocked' : 'available';

        // Optimistic Update
        setSlots(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any } : s));

        try {
            const response = await fetch('/api/admin/slots', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });

            if (!response.ok) {
                await fetchMasterData(); // Revert on failure
                alert('Failed to update slot status');
            }
        } catch (error) {
            await fetchMasterData();
        }
    }

    async function handleCancelBooking(bookingId: string) {
        if (!confirm('Are you sure you want to cancel this booking? This will free up the slot.')) return;

        try {
            const response = await fetch('/api/admin/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookingId, status: 'cancelled' }),
            });

            if (!response.ok) throw new Error('Failed to cancel booking');
            await fetchMasterData(); // Refresh everything
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
            await fetchMasterData();
        } catch (error) {
            alert('Failed to update booking');
        }
    }

    // --- Navigation ---
    const nextPeriod = () => view === 'month' ? setCurrentDate(addMonths(currentDate, 1)) : setCurrentDate(addDays(currentDate, 1));
    const prevPeriod = () => view === 'month' ? setCurrentDate(subMonths(currentDate, 1)) : setCurrentDate(subDays(currentDate, 1));
    const goToToday = () => { setCurrentDate(new Date()); };

    // --- Helpers ---
    // Filter slots based on selected provider
    const getFilteredSlots = () => {
        if (selectedProvider === 'all') return slots;
        return slots.filter((s: any) => s.provider_id === selectedProvider);
    };

    const filteredSlots = getFilteredSlots();

    const getSlotsForDate = (date: Date) => filteredSlots.filter(s => isSameDay(parseISO(s.date), date));

    // Calendar Grid Gen
    const monthStart = startOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({
        start: startOfWeek(monthStart),
        end: endOfWeek(endOfMonth(monthStart))
    });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (loading) return <div className="text-center py-12">Loading Master Calendar...</div>;

    return (
        <div className="space-y-6">
            {/* Notes Modal */}
            {selectedBooking && (
                <BookingNoteModal
                    isOpen={noteModalOpen}
                    onClose={() => setNoteModalOpen(false)}
                    bookingId={selectedBooking.id}
                    clientName={selectedBooking.client_name}
                    date={selectedBooking.time_slot?.date || ''}
                    initialNotes={selectedBooking.notes}
                    onSave={saveBookingNote}
                />
            )}

            {/* Top Nav: Back to Dashboard */}
            <div>
                <Link href="/admin" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors mb-4">
                    <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
            </div>

            {/* Top Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900">Bookings Calendar</h1>
                    <p className="mt-1 text-stone-600">
                        {view === 'month' ? `Viewing ${format(currentDate, 'MMMM yyyy')}` : format(currentDate, 'EEEE, MMMM do, yyyy')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Provider Filter */}
                    <ProviderFilter
                        selectedProvider={selectedProvider}
                        onSelectProvider={setSelectedProvider}
                        className="w-auto"
                        showLabel={false}
                    />

                    <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-lg">
                        <button onClick={() => setView('month')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${view === 'month' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}>
                            <CalendarDaysIcon className="w-4 h-4" /> Month
                        </button>
                        <button onClick={() => setView('day')} className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${view === 'day' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}>
                            <ListBulletIcon className="w-4 h-4" /> Day
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative z-10">
                <button onClick={prevPeriod} className="p-2 hover:bg-stone-100 rounded-full text-stone-600"><ChevronLeftIcon className="w-5 h-5" /></button>
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-stone-900">
                        {view === 'month' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'MMMM d, yyyy')}
                    </h2>
                    <button onClick={goToToday} className="text-sm font-medium text-stone-500 hover:text-stone-900 px-3 py-1 rounded bg-stone-100 hover:bg-stone-200 transition-colors">Today</button>
                </div>
                <button onClick={nextPeriod} className="p-2 hover:bg-stone-100 rounded-full text-stone-600"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden min-h-[600px]">
                {view === 'month' ? (
                    /* === MONTH VIEW === */
                    <div>
                        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
                            {weekDays.map(day => (
                                <div key={day} className="py-2 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 auto-rows-fr bg-stone-200 gap-px">
                            {calendarDays.map((day) => {
                                const daySlots = getSlotsForDate(day);
                                const isCurrentMonth = isSameMonth(day, monthStart);
                                // Counts
                                const availableCount = daySlots.filter(s => s.status === 'available').length;
                                const bookedCount = daySlots.filter(s => s.status === 'booked').length;
                                const blockedCount = daySlots.filter(s => s.status === 'blocked').length;

                                return (
                                    <div
                                        key={day.toString()}
                                        onClick={() => { setCurrentDate(day); setView('day'); }}
                                        className={`bg-white min-h-[120px] p-2 hover:bg-stone-50 cursor-pointer transition-colors relative group flex flex-col justify-between ${!isCurrentMonth ? 'bg-stone-50/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-primary text-white' : isCurrentMonth ? 'text-stone-700' : 'text-stone-400'}`}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>

                                        {/* Indicators */}
                                        <div className="flex flex-col gap-1 mt-2">
                                            {bookedCount > 0 && (
                                                <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium border border-yellow-200 truncate">
                                                    {bookedCount} Bookings
                                                </div>
                                            )}
                                            {availableCount > 0 && (
                                                <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-medium border border-green-100 truncate">
                                                    {availableCount} Available
                                                </div>
                                            )}
                                            {blockedCount > 0 && (
                                                <div className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded font-medium border border-red-100 truncate">
                                                    {blockedCount} Blocked
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Legend */}
                        <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-6 text-sm text-stone-600">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></span> Booked (Yellow/Grey)</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span> Available (Green)</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span> Blocked (Red)</div>
                        </div>
                    </div>
                ) : (
                    /* === DAY VIEW === */
                    <div className="p-6">
                        {(() => {
                            const daySlots = getSlotsForDate(currentDate);
                            daySlots.sort((a, b) => a.start_time.localeCompare(b.start_time));

                            if (daySlots.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center h-64 text-stone-500">
                                        <CalendarDaysIcon className="w-16 h-16 mb-4 text-stone-300" />
                                        <p className="text-lg">No time slots generated for this day.</p>
                                    </div>
                                );
                            }

                            // Identify booked slots to alternate colors
                            const bookedSlots = daySlots.filter(s => s.status === 'booked');

                            return (
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {daySlots.map((slot) => {
                                        // --- BOOKED SLOT RENDER ---
                                        if (slot.status === 'booked' && slot.booking) {
                                            const booking = slot.booking;
                                            const bookingIndex = bookedSlots.findIndex(s => s.id === slot.id);
                                            const isAlternate = bookingIndex % 2 === 0;
                                            const cardBg = isAlternate ? 'bg-stone-50 border-stone-200' : 'bg-yellow-50 border-yellow-200';

                                            return (
                                                <div key={slot.id} className="relative flex gap-4 group">
                                                    {/* Time */}
                                                    <div className="w-[80px] shrink-0 text-right pt-4 hidden md:block text-stone-900 font-bold text-lg">
                                                        {slot.start_time.slice(0, 5)}
                                                    </div>
                                                    <div className="absolute left-[80px] top-0 bottom-0 w-px bg-stone-300 hidden md:block"></div>

                                                    {/* Card */}
                                                    <div className={`flex-1 rounded-xl border ${cardBg} shadow-sm p-6 relative hover:shadow-md transition-shadow`}>
                                                        <div className="md:hidden mb-2 font-bold text-stone-900 border-b border-stone-100 pb-2">
                                                            {slot.start_time.slice(0, 5)}
                                                        </div>
                                                        <div className="flex justify-between items-start gap-4 flex-col lg:flex-row">
                                                            <div className="space-y-3 flex-1">
                                                                <div>
                                                                    <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                                                                        {booking.client_name} {/* Showing Full Name */}
                                                                        <span className="text-xs font-normal bg-stone-200 text-stone-800 px-2 py-1 rounded-full">Booked</span>
                                                                    </h3>
                                                                    <div className="text-secondary font-medium mt-1">💆 {booking.service_type}</div>
                                                                </div>
                                                                {/* Notes Highlight */}
                                                                <div
                                                                    onClick={() => {
                                                                        setSelectedBooking(booking);
                                                                        setNoteModalOpen(true);
                                                                    }}
                                                                    className="bg-white border border-stone-200 rounded p-3 text-stone-800 leading-relaxed shadow-sm cursor-pointer hover:border-secondary hover:ring-1 hover:ring-secondary/50 transition-all max-h-32 overflow-hidden"
                                                                    title="Click to view full history and edit"
                                                                >
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Latest Note</span>
                                                                        <span className="text-xs text-stone-400 group-hover:text-secondary">✎ Edit</span>
                                                                    </div>
                                                                    <div className="line-clamp-3">
                                                                        {booking.notes ? getLastNote(booking.notes) : <span className="text-stone-400 italic">No notes</span>}
                                                                    </div>
                                                                </div>

                                                                <div className="text-sm text-stone-500 flex gap-4 pt-2">
                                                                    {booking.client_email && <span>📧 {booking.client_email}</span>}
                                                                    {booking.client_phone && <span>📱 {booking.client_phone}</span>}
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex lg:flex-col gap-2 min-w-[120px]">
                                                                {booking.status === 'confirmed' ? (
                                                                    <>
                                                                        <button onClick={() => handleMarkCompleted(booking.id)} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium shadow-sm transition-colors">
                                                                            Mark Done
                                                                        </button>
                                                                        <button onClick={() => handleCancelBooking(booking.id)} className="w-full py-2 bg-white border border-stone-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-stone-600 rounded text-sm font-medium transition-colors">
                                                                            Cancel
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <div className={`text-center py-2 px-4 rounded font-medium border ${booking.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-stone-50 text-stone-500 border-stone-200'}`}>
                                                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // --- AVAILABLE / BLOCKED SLOT RENDER ---
                                        const isBlocked = slot.status === 'blocked';
                                        return (
                                            <div key={slot.id} className="relative flex gap-4 group items-center">
                                                {/* Time */}
                                                <div className={`w-[80px] shrink-0 text-right hidden md:block font-medium ${isBlocked ? 'text-red-400 decoration-red-400' : 'text-green-600'}`}>
                                                    {slot.start_time.slice(0, 5)}
                                                </div>
                                                <div className={`absolute left-[80px] top-0 bottom-0 w-px hidden md:block ${isBlocked ? 'bg-red-200' : 'bg-green-200'}`}></div>

                                                {/* Card */}
                                                <div
                                                    onClick={() => toggleSlotStatus(slot.id, slot.status)}
                                                    className={`
                                                            flex-1 rounded-lg border p-4 flex justify-between items-center cursor-pointer transition-all hover:shadow-sm
                                                            ${isBlocked
                                                            ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                                            : 'bg-green-50 border-green-200 hover:border-green-300 hover:bg-green-100'
                                                        }
                                                        `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="md:hidden font-mono font-medium text-stone-500">{slot.start_time.slice(0, 5)}</div>
                                                        <span className={`font-bold text-lg ${isBlocked ? 'text-red-700' : 'text-green-700'}`}>
                                                            {isBlocked ? '(Blocked)' : '(Available)'}
                                                        </span>
                                                    </div>

                                                    <div className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${isBlocked
                                                        ? 'bg-red-200 text-red-700 group-hover:bg-red-300'
                                                        : 'bg-green-200 text-green-700 group-hover:bg-green-300'
                                                        }`}>
                                                        {isBlocked ? 'Click to Unlock' : 'Click to Block'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
