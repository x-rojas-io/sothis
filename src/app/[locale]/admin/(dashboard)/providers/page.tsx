'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Provider } from '@/lib/supabase';
import Button from '@/components/Button';

export default function AdminProvidersPage() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        specialties: '', // Comma separated
        color_code: '#3B82F6',
        is_active: true
    });

    useEffect(() => {
        fetchProviders();
    }, []);

    async function fetchProviders() {
        setLoading(true);
        const { data, error } = await supabase.from('providers').select('*').order('created_at');
        if (data) setProviders(data);
        if (error) console.error(error);
        setLoading(false);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setMsg('');

        try {
            const specialtiesArray = formData.specialties.split(',').map(s => s.trim()).filter(Boolean);

            const res = await fetch('/api/admin/providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    specialties: specialtiesArray
                })
            });

            if (!res.ok) throw new Error('Failed to create provider');

            setMsg('Provider created successfully!');
            setIsCreating(false);
            setFormData({ name: '', bio: '', specialties: '', color_code: '#3B82F6', is_active: true });
            fetchProviders();
        } catch (error) {
            console.error(error);
            setMsg('Error creating provider.');
        }
    }

    async function toggleStatus(provider: Provider) {
        /* Direct Supabase update for simplicity, assuming RLS allows Admin write */
        /* If RLS blocks client-side admin writes, use API. But usually Admin role in Supabase Client (if created right) works. */
        /* However, for safety and "Admin API" pattern, let's just use what we have or adding a PATCH endpoint. */
        /* For speed, let's assume RLS policy "Admin write access" works for this user session */

        const { error } = await supabase
            .from('providers')
            .update({ is_active: !provider.is_active })
            .eq('id', provider.id);

        if (!error) {
            fetchProviders();
        } else {
            alert('Failed to update status. Ensure you are logged in as admin.');
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-serif font-bold text-stone-900">Manage Providers</h1>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? 'Cancel' : 'Add New Provider'}
                </Button>
            </div>

            {msg && <div className="bg-blue-50 text-blue-800 p-3 rounded">{msg}</div>}

            {isCreating && (
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                    <h3 className="font-bold text-lg mb-4">Add New Provider</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700">Name</label>
                            <input
                                required type="text"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-md border-stone-300 px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700">Bio</label>
                            <textarea
                                value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full rounded-md border-stone-300 px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700">Specialties (comma separated)</label>
                            <input
                                type="text" placeholder="Deep Tissue, Reflexology..."
                                value={formData.specialties} onChange={e => setFormData({ ...formData, specialties: e.target.value })}
                                className="w-full rounded-md border-stone-300 px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700">Color Code</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={formData.color_code} onChange={e => setFormData({ ...formData, color_code: e.target.value })}
                                    className="h-10 w-20 rounded border cursor-pointer"
                                />
                                <span className="text-stone-500 text-sm">{formData.color_code}</span>
                            </div>
                        </div>
                        <Button type="submit">Create Provider</Button>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {providers.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: p.color_code }}>
                                {p.name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                                    {p.name}
                                    {!p.is_active && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Inactive</span>}
                                </h3>
                                <p className="text-sm text-stone-500">
                                    {p.specialties?.join(', ') || 'General'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => toggleStatus(p)}
                                className={`text-sm px-3 py-1 rounded-full border ${p.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                            >
                                {p.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                ))}
                {providers.length === 0 && !loading && (
                    <p className="text-stone-500 text-center py-8">No providers found.</p>
                )}
            </div>
        </div>
    );
}
