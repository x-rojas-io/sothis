'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/lib/supabase';
import Button from '@/components/Button';

import BookingNoteModal from '@/components/BookingNoteModal';

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // History View State
    const [historyClient, setHistoryClient] = useState<Client | null>(null);
    const [clientBookings, setClientBookings] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Notes Modal State
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    async function fetchClients() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/clients');
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            } else {
                console.error('Failed to fetch clients');
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    }

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

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!editingClient) return;

        try {
            const res = await fetch('/api/admin/clients', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingClient)
            });

            if (!res.ok) throw new Error('Failed to update');

            setMsg('Client updated successfully');
            setEditingClient(null);
            fetchClients();
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            console.error(error);
            setMsg('Error updating client');
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

        // Optimistic update in the history list
        setClientBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, notes: newNotes } : b));
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-stone-900">Client List</h1>
                <p className="mt-2 text-stone-600">
                    View and manage client details and session history.
                </p>
            </div>

            {msg && <div className="bg-blue-50 text-blue-800 p-3 rounded">{msg}</div>}

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

            {/* History Modal */}
            {historyClient && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-end z-40 animate-in fade-in duration-200"
                    onClick={() => setHistoryClient(null)} // Close on backdrop click
                >
                    <div
                        className="bg-white h-full w-full max-w-2xl shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col"
                        onClick={e => e.stopPropagation()} // Prevent close on content click
                    >
                        <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50 sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-stone-900">{historyClient.name}</h2>
                                <p className="text-sm text-stone-500">{historyClient.email}</p>
                            </div>
                            <button onClick={() => setHistoryClient(null)} className="p-2 hover:bg-stone-200 rounded-full">✕</button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Session History</h3>
                                <input
                                    type="text"
                                    placeholder="Search notes, date..."
                                    className="border border-stone-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-secondary"
                                    onChange={(e) => {
                                        // Simple client-side search
                                        const term = e.target.value.toLowerCase();
                                        const items = document.querySelectorAll('.history-item');
                                        items.forEach((item: any) => {
                                            const text = item.innerText.toLowerCase();
                                            item.style.display = text.includes(term) ? 'block' : 'none';
                                        });
                                    }}
                                />
                            </div>

                            {historyLoading ? (
                                <div className="text-center py-8 opacity-50">Loading history...</div>
                            ) : clientBookings.length === 0 ? (
                                <div className="text-center py-8 text-stone-500 bg-stone-50 rounded-lg border border-stone-100">
                                    No booking history found.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {clientBookings.map(booking => (
                                        <div key={booking.id} className="history-item border border-stone-200 rounded-lg p-4 hover:border-stone-300 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-stone-900">
                                                        {new Date(booking.time_slot.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-sm text-stone-500">
                                                        {booking.time_slot.start_time.slice(0, 5)} • {booking.service_type}
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-stone-100 text-stone-600'
                                                    }`}>
                                                    {booking.status}
                                                </div>
                                            </div>

                                            <div className="bg-stone-50 p-3 rounded text-sm text-stone-700 mt-3 whitespace-pre-wrap border border-stone-100 font-mono">
                                                {booking.notes || <span className="text-stone-400 italic font-sans">No notes recorded.</span>}
                                            </div>

                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setNoteModalOpen(true);
                                                    }}
                                                    className="text-sm font-medium text-secondary hover:text-secondary-dark flex items-center gap-1"
                                                >
                                                    ✏️ Edit Notes
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal / Form overlay */}
            {editingClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Edit Client: {editingClient.email}</h2>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Name</label>
                                    <input
                                        value={editingClient.name}
                                        onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                                        className="w-full border rounded px-3 py-2" required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Phone</label>
                                    <input
                                        value={editingClient.phone || ''}
                                        onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Address</label>
                                <input
                                    value={editingClient.address || ''}
                                    onChange={e => setEditingClient({ ...editingClient, address: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    <input placeholder="City" value={editingClient.city || ''} onChange={e => setEditingClient({ ...editingClient, city: e.target.value })} className="border rounded px-2 py-1" />
                                    <input placeholder="State" value={editingClient.state || ''} onChange={e => setEditingClient({ ...editingClient, state: e.target.value })} className="border rounded px-2 py-1" />
                                    <input placeholder="Zip" value={editingClient.zip || ''} onChange={e => setEditingClient({ ...editingClient, zip: e.target.value })} className="border rounded px-2 py-1" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">General Notes</label>
                                <textarea
                                    value={editingClient.notes || ''}
                                    onChange={e => setEditingClient({ ...editingClient, notes: e.target.value })}
                                    className="w-full border rounded px-3 py-2 h-24"
                                    placeholder="General info (allergies, preferences...)"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setEditingClient(null)} className="px-4 py-2 border rounded">Cancel</button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                        <thead className="bg-stone-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">Latest Note</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-stone-200">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-stone-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-stone-900">{client.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-stone-900">{client.email}</div>
                                        <div className="text-sm text-stone-500">{client.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-500">
                                        {client.city}, {client.state}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-stone-500 truncate max-w-xs">{client.notes}</td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button
                                            onClick={() => fetchHistory(client)}
                                            className="text-stone-600 hover:text-stone-900 font-medium text-sm"
                                        >
                                            📜 History
                                        </button>
                                        <button
                                            onClick={() => setEditingClient(client)}
                                            className="text-primary hover:text-primary-dark font-medium text-sm"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
