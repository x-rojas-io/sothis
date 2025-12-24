'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AvailabilityTemplate, Provider } from '@/lib/supabase';
import Button from '@/components/Button';
import { useSession } from 'next-auth/react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'admin';

    const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    // Gen Slots State
    const [genStartDate, setGenStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [genEndDate, setGenEndDate] = useState('');
    const [genMsg, setGenMsg] = useState('');

    // Form
    const [formData, setFormData] = useState({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        slot_duration: 60,
        buffer_minutes: 15,
    });

    useEffect(() => {
        if (session) fetchInitialData();
    }, [session]);

    useEffect(() => {
        if (selectedProviderId) fetchTemplates(selectedProviderId);
    }, [selectedProviderId]);

    async function fetchInitialData() {
        setLoading(true);
        // Fetch Providers
        const { data } = await supabase.from('providers').select('*').order('name');
        if (data) {
            let displayProviders = data;

            // If not admin, restrict to their own provider record
            if (session?.user && !isAdmin) {
                // Find provider record linked to this user
                displayProviders = data.filter(p => p.user_id === session.user.id);
            }

            setProviders(displayProviders);

            if (displayProviders.length > 0) {
                // If filtered to one, select it
                if (displayProviders.length === 1) {
                    setSelectedProviderId(displayProviders[0].id);
                } else {
                    // Default to the first provider in the list
                    setSelectedProviderId(displayProviders[0].id);
                }
            }
        }
    }

    async function fetchTemplates(providerId: string) {
        try {
            // We need to fetch availability scoped to provider
            // The API '/api/admin/availability' might need 'providerId' param
            const response = await fetch(`/api/admin/availability?providerId=${providerId}`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedProviderId) return;

        try {
            const response = await fetch('/api/admin/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, provider_id: selectedProviderId }),
            });

            if (response.ok) {
                fetchTemplates(selectedProviderId);
                setEditMode(false);
            }
        } catch (error) {
            alert('Error saving');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this slot rule?')) return;
        await fetch(`/api/admin/availability?id=${id}`, { method: 'DELETE' });
        if (selectedProviderId) fetchTemplates(selectedProviderId);
    }

    async function handleGenerateSlots() {
        if (!selectedProviderId || !genEndDate) return;
        setGenMsg('Generating...');

        try {
            const res = await fetch('/api/admin/generate-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: genStartDate,
                    endDate: genEndDate,
                    providerId: selectedProviderId // Pass provider context
                })
            });
            const data = await res.json();
            if (res.ok) setGenMsg(`Success! Generated ${data.count} slots.`);
            else setGenMsg(`Error: ${data.error}`);
        } catch (e) {
            setGenMsg('Failed to generate.');
        }
    }

    if (loading) return <div>Loading...</div>;

    return (

        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900">Availability & Slots</h1>
                    <p className="mt-2 text-stone-600">Manage weekly schedules and generate booking slots.</p>
                </div>
                {/* Provider Selector */}
                <div className="w-64">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Select Provider</label>
                    <select
                        value={selectedProviderId || ''}
                        onChange={e => setSelectedProviderId(e.target.value)}
                        className="w-full rounded-md border-stone-300 shadow-sm"
                    >
                        {providers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <hr className="border-stone-200" />

            {/* 1. Weekly Template */}
            <div className="bg-white rounded-lg border border-stone-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-stone-900">Weekly Schedule Patterns</h2>
                    <Button onClick={() => setEditMode(!editMode)}>{editMode ? 'Cancel' : 'Add Pattern'}</Button>
                </div>

                {editMode && (
                    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-stone-50 rounded border border-stone-200 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm">Day</label>
                            <select value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: +e.target.value })} className="w-full border rounded px-2 py-1">
                                {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm">Duration</label>
                            <select value={formData.slot_duration} onChange={e => setFormData({ ...formData, slot_duration: +e.target.value })} className="w-full border rounded px-2 py-1">
                                <option value={60}>60m</option><option value={90}>90m</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm">Start / End</label>
                            <div className="flex gap-2">
                                <input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="border rounded px-2 py-1 flex-1" />
                                <input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="border rounded px-2 py-1 flex-1" />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" className="w-full">Save Pattern</Button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {templates.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-lg">
                            <div>
                                <span className="font-bold w-24 inline-block">{DAYS_OF_WEEK[t.day_of_week]}</span>
                                <span className="text-stone-600">{t.start_time.slice(0, 5)} - {t.end_time.slice(0, 5)}</span>
                            </div>
                            <button onClick={() => handleDelete(t.id)} className="text-red-500 text-sm hover:underline">Remove</button>
                        </div>
                    ))}
                    {templates.length === 0 && <p className="text-stone-500 italic">No recurring patterns set for this provider.</p>}
                </div>
            </div>

            {/* 2. Generate Slots */}
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-2">Generate Available Slots</h2>
                <p className="text-blue-800 text-sm mb-4">
                    Create booking slots for {providers.find(p => p.id === selectedProviderId)?.name} based on the patterns above.
                </p>
                <div className="flex items-end gap-4">
                    <div>
                        <label className="block text-xs font-bold text-blue-900 mb-1">From</label>
                        <input type="date" value={genStartDate} onChange={e => setGenStartDate(e.target.value)} className="border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-blue-900 mb-1">Until</label>
                        <input type="date" value={genEndDate} onChange={e => setGenEndDate(e.target.value)} className="border rounded px-3 py-2" />
                    </div>
                    <Button onClick={handleGenerateSlots}>Generate Slots</Button>
                </div>
                {genMsg && <div className="mt-3 font-semibold text-blue-800">{genMsg}</div>}
            </div>
        </div>
    );
}
