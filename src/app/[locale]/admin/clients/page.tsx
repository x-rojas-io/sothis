'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/lib/supabase';
import Button from '@/components/Button';

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [editingClient, setEditingClient] = useState<Client | null>(null);

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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-stone-900">Client List</h1>
                <p className="mt-2 text-stone-600">
                    View and manage client details.
                </p>
            </div>

            {msg && <div className="bg-blue-50 text-blue-800 p-3 rounded">{msg}</div>}

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
                                <label className="block text-sm font-medium text-stone-700">Notes (Internal)</label>
                                <textarea
                                    value={editingClient.notes || ''}
                                    onChange={e => setEditingClient({ ...editingClient, notes: e.target.value })}
                                    className="w-full border rounded px-3 py-2 h-24"
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">Notes</th>
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
                                    <td className="px-6 py-4 text-right">
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
