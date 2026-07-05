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

    const getContactLink = (booking: any) => {
        const date = new Date(booking.time_slot.date + 'T00:00:00');
        const dateFormatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        const timeFormatted = booking.time_slot.start_time.slice(0, 5);
        const subject = `Reschedule/Cancel Request: ${dateFormatted} at ${timeFormatted}`;
        const bodyMsg = `Hi Nancy, I need to reschedule or cancel my appointment on ${dateFormatted} at ${timeFormatted} because: `;
        return `/contact?name=${encodeURIComponent(booking.client_name)}&email=${encodeURIComponent(booking.client_email)}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(bodyMsg)}`;
    };

    const getWaLink = (booking: any) => {
        const date = new Date(booking.time_slot.date + 'T00:00:00');
        const dateFormatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const timeFormatted = booking.time_slot.start_time.slice(0, 5);
        const msg = `Hi Sothis, I need to change or cancel my appointment on ${dateFormatted} at ${timeFormatted}.`;
        return `https://wa.me/15512414652?text=${encodeURIComponent(msg)}`;
    };

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
                                        <a href="/intake-form?mode=new" className="text-orange-600 text-sm font-bold hover:underline flex items-center gap-1">
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
                                href="/intake-form?mode=new" 
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
                                                <div className="text-right flex flex-col items-end gap-1.5">
                                                    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Need to change?</p>
                                                    <div className="flex items-center gap-2">
                                                        <a 
                                                            href={getContactLink(booking)} 
                                                            title="Send Message to Sothis"
                                                            className="inline-flex items-center justify-center p-2 rounded-lg bg-stone-100 border border-stone-200 hover:border-stone-300 text-stone-700 transition-all hover:scale-105"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                            </svg>
                                                        </a>
                                                        <a 
                                                            href={getWaLink(booking)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            title="Message on WhatsApp"
                                                            className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 border border-emerald-200 hover:border-emerald-300 text-emerald-600 transition-all hover:scale-105"
                                                        >
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.489 5.358 1.49 5.487 0 9.954-4.41 9.958-9.825.002-2.624-1.013-5.09-2.861-6.942-1.847-1.853-4.3-2.873-6.93-2.874-5.49 0-9.957 4.411-9.961 9.828-.001 2.242.601 4.412 1.74 6.357L2.895 21.16l4.241-1.094c-.495.291-.491.285-.489.288zm9.578-6.982c-.294-.145-1.736-.845-2.003-.94-.268-.097-.463-.145-.658.145-.195.292-.756.94-.926 1.13-.17.19-.34.213-.634.069-.294-.145-1.243-.451-2.367-1.439-.874-.768-1.465-1.718-1.636-2.008-.17-.29-.018-.447.129-.592.132-.13.294-.34.441-.51.147-.171.195-.292.293-.487.098-.195.049-.365-.024-.511-.073-.146-.658-1.558-.901-2.143-.236-.57-.498-.492-.683-.502-.177-.009-.38-.01-.585-.01-.205 0-.537.076-.817.38-.28.305-1.073 1.03-1.073 2.512 0 1.48 1.097 2.912 1.243 3.107.147.195 2.158 3.25 5.228 4.542.729.307 1.299.49 1.743.629.734.23 1.403.197 1.932.12.59-.086 1.736-.697 1.981-1.37.245-.672.245-1.25.17-1.37-.074-.12-.27-.193-.565-.338z" />
                                                            </svg>
                                                        </a>
                                                    </div>
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
