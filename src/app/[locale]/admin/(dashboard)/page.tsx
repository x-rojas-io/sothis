'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { Booking, TimeSlot } from '@/lib/supabase';
import ProviderFilter from '@/components/ProviderFilter';
import Button from '@/components/Button';

import { format } from 'date-fns';
import { getLastNote } from '@/lib/notes';
import ClinicalIntakeModal from '@/components/ClinicalIntakeModal';
import SoapNoteModal, { SoapNote } from '@/components/SoapNoteModal';

export default function AdminDashboard() {
    const getCleanPhone = (phone: string) => {
        const clean = phone.replace(/\D/g, '');
        return clean.length === 10 ? `1${clean}` : clean;
    };

    const getConfirmLink = (booking: any) => {
        if (!booking.client_phone) return '';
        const phone = getCleanPhone(booking.client_phone);
        const [y, m, d] = booking.time_slot.date.split('-').map(Number);
        const dateFormatted = format(new Date(y, m - 1, d), 'EEEE, MMMM d');
        
        const timeParts = booking.time_slot.start_time.split(':');
        const h = parseInt(timeParts[0], 10);
        const timeFormatted = `${h % 12 || 12}:${timeParts[1]} ${h >= 12 ? 'PM' : 'AM'}`;

        const msg = `Hi ${booking.client_name}, Nancy here from Sothis Therapeutic Massage. This is a confirmation for your massage appointment on ${dateFormatted} at ${timeFormatted}. Please let us know if you have any questions. See you soon!`;
        return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    };
    const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
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

    // SOAP Note Modal
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [soapModalOpen, setSoapModalOpen] = useState(false);

    // Clinical Modal State
    const [intakeClient, setIntakeClient] = useState<any>(null);
    const [intakeModalOpen, setIntakeModalOpen] = useState(false);
    
    const [sendingInvite, setSendingInvite] = useState<string | null>(null);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Re-fetch when filter changes
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

            if (!userRole && data.userRole) {
                setUserRole(data.userRole);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function saveSoapNote(newNote: SoapNote) {
        if (!selectedBooking) return;

        const res = await fetch('/api/admin/soap-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newNote)
        });

        if (!res.ok) throw new Error('Failed to update SOAP notes');
        
        // Refresh dashboard to show updated status
        fetchDashboardData(selectedProvider);
    }

    const openIntake = (client: any) => {
        setIntakeClient(client);
        setIntakeModalOpen(true);
    };

    const isIntakeValid = (booking: any) => {
        if (!booking.latest_intake || !booking.latest_intake.signature_date) return false;
        const signatureDate = new Date(booking.latest_intake.signature_date);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        return signatureDate > twelveMonthsAgo;
    };

    async function sendIntakeInvite(email: string, name?: string) {
        setSendingInvite(email);
        try {
            const res = await fetch('/api/admin/intake/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_email: email, client_name: name })
            });

            if (res.ok) {
                setMsg(`Invitation sent to ${email}`);
                fetchDashboardData(selectedProvider);
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSendingInvite(null);
            setTimeout(() => setMsg(''), 3000);
        }
    }

    return (
        <>
            {(loading && !userRole) ? (
                <div className="text-center py-12">Loading Application Intelligence...</div>
            ) : (
                <div className="space-y-8">
                    {msg && <div className="fixed top-24 right-8 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded shadow-2xl z-50 animate-bounce-subtle font-bold uppercase text-xs tracking-widest">{msg}</div>}

                    {/* SOAP Note Modal */}
                    {selectedBooking && !intakeModalOpen && (
                        <SoapNoteModal
                            isOpen={soapModalOpen}
                            onClose={() => setSoapModalOpen(false)}
                            bookingId={selectedBooking.id}
                            clientName={selectedBooking.client_name}
                            clientEmail={selectedBooking.client_email}
                            date={selectedBooking.time_slot.date}
                            clientNotes={selectedBooking.notes}
                            onSave={saveSoapNote}
                        />
                    )}

                    {/* Consolidated Intake Modal */}
                    <ClinicalIntakeModal 
                        isOpen={intakeModalOpen}
                        onClose={() => setIntakeModalOpen(false)}
                        client={intakeClient}
                        sourceLabel="Clinical Profile"
                    />

                    {/* Header with Filter */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-stone-900">Dashboard</h1>
                            <p className="mt-2 text-stone-600">
                                {userRole === 'provider' ? 'Your Schedule' : `Welcome back, ${session?.user?.name || 'Administrator'}!`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
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
                        <div className="p-4 md:p-6 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-semibold text-stone-900">Upcoming Bookings</h2>
                                {loading && <span className="text-sm text-stone-500 animate-pulse">Updating...</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <Button
                                    onClick={async () => {
                                        if (!confirm('Send email reminders for TOMORROW\'s appointments?')) return;
                                        setLoading(true);
                                        try {
                                            const res = await fetch('/api/cron/reminders');
                                            const data = await res.json();
                                            if (res.ok) alert(`Success! ${data.processed} reminders sent.`);
                                            else alert(`Error: ${data.error || 'Failed to send'}`);
                                        } catch (e) { alert('Failed to trigger reminders'); }
                                        finally { setLoading(false); }
                                    }}
                                    variant="secondary"
                                >
                                    📩 Reminders
                                </Button>
                                <Button href="/admin/book">Book Session</Button>
                            </div>
                        </div>
                        <div className="divide-y divide-stone-200">
                            {upcomingBookings.length === 0 ? (
                                <div className="p-12 text-center text-stone-400 font-serif italic">No upcoming sessions found.</div>
                            ) : (
                                upcomingBookings.map((booking: any) => {
                                    const intakeValid = isIntakeValid(booking);
                                    return (
                                    <div key={booking.id} className="p-4 md:p-8 hover:bg-stone-50/80 transition-all border-b border-stone-100 last:border-0 group">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-10 items-start lg:items-center">
                                            {/* Column 1: Client Identity (3 cols) */}
                                            <div className="lg:col-span-3">
                                                <div className="font-black text-stone-900 text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                                                    {booking.client_name}
                                                    {userRole === 'admin' && selectedProvider === 'all' && booking.provider && (
                                                        <span className="text-[10px] uppercase font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded ring-1 ring-stone-200">
                                                            {booking.provider.name}
                                                        </span>
                                                    )}
                                                    {booking.client_phone && (
                                                        <a
                                                            href={getConfirmLink(booking)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Send WhatsApp Confirmation"
                                                            className="text-emerald-600 hover:text-emerald-800 transition-colors ml-1 p-1 hover:bg-emerald-50 rounded"
                                                        >
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.489 5.358 1.49 5.487 0 9.954-4.41 9.958-9.825.002-2.624-1.013-5.09-2.861-6.942-1.847-1.853-4.3-2.873-6.93-2.874-5.49 0-9.957 4.411-9.961 9.828-.001 2.242.601 4.412 1.74 6.357L2.895 21.16l4.241-1.094c-.495.291-.491.285-.489.288zm9.578-6.982c-.294-.145-1.736-.845-2.003-.94-.268-.097-.463-.145-.658.145-.195.292-.756.94-.926 1.13-.17.19-.34.213-.634.069-.294-.145-1.243-.451-2.367-1.439-.874-.768-1.465-1.718-1.636-2.008-.17-.29-.018-.447.129-.592.132-.13.294-.34.441-.51.147-.171.195-.292.293-.487.098-.195.049-.365-.024-.511-.073-.146-.658-1.558-.901-2.143-.236-.57-.498-.492-.683-.502-.177-.009-.38-.01-.585-.01-.205 0-.537.076-.817.38-.28.305-1.073 1.03-1.073 2.512 0 1.48 1.097 2.912 1.243 3.107.147.195 2.158 3.25 5.228 4.542.729.307 1.299.49 1.743.629.734.23 1.403.197 1.932.12.59-.086 1.736-.697 1.981-1.37.245-.672.245-1.25.17-1.37-.074-.12-.27-.193-.565-.338z" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="text-sm text-stone-500 mt-1 font-medium">{booking.client_email}</div>
                                            </div>

                                            {/* Column 2: Clinical Actions (2 cols) - NEW DEDICATED COLUMN */}
                                            <div className="lg:col-span-2 flex items-center">
                                                {booking.client ? (
                                                    intakeValid ? (
                                                        <button onClick={() => openIntake(booking.client)} className="text-[11px] font-black uppercase tracking-widest text-blue-700 hover:text-blue-900 bg-blue-50/50 hover:bg-blue-100 border border-blue-100 px-3 py-2 rounded-lg transition-all flex items-center gap-2">
                                                            <span className="text-base">🩺</span> View Intake
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => sendIntakeInvite(booking.client_email, booking.client_name)} disabled={!!sendingInvite} className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-stone-900 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100 transition-all flex items-center gap-2">
                                                            <span className="text-base">✉️</span> Request Intake
                                                        </button>
                                                    )
                                                ) : (
                                                    <button onClick={() => sendIntakeInvite(booking.client_email, booking.client_name)} disabled={!!sendingInvite} className="text-[11px] font-black uppercase tracking-widest text-primary bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                                                        ✉️ Request Profile
                                                    </button>
                                                )}
                                            </div>

                                            {/* Column 3: Client Symptoms & SOAP Documentation (4 cols) */}
                                            <div className="sm:col-span-2 lg:col-span-4 space-y-3">
                                                {/* Client Communication (Pre-Session Notes) */}
                                                <div>
                                                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Client Symptoms (Pre-Session)</label>
                                                    <div className="text-xs p-3 rounded-lg border border-stone-200 bg-stone-50 font-serif italic text-stone-600 line-clamp-2 leading-relaxed">
                                                        {booking.notes || "No specific symptoms communicated beforehand."}
                                                    </div>
                                                </div>

                                                {/* Professional SOAP Note Status */}
                                                <div onClick={() => { setSelectedBooking(booking); setSoapModalOpen(true); }} className="relative group/note cursor-pointer">
                                                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 block group-hover/note:text-primary transition-colors">Professional Documentation (SOAP)</label>
                                                    <div className={`text-sm px-4 py-2 rounded-lg border transition-all flex items-center justify-between gap-2 shadow-sm ${booking.soap_note_status === 'completed' ? 'bg-green-50 border-green-100 text-green-700' : booking.soap_note_status === 'draft' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-white border-stone-200 text-stone-400'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs">
                                                                {booking.soap_note_status === 'completed' ? '✅' : booking.soap_note_status === 'draft' ? '📝' : '⚪'}
                                                            </span>
                                                            <span className="font-black text-[10px] uppercase tracking-widest">
                                                                {booking.soap_note_status === 'completed' ? 'Signed & Completed' : booking.soap_note_status === 'draft' ? 'Draft in Progress' : 'Not Started'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-tight text-primary opacity-0 group-hover/note:opacity-100 transition-opacity">✎ Open Form</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 4: Status (1 col) */}
                                            <div className="lg:col-span-1 border-stone-100 hidden lg:flex items-center justify-center">
                                                <div className="text-[11px] uppercase font-black tracking-[0.3em] text-stone-300 vertical-lr">Audit Ready</div>
                                            </div>

                                            {/* Column 5: Date & Time (2 cols) */}
                                            <div className="lg:col-span-2 text-left lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0 border-stone-100">
                                                <div className="font-black text-stone-900 text-xl uppercase tracking-tighter">
                                                    {(() => {
                                                        const [y, m, d] = booking.time_slot.date.split('-').map(Number);
                                                        return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                                    })()}
                                                </div>
                                                <div className="text-primary font-mono mt-1 text-base font-black">
                                                    {(() => {
                                                        const [hours, minutes] = booking.time_slot.start_time.split(':');
                                                        const h = parseInt(hours, 10);
                                                        return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
                                                    })()}
                                                </div>
                                                <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] mt-3 bg-stone-100 inline-block px-2 py-1 rounded">{booking.service_type}</div>
                                            </div>
                                        </div>
                                    </div>
                                )})
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
