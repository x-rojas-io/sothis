'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/lib/supabase';
import Button from '@/components/Button';
import { useSession } from 'next-auth/react';

import BookingNoteModal from '@/components/BookingNoteModal';
import ClinicalIntakeModal from '@/components/ClinicalIntakeModal';

export default function ActiveClientsPage() {
    const { data: session } = useSession();
    const [clients, setClients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');

    // History View State
    const [historyClient, setHistoryClient] = useState<Client | null>(null);
    const [clientBookings, setClientBookings] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Notes Modal State
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    // Consolidated Clinical Modal State
    const [intakeModalOpen, setIntakeModalOpen] = useState(false);
    const [intakeClient, setIntakeClient] = useState<any>(null);
    
    const [sendingInvite, setSendingInvite] = useState<string | null>(null);

    useEffect(() => {
        fetchActiveClients();
    }, []);

    async function fetchActiveClients() {
        setLoading(true);
        try {
            const url = '/api/admin/clients?mode=active';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setClients(data || []);
            } else {
                console.error('Failed to fetch clients');
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    }

    const filteredClients = clients.filter(client => {
        const query = searchQuery.toLowerCase();
        return (
            client.name?.toLowerCase().includes(query) ||
            client.email?.toLowerCase().includes(query) ||
            client.phone?.toLowerCase().includes(query)
        );
    });

    async function fetchHistory(client: Client) {
        setHistoryClient(client);
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/admin/bookings?client_email=${encodeURIComponent(client.email)}`);
            if (res.ok) {
                const data = await res.json();
                setClientBookings(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setHistoryLoading(false);
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
        setClientBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, notes: newNotes } : b));
    }

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
                fetchActiveClients();
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send request');
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSendingInvite(null);
            setTimeout(() => setMsg(''), 3000);
        }
    }

    const openIntake = (client: any) => {
        setIntakeClient(client);
        setIntakeModalOpen(true);
    };

    const isIntakeValid = (client: any) => {
        if (!client.latest_intake || !client.latest_intake.signature_date) return false;
        const signatureDate = new Date(client.latest_intake.signature_date);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        return signatureDate > twelveMonthsAgo;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 border-t-4 border-primary">
             <div className="text-stone-900 font-serif italic text-xl animate-pulse">Accessing Clinical Records...</div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b-2 border-stone-900 pb-6 gap-6">
                <div className="flex-1">
                    <div className="w-12 h-1 bg-primary mb-4"></div>
                    <h1 className="text-4xl font-serif font-black text-stone-900 uppercase tracking-tight">Active Clients</h1>
                    <p className="mt-2 text-stone-500 font-serif italic max-w-lg">
                        Specialized clinical roster tracking active patient session history and medical record status.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full md:w-80">
                        <input 
                            type="text" 
                            placeholder="Find patient in roster..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 px-10 py-3 rounded-lg font-serif italic text-sm transition-all"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                    </div>
                </div>
            </div>

            {msg && <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-sm font-bold shadow-sm animate-bounce-subtle">{msg}</div>}

            {/* Note Modal */}
            {selectedBooking && (
                <BookingNoteModal
                    isOpen={noteModalOpen}
                    onClose={() => setNoteModalOpen(false)}
                    bookingId={selectedBooking.id}
                    clientName={historyClient?.name || 'Client'}
                    date={selectedBooking.time_slot.date}
                    initialNotes={selectedBooking.notes}
                    onSave={saveBookingNote}
                />
            )}

            {/* History Modal (Bookings) */}
            {historyClient && !intakeModalOpen && (
                <div
                    className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-end z-[60]"
                    onClick={() => setHistoryClient(null)}
                >
                    <div className="bg-white h-full w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b-2 border-stone-200 flex justify-between items-center bg-stone-50">
                            <div>
                                <h2 className="text-3xl font-serif font-black text-stone-900 uppercase tracking-tight">{historyClient.name}</h2>
                                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-stone-500 mt-1">Clinical Session Registry</p>
                            </div>
                            <button onClick={() => setHistoryClient(null)} className="w-12 h-12 flex items-center justify-center bg-white border border-stone-200 rounded-full text-stone-900 hover:bg-stone-900 hover:text-white transition-all shadow-sm">✕</button>
                        </div>
                        <div className="p-8 flex-1 overflow-y-auto">
                            <h3 className="font-serif text-xl font-bold mb-6 border-b border-stone-200 pb-2">Session History Audit</h3>
                            {historyLoading ? (
                                <div className="text-center py-20 opacity-30 animate-pulse text-stone-900 font-serif italic">Accessing historical records...</div>
                            ) : clientBookings.length === 0 ? (
                                <div className="text-center py-20 text-stone-400 font-serif">No sessions recorded yet.</div>
                            ) : (
                                <div className="space-y-6">
                                    {clientBookings.map(booking => (
                                        <div key={booking.id} className="history-item border-l-4 border-stone-200 pl-6 py-2 relative">
                                            <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-stone-200 border-4 border-white shadow-sm" />
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-black text-lg text-stone-900">{new Date(booking.time_slot.date).toLocaleDateString()}</span>
                                                <span className="text-[10px] uppercase font-bold tracking-widest bg-stone-100 px-3 py-1 rounded text-stone-500">{booking.status}</span>
                                            </div>
                                            <p className="text-sm text-stone-400 uppercase tracking-widest font-bold mb-4">{booking.service_type} • {booking.time_slot.start_time.slice(0, 5)}</p>
                                            <div className="bg-[#fff8ee] p-5 border border-[#e0c89a] text-sm text-stone-700 font-serif leading-relaxed italic">
                                                {booking.notes || "No therapist clinical notes for this session."}
                                            </div>
                                            <button onClick={() => { setSelectedBooking(booking); setNoteModalOpen(true); }} className="mt-4 text-xs font-black uppercase tracking-widest text-primary hover:underline">✏️ Amend Session Notes</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Consolidated Clinical Modal */}
            <ClinicalIntakeModal 
                isOpen={intakeModalOpen}
                onClose={() => setIntakeModalOpen(false)}
                client={intakeClient}
                sourceLabel="Clinical Roster"
            />

            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                        <thead className="bg-stone-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Patient Details</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Contact</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Last Session</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Next Planned</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-stone-100">
                            {filteredClients.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-stone-400 font-serif italic text-lg opacity-50">No clinical records found matching your filter criteria.</td></tr>
                            ) : filteredClients.map((client) => {
                                const intakeValid = isIntakeValid(client);
                                return (
                                <tr key={client.id} className="hover:bg-stone-50/80 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="font-serif font-black text-stone-900 text-lg group-hover:text-primary transition-colors">{client.name}</div>
                                        <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-stone-400 mt-0.5">ID: {client.id.slice(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm text-stone-900 font-medium">{client.email}</div>
                                        <div className="text-xs text-stone-500 font-serif italic">{client.phone}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {client.last_appointment ? (
                                            <div>
                                                <div className="text-sm font-black text-stone-900">{new Date(client.last_appointment.date).toLocaleDateString()}</div>
                                                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider font-sans">{client.last_appointment.service}</div>
                                            </div>
                                        ) : <span className="text-xs text-stone-300 italic">No historical data</span>}
                                    </td>
                                    <td className="px-6 py-5">
                                        {client.next_appointment ? (
                                            <div>
                                                <div className="text-sm font-black text-primary">{new Date(client.next_appointment.date).toLocaleDateString()}</div>
                                                <div className="text-[10px] uppercase font-bold text-primary/60 tracking-wider font-sans">{client.next_appointment.service}</div>
                                            </div>
                                        ) : <span className="text-[10px] uppercase font-black text-stone-400 tracking-tighter bg-stone-100 px-2 py-1 rounded">Not Booked</span>}
                                    </td>
                                    <td className="px-6 py-5 text-right space-x-2 whitespace-nowrap">
                                        {!intakeValid ? (
                                            <button 
                                                onClick={() => sendIntakeInvite(client.email, client.name)} 
                                                disabled={!!sendingInvite} 
                                                className={`font-black text-[10px] uppercase tracking-[0.12em] px-4 py-2.5 rounded border-2 transition-all ${sendingInvite === client.email ? 'bg-stone-50 text-stone-300 border-stone-100' : 'bg-stone-900 text-white border-stone-900 hover:bg-stone-700 shadow-xl scale-[1.02]'}`}
                                            >
                                                ✉️ Request Intake Form
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => openIntake(client)} 
                                                className="font-black text-[10px] uppercase tracking-[0.12em] text-blue-700 bg-blue-50 px-4 py-2.5 rounded border border-blue-200 hover:bg-blue-100 shadow-sm"
                                            >
                                                🩺 View Intake Form
                                            </button>
                                        )}
                                        <button onClick={() => fetchHistory(client)} className="font-black text-[10px] uppercase tracking-[0.12em] text-stone-600 bg-stone-100 px-4 py-2.5 rounded border border-stone-200 hover:bg-stone-200 shadow-sm">📜 Ledger</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
