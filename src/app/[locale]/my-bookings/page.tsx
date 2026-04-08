'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function MyBookingsPage() {
    const { data: session, status } = useSession();
    const [bookings, setBookings] = useState<any[]>([]);
    const [intakeCompleted, setIntakeCompleted] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);
    const [showIntakeHistory, setShowIntakeHistory] = useState(false);
    const [intakeHistory, setIntakeHistory] = useState<any[]>([]);
    const [intakeError, setIntakeError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

    useEffect(() => {
        if (status === 'unauthenticated') {
            signIn(undefined, { callbackUrl: '/my-bookings' });
        }
        if (status === 'authenticated') {
            Promise.all([
                fetchMyBookings(),
                checkIntakeStatus(),
                fetchIntakeHistory()
            ]).finally(() => setLoading(false));
        }
    }, [status]);

    async function checkIntakeStatus() {
        try {
            const res = await fetch('/api/user/intake', { cache: 'no-store' });
            const data = await res.json();
            setIntakeCompleted(!!data.intake);
        } catch (error) {
            console.error('Failed to check intake status');
        }
    }

    async function fetchIntakeHistory() {
        setIntakeError(null);
        try {
            const res = await fetch('/api/user/intake?history=all', { cache: 'no-store' });
            const data = await res.json();
            if (data.history) {
                setIntakeHistory(data.history);
            } else if (data.error) {
                setIntakeError(data.error);
            }
        } catch (error) {
            console.error('Failed to fetch intake history');
            setIntakeError('Network error fetching clinical history');
        }
    }

    async function fetchMyBookings() {
        try {
            const response = await fetch('/api/user/bookings');
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Failed to fetch bookings');
        }
    }

    if (status === 'loading' || (loading && status === 'authenticated')) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-stone-500 font-serif">Loading your records...</div>
            </div>
        );
    }

    if (!session) return null; // Will redirect

    // Filter Logic
    const filteredBookings = bookings.filter(booking => {
        const date = new Date(booking.time_slot.date + 'T00:00:00');
        const isUpcoming = date >= new Date();
        const isCancelled = booking.status === 'cancelled';

        if (activeTab === 'cancelled') return isCancelled;
        if (activeTab === 'upcoming') return isUpcoming && !isCancelled;
        if (activeTab === 'past') return !isUpcoming && !isCancelled;
        return true;
    });

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            <main className="flex-grow pt-32 pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                        <div>
                            <h1 className="text-4xl font-serif font-black text-stone-900 tracking-tight">
                                {showIntakeHistory ? 'Health Intake History' : 'My Bookings'}
                            </h1>
                            <p className="mt-2 text-stone-600 font-medium">
                                Welcome back, {session.user?.name || session.user?.email}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={() => setShowIntakeHistory(!showIntakeHistory)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm border ${
                                    showIntakeHistory
                                        ? 'bg-stone-900 text-white border-stone-900' 
                                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                                }`}
                            >
                                {showIntakeHistory ? '📅 View My Bookings' : '📋 Client Intake Form'}
                            </button>
                            {!showIntakeHistory && (
                                <a href="/book" className="bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-100">
                                    Book New Appointment
                                </a>
                            )}
                        </div>
                    </div>

                    {showIntakeHistory ? (
                        /* INTAKE HISTORY GRID */
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {intakeError ? (
                                <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
                                    <div className="text-3xl mb-3">⚠️</div>
                                    <p className="text-red-900 font-serif italic mb-2">Error: {intakeError}</p>
                                    <p className="text-[10px] text-red-500 uppercase font-black tracking-widest">
                                        Check your server logs for diagnostic details.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-stone-500 text-xs font-black uppercase tracking-widest">Clinical Records</h2>
                                        <a href="/intake-form" className="text-orange-600 text-sm font-bold hover:underline flex items-center gap-1">
                                            + Create New Intake Form
                                        </a>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-stone-50 border-b border-stone-100">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Date Created</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Last Session Date</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Provider</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-50">
                                                {!intakeHistory || intakeHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-stone-400">
                                                        <span className="text-3xl">📋</span>
                                                        <p className="font-serif italic">No clinical records found on file.</p>
                                                        <p className="text-[10px] uppercase font-black tracking-widest mt-2">
                                                            New registrations may take a moment to synchronize.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            intakeHistory.map((form) => {
                                                const createdAt = new Date(form.created_at);
                                                const oneYearAgo = new Date();
                                                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                                                const isLocked = createdAt < oneYearAgo;

                                                return (
                                                    <tr key={form.id} className="hover:bg-stone-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-stone-900">
                                                            {createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-stone-600">
                                                            {form.last_session?.date 
                                                                ? new Date(form.last_session.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                                : 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 text-stone-600">
                                                            {form.last_session?.provider_name || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {isLocked ? (
                                                                <span className="text-stone-400 text-xs font-bold uppercase flex items-center justify-end gap-1">
                                                                    🔒 Locked
                                                                </span>
                                                            ) : (
                                                                <a 
                                                                    href={`/intake-form?id=${form.id}`} 
                                                                    className="text-orange-600 text-sm font-bold hover:text-orange-700 transition-colors"
                                                                >
                                                                    Update
                                                                </a>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {intakeHistory.length > 0 && (
                                <p className="text-[10px] text-stone-400 text-center italic mt-4">
                                    Note: Clinical records older than 1 year are locked for editing. Please create a new form for updated medical history.
                                </p>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <>
                            {/* Filter Tabs */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div className="flex space-x-1 bg-stone-200/50 p-1 rounded-xl w-fit">
                                    {['upcoming', 'past', 'cancelled'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)}
                                            className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                                    ? 'bg-white text-stone-900 shadow-sm'
                                                    : 'text-stone-500 hover:text-stone-900 hover:bg-white/50'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                    {/* INTAKE NUDGE */}
                    {!intakeCompleted && activeTab === 'upcoming' && filteredBookings.some(b => b.status === 'confirmed') && (
                        <div className="mb-8 p-6 bg-orange-50 border border-orange-200 rounded-xl flex flex-col md:flex-row items-center gap-6 shadow-sm animate-pulse-slow">
                            <div className="bg-orange-100 p-3 rounded-full">
                                <span className="text-2xl">📋</span>
                            </div>
                            <div className="flex-grow text-center md:text-left">
                                <h4 className="text-orange-900 font-bold">Complete your Health Intake Form</h4>
                                <p className="text-orange-800 text-sm mt-1">Help us prepare for your session by sharing your medical history and focus areas securely.</p>
                            </div>
                            <a 
                                href="/intake-form" 
                                className="whitespace-nowrap bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-md"
                            >
                                Start Intake Form
                            </a>
                        </div>
                    )}

                    <div className="space-y-6">
                        {filteredBookings.length === 0 ? (
                            <div className="bg-white rounded-lg p-12 text-center border border-stone-200">
                                <h3 className="text-lg font-medium text-stone-900">No {activeTab} bookings found</h3>
                                <p className="mt-2 text-stone-600">
                                    {activeTab === 'upcoming'
                                        ? "You don't have any upcoming appointments."
                                        : activeTab === 'past'
                                            ? "You don't have any past appointments."
                                            : "You don't have any cancelled appointments."}
                                </p>
                                {activeTab === 'upcoming' && (
                                    <a href="/book" className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium">
                                        Book a massage &rarr;
                                    </a>
                                )}
                            </div>
                        ) : (
                            filteredBookings.map((booking) => {
                                const date = new Date(booking.time_slot.date + 'T00:00:00');
                                const isUpcoming = date >= new Date();

                                return (
                                    <div
                                        key={booking.id}
                                        className={`bg-white rounded-lg border p-6 transition-all ${isUpcoming && booking.status !== 'cancelled'
                                                ? 'border-l-4 border-l-stone-900 shadow-sm'
                                                : 'border-stone-200'
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
                </>
            )}
        </div>
    </main>
</div>
);
}
