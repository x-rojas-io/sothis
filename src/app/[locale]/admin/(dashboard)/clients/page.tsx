'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/lib/supabase';
import Button from '@/components/Button';
import { useSession } from 'next-auth/react';

import BookingNoteModal from '@/components/BookingNoteModal';
import IntakeFormFields from '@/components/IntakeFormFields';
import { 
    IntakeState, 
    INITIAL_STATE, 
    TABS 
} from '@/lib/intake-constants';

export default function ClientsPage() {
    const { data: session } = useSession();
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

    // Intake Modal State
    const [intakeModalOpen, setIntakeModalOpen] = useState(false);
    const [intakeLoading, setIntakeLoading] = useState(false);

    // Intake Form Management (Admin side)
    const [intakeForm, setIntakeForm] = useState<IntakeState>(INITIAL_STATE);
    const [intakeAuditHistory, setIntakeAuditHistory] = useState<any[]>([]);
    const [intakeActiveTab, setIntakeActiveTab] = useState(1);
    const [viewingVersion, setViewingVersion] = useState<'current' | string>('current');

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

    const handleIntakeSave = async () => {
        if (!historyClient) return;
        setIntakeLoading(true);
        try {
            const payload: any = {
                ...intakeForm,
                client_id: historyClient.id, // Relational link
                medical_history: intakeForm.questions,
                updated_by: (session?.user as any)?.id // Audit
            };
            delete (payload as any).questions;
            
            // If it's a new record (no ID), let upsert handle it via client_id conflict
            if (!payload.id) delete payload.id;

            const { data: primaryData, error: primaryError } = await supabase
                .from('intake_forms')
                .upsert(payload, { onConflict: 'client_id' })
                .select()
                .single();

            if (primaryError) throw primaryError;

            // Audit Shadow
            await supabase.from('intake_form_audit').insert([{
                intake_form_id: primaryData.id,
                modified_by: (session?.user as any)?.id,
                snapshot: payload
            }]);

            setMsg('Clinical profile updated and audited.');
            setTimeout(() => setMsg(''), 3000);
            // Refresh
            fetchIntake(historyClient!.id);
        } catch (err: any) {
            alert(err.message || 'Error saving intake');
        } finally {
            setIntakeLoading(false);
        }
    };

    async function fetchIntake(clientId: string) {
        setIntakeLoading(true);
        setIntakeModalOpen(true);
        setViewingVersion('current');
        try {
            const res = await fetch(`/api/admin/intake?client_id=${clientId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.intake) {
                    setIntakeForm({
                        ...INITIAL_STATE,
                        ...data.intake,
                        questions: { ...INITIAL_STATE.questions, ...data.intake.medical_history }
                    });
                } else {
                    setIntakeForm(INITIAL_STATE);
                }
                setIntakeAuditHistory(data.auditHistory || []);
            }
        } catch (error) {
            console.error('Failed to fetch intake');
        } finally {
            setIntakeLoading(false);
        }
    }

    const selectVersion = (v: 'current' | any) => {
        if (v === 'current') {
            setViewingVersion('current');
            fetchIntake(historyClient!.id);
        } else {
            setViewingVersion(v.id);
            const snap = v.snapshot;
            setIntakeForm({
                ...INITIAL_STATE,
                ...snap,
                questions: { ...INITIAL_STATE.questions, ...snap.medical_history }
            });
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 border-t-4 border-secondary">
             <div className="text-secondary font-serif italic text-xl animate-pulse">Loading Client Foundation...</div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end border-b-2 border-stone-900 pb-4">
                <div>
                    <h1 className="text-4xl font-serif font-black text-stone-900 uppercase tracking-tight">Clinical Registry</h1>
                    <p className="mt-2 text-stone-500 font-serif italic">Administrator view of global client profiles & medical history.</p>
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
                    <div
                        className="bg-white h-full w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-8 border-b-2 border-stone-200 flex justify-between items-center bg-stone-50">
                            <div>
                                <h2 className="text-3xl font-serif font-black text-stone-900 uppercase tracking-tight">{historyClient.name}</h2>
                                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-stone-500 mt-1">Clinical Session Registry</p>
                            </div>
                            <button 
                                onClick={() => setHistoryClient(null)} 
                                className="w-12 h-12 flex items-center justify-center bg-white border border-stone-200 rounded-full text-stone-900 hover:bg-stone-900 hover:text-white transition-all shadow-sm group"
                                aria-label="Close Audit"
                            >
                                <span className="text-xl font-light">✕</span>
                            </button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto">
                            <h3 className="font-serif text-xl font-bold mb-6 border-b border-stone-200 pb-2">Session History Audit</h3>
                            
                            {historyLoading ? (
                                <div className="text-center py-20 opacity-30 animate-pulse text-stone-900 font-serif italic">Accessing historical records...</div>
                            ) : clientBookings.length === 0 ? (
                                <div className="text-center py-20 text-stone-400 font-serif">
                                    No sessions recorded yet.
                                </div>
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

                                            <button
                                                onClick={() => { setSelectedBooking(booking); setNoteModalOpen(true); }}
                                                className="mt-4 text-xs font-black uppercase tracking-widest text-[#f5a623] hover:underline"
                                            >
                                                ✏️ Amend Session Notes
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Intake Modal (Detailed Forms) */}
            {intakeModalOpen && (
                <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
                    <div className="bg-[#f2f2f2] w-full max-w-7xl shadow-[0_50px_100px_rgba(0,0,0,0.7)] flex flex-col h-[92vh] relative animate-in zoom-in-95 duration-300 rounded-lg overflow-hidden border border-white/10">
                        
                        <div className="flex flex-1 overflow-hidden">
                            {/* LEFT SIDE: AUDIT TRAIL / VERSIONS */}
                            <div className="w-72 bg-stone-900 text-stone-300 p-10 flex flex-col gap-10 border-r border-stone-800">
                                <div>
                                    <div className="w-12 h-1 bg-[#f5a623] mb-6"></div>
                                    <h2 className="text-2xl font-serif font-black text-white uppercase tracking-tight leading-tight mb-2">{historyClient?.name}</h2>
                                    <p className="text-[10px] text-stone-500 font-sans font-bold uppercase tracking-[0.3em] mb-10">Clinical Profile History</p>
                                    <button 
                                        onClick={() => setIntakeModalOpen(false)} 
                                        className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-white border border-stone-700 hover:border-white px-4 py-3 w-full transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>✕</span> Close records
                                    </button>
                                </div>

                                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-stone-600"></div>
                                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-stone-500">Clinical Timeline</span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => selectVersion('current')}
                                        className={`w-full text-left p-5 border transition-all relative group ${viewingVersion === 'current' ? 'bg-[#f5a623] border-[#f5a623] text-white shadow-[0_10px_30px_rgba(245,166,35,0.4)] scale-[1.03] z-10' : 'border-stone-800 hover:bg-stone-800 hover:border-stone-600'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-black text-[11px] uppercase tracking-wider">Live Profile</span>
                                            {viewingVersion === 'current' && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                                        </div>
                                        <p className="text-[10px] opacity-60 font-medium">Primary Active Snapshot</p>
                                    </button>

                                    {intakeAuditHistory.map((audit) => (
                                        <button 
                                            key={audit.id}
                                            onClick={() => selectVersion(audit)}
                                            className={`w-full text-left p-5 border transition-all ${viewingVersion === audit.id ? 'bg-white border-white text-stone-900 shadow-2xl scale-[1.03] z-10' : 'border-stone-800/50 hover:bg-stone-800/80 opacity-50 hover:opacity-100'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-[10px] uppercase tracking-widest">Snapshot</span>
                                                <span className="text-[9px] font-mono opacity-50">{new Date(audit.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[9px] opacity-60 truncate font-medium">ID: {audit.id.slice(0, 8)}</p>
                                        </button>
                                    ))}
                                </div>

                                {viewingVersion === 'current' && (
                                    <div className="pt-8 border-t border-stone-800">
                                        <Button onClick={handleIntakeSave} className="w-full bg-white text-stone-900 font-black uppercase text-[10px] tracking-[0.2em] py-5 hover:bg-[#f5a623] hover:text-white transition-all shadow-2xl border-none">
                                            Verify & Save Audit
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT SIDE: THE FORM */}
                            <div className="flex-1 bg-[#e0e0e0] p-12 overflow-y-auto relative">
                                <div className="max-w-5xl mx-auto space-y-12">
                                    <nav className="flex justify-between bg-stone-900/10 backdrop-blur-md p-1.5 shadow-sm gap-1.5 sticky top-0 z-50 rounded-lg">
                                        {TABS.map((tab) => (
                                            <button key={tab.id} onClick={() => setIntakeActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-3 py-3 transition-all duration-300 ${intakeActiveTab === tab.id ? 'bg-[#f5a623] text-white' : 'text-stone-400 hover:bg-stone-50'}`}>
                                                <tab.icon className="w-4 h-4" />
                                                <span className="text-[9px] uppercase font-black tracking-widest hidden lg:block">{tab.label}</span>
                                            </button>
                                        ))}
                                    </nav>

                                    <div className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.15)] p-20 font-serif min-h-[1100px] pointer-events-auto overflow-visible relative border border-stone-200/50 rounded-sm">
                                        {viewingVersion !== 'current' && (
                                            <div className="absolute top-0 left-0 w-full h-3 bg-red-600 z-[60] flex items-center justify-center">
                                                <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] px-6 py-1 shadow-lg">Viewing Immutable Clinical Archive (READ-ONLY)</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-start mb-16 border-b-4 border-stone-900 pb-8">
                                            <div className="text-left">
                                                <h1 className="text-4xl font-serif font-black uppercase tracking-tighter text-stone-900">Confidential clinical Profile</h1>
                                                <p className="text-xs text-stone-400 uppercase tracking-[0.2em] mt-2 font-sans font-bold">Medical Examination Snapshot · sothis</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="w-16 h-16 bg-stone-100 flex items-center justify-center rounded-sm mb-2 border border-stone-200">
                                                    <span className="text-2xl opacity-20">🩺</span>
                                                </div>
                                                <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">Formal medical Record</span>
                                            </div>
                                        </div>

                                        <div className="relative z-10">
                                            <IntakeFormFields 
                                                form={intakeForm}
                                                setForm={setIntakeForm}
                                                activeTab={intakeActiveTab}
                                                setActiveTab={setIntakeActiveTab}
                                                isReadOnly={viewingVersion !== 'current'}
                                            />
                                        </div>

                                        {/* Footer Clinical Note */}
                                        <div className="mt-24 pt-10 border-t border-stone-100 flex justify-between items-end grayscale opacity-30">
                                            <div className="text-[8px] font-bold uppercase tracking-[0.2em] space-y-1">
                                                <p>Sothis Therapeutic Massage</p>
                                                <p>Clinical Governance Framework v2.4</p>
                                                <p>Edgewater, NJ · USA</p>
                                            </div>
                                            <div className="text-[10px] font-serif italic text-stone-400">
                                                Digitally signed and audited for medical compliance.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                                    <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                                        <button
                                            onClick={() => { setHistoryClient(client); fetchIntake(client.id); }}
                                            className="group relative text-blue-600 hover:text-blue-900 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                                        >
                                            🩺 Intake
                                        </button>
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
