'use client';

import React, { useEffect, useState } from 'react';
import type { Client } from '@/lib/supabase';
import Button from '@/components/Button';
import { useSession } from 'next-auth/react';

import ClinicalIntakeModal from '@/components/ClinicalIntakeModal';

export default function ClientsPage() {
    const { data: session } = useSession();
    const [clients, setClients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Consolidated Clinical Modal State
    const [intakeModalOpen, setIntakeModalOpen] = useState(false);
    const [intakeClient, setIntakeClient] = useState<any>(null);

    const [isInvitingNew, setIsInvitingNew] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '' });
    const [sendingInvite, setSendingInvite] = useState<string | null>(null);

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

            setMsg('Demographics updated successfully');
            setEditingClient(null);
            fetchClients();
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            console.error(error);
            setMsg('Error updating record');
        }
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
                setIsInvitingNew(false);
                setInviteData({ name: '', email: '' });
                fetchClients();
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
        <div className="min-h-screen flex items-center justify-center bg-stone-50 border-t-4 border-stone-200">
             <div className="text-stone-400 font-serif italic text-xl animate-pulse">Loading Client Master...</div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b-2 border-stone-900 pb-6 gap-6">
                <div className="flex-1">
                    <h1 className="text-4xl font-serif font-black text-stone-900 uppercase tracking-tight">Client List</h1>
                    <p className="mt-2 text-stone-500 font-serif italic max-w-lg">
                        Master database of all patient profiles, clinical compliance, and administrative records.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full md:w-80">
                        <input 
                            type="text" 
                            placeholder="Search all records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 px-10 py-3 rounded-lg font-serif italic text-sm transition-all"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                    </div>

                    <button 
                        onClick={() => setIsInvitingNew(true)}
                        className="w-full md:w-auto bg-stone-900 text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition-all font-bold tracking-widest uppercase text-xs shadow-xl flex items-center justify-center gap-2"
                    >
                        <span>✉️</span> New Intake
                    </button>
                </div>
            </div>

            {isInvitingNew && (
                <div className="bg-white p-6 rounded-lg border-2 border-stone-900 shadow-xl animate-in slide-in-from-top-4">
                    <h3 className="text-lg font-serif font-bold mb-4 uppercase tracking-wider">Send Client Intake</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input placeholder="Name" className="border border-stone-200 px-4 py-2 rounded font-serif" value={inviteData.name} onChange={e => setInviteData({...inviteData, name: e.target.value})} />
                        <input placeholder="Email" className="border border-stone-200 px-4 py-2 rounded font-serif" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} />
                        <div className="flex gap-2">
                            <button onClick={() => sendIntakeInvite(inviteData.email, inviteData.name)} disabled={!inviteData.email || !!sendingInvite} className="flex-1 bg-stone-900 text-white px-4 py-2 rounded font-bold uppercase tracking-widest text-[10px]">{sendingInvite ? 'Sending...' : 'Send Request'}</button>
                            <button onClick={() => setIsInvitingNew(false)} className="px-4 py-2 border border-stone-200 rounded font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {msg && <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-sm font-bold shadow-sm">{msg}</div>}

            {/* Consolidated Clinical Modal */}
            <ClinicalIntakeModal 
                isOpen={intakeModalOpen}
                onClose={() => setIntakeModalOpen(false)}
                client={intakeClient}
                sourceLabel="Clinical Registry"
            />

            {editingClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl border-t-8 border-stone-900">
                        <h2 className="text-2xl font-serif font-black uppercase tracking-tight mb-6">Update Demographics</h2>
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Full Name</label>
                                    <input value={editingClient.name} onChange={e => setEditingClient({ ...editingClient, name: e.target.value })} className="w-full border-2 border-stone-100 rounded-lg px-3 py-2 focus:border-stone-900 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Phone Number</label>
                                    <input value={editingClient.phone || ''} onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })} className="w-full border-2 border-stone-100 rounded-lg px-3 py-2 focus:border-stone-900 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Mailing Address</label>
                                <input value={editingClient.address || ''} onChange={e => setEditingClient({ ...editingClient, address: e.target.value })} className="w-full border-2 border-stone-100 rounded-lg px-3 py-2 focus:border-stone-900 outline-none mb-2" />
                                <div className="grid grid-cols-3 gap-2">
                                    <input placeholder="City" value={editingClient.city || ''} onChange={e => setEditingClient({ ...editingClient, city: e.target.value })} className="border-2 border-stone-100 rounded-lg px-3 py-2 text-sm" />
                                    <input placeholder="State" value={editingClient.state || ''} onChange={e => setEditingClient({ ...editingClient, state: e.target.value })} className="border-2 border-stone-100 rounded-lg px-3 py-2 text-sm" />
                                    <input placeholder="Zip" value={editingClient.zip || ''} onChange={e => setEditingClient({ ...editingClient, zip: e.target.value })} className="border-2 border-stone-100 rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Administrative Notes</label>
                                <textarea value={editingClient.notes || ''} onChange={e => setEditingClient({ ...editingClient, notes: e.target.value })} className="w-full border-2 border-stone-100 rounded-lg px-3 py-2 h-32 focus:border-stone-900 outline-none font-serif italic" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setEditingClient(null)} className="px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-xs">Cancel</button>
                                <button type="submit" className="bg-stone-900 text-white px-8 py-2 rounded-lg font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-stone-800">Save Data</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200">
                        <thead className="bg-stone-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Patient Details</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Contact</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Service Origin</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Registry Note</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-stone-900 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-stone-100">
                            {filteredClients.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-stone-400 font-serif italic text-lg opacity-50">No patient records found in Global Registry.</td></tr>
                            ) : filteredClients.map((client) => {
                                const intakeValid = isIntakeValid(client);
                                return (
                                <tr key={client.id} className="hover:bg-stone-50/80 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-serif font-black text-stone-900 text-lg">{client.name}</div>
                                        <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-stone-400 mt-0.5">Registry ID: {client.id.slice(0, 8)}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm text-stone-900 font-medium">{client.email}</div>
                                        <div className="text-xs text-stone-500 font-serif italic">{client.phone || 'No phone'}</div>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-stone-600 font-serif">{client.city || 'Unknown'}, {client.state || '--'}</td>
                                    <td className="px-6 py-5 text-sm text-stone-500 italic font-serif truncate max-w-[200px]">{client.notes || "No metadata recorded."}</td>
                                    <td className="px-6 py-5 text-right space-x-2 whitespace-nowrap">
                                        <button onClick={() => setEditingClient(client)} className="font-black text-[10px] uppercase tracking-[0.15em] text-stone-600 bg-stone-100 px-3 py-2.5 rounded hover:bg-stone-200 shadow-sm">✏️ Edit</button>
                                        {!intakeValid ? (
                                            <button 
                                                onClick={() => sendIntakeInvite(client.email, client.name)} 
                                                disabled={!!sendingInvite} 
                                                className={`font-black text-[10px] uppercase tracking-[0.12em] px-4 py-2.5 rounded border-2 transition-all ${sendingInvite === client.email ? 'bg-stone-50 text-stone-300 border-stone-100' : 'bg-stone-900 text-white border-stone-900 hover:bg-stone-700 shadow-xl'}`}
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
