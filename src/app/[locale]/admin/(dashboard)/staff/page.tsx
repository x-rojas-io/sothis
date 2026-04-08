'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Provider, User } from '@/lib/supabase';
import Button from '@/components/Button';

// Extended type for UI
type StaffUser = {
    id: string; // auth.users.id
    email: string;
    role: 'admin' | 'provider';
    // Provider specific fields (optional)
    provider_id?: string;
    name?: string;
    bio?: string;
    specialties?: string[];
    color_code?: string;
    is_active?: boolean;
};

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        email: '',
        role: 'admin' as 'admin' | 'provider',
        name: '',
        password: '', // Needed for creating Auth User
        // Provider Only
        bio: '',
        specialties: '',
        color_code: '#3B82F6'
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    async function fetchStaff() {
        setLoading(true);
        try {
            // 1. Fetch Providers
            const { data: providers } = await supabase.from('providers').select('*');

            // 2. We can't easily list ALL auth users client-side without edge functions or admin API.
            // But we can assume for now we list 'Providers' from the `providers` table 
            // and we might need an API to list 'Admins' from `users` table if we sync them.
            // For now, let's assume we maintain a `users` table public record for roles.
            const { data: users } = await supabase.from('users').select('*').in('role', ['admin']);

            // Merge details.
            // This is a bit complex because 'providers' table might not link 1:1 to 'users' table yet if we didn't backfill user_id.
            // Strategy: List Providers (as they are the main staff). List Admins separately?
            // User asked to MERGE them.

            // Let's rely on an API to fetch the unified list to hide this complexity and potential RLS issues.
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setStaff(data);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setMsg('');

        try {
            const specialtiesArray = formData.specialties.split(',').map(s => s.trim()).filter(Boolean);

            // Auto-generate a temp password since we hid the field
            const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";

            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: tempPassword,
                    role: formData.role,
                    name: formData.name,
                    bio: formData.bio,
                    specialties: specialtiesArray,
                    color_code: formData.color_code
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create user');
            }

            setMsg('User created successfully!');
            setIsCreating(false);
            setFormData({
                email: '', password: '', role: 'admin', name: '', bio: '', specialties: '', color_code: '#3B82F6'
            });
            fetchStaff();
        } catch (error: any) {
            setMsg(`Error: ${error.message}`);
        }
    }

    return (

        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900">Staff & Users</h1>
                    <p className="mt-2 text-stone-600">Manage Admins and Providers.</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? 'Cancel' : 'Add New Staff'}
                </Button>
            </div>

            {msg && <div className="bg-blue-50 text-blue-800 p-3 rounded">{msg}</div>}

            {/* Create Form */}
            {isCreating && (
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                    <h3 className="font-bold text-lg mb-4">Add New User</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700">Email</label>
                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded px-3 py-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700">Role</label>
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full border rounded px-3 py-2">
                                <option value="admin">Admin</option>
                                <option value="provider">Provider</option>
                            </select>
                        </div>

                        <hr className="border-stone-200" />

                        <div>
                            <label className="block text-sm font-medium text-stone-700">Full Name</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded px-3 py-2" />
                        </div>

                        {/* Provider Specifics */}
                        {formData.role === 'provider' && (
                            <div className="space-y-4 border-l-4 border-secondary/20 pl-4">
                                <h4 className="text-sm font-bold text-stone-500 uppercase">Provider Details</h4>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Bio</label>
                                    <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Specialties (comma separated)</label>
                                    <input type="text" value={formData.specialties} onChange={e => setFormData({ ...formData, specialties: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700">Color Code</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={formData.color_code} onChange={e => setFormData({ ...formData, color_code: e.target.value })} className="h-10 w-20 cursor-pointer border rounded" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button type="submit">Create User</Button>
                    </form>
                </div >
            )
            }

            {/* List */}
            <div className="space-y-4">
                {staff.map(user => (
                    <div key={user.id} className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {user.role === 'provider' ? (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: user.color_code || '#78716c' }}>
                                    {user.name?.[0]}
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-white font-bold">
                                    A
                                </div>
                            )}

                            <div>
                                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                                    {user.name || user.email}
                                    <span className={`text-xs px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-stone-100 text-stone-800' : 'bg-secondary/10 text-secondary-dark'}`}>
                                        {user.role.toUpperCase()}
                                    </span>
                                    {user.email === 'sothistherapeutic@gmail.com' && (
                                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                            Owner
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-stone-500">{user.email}</p>
                                {user.role === 'provider' && user.specialties && (
                                    <p className="text-xs text-stone-400 mt-1">{user.specialties.join(', ')}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            {user.email === 'sothistherapeutic@gmail.com' ? (
                                <button disabled className="text-stone-300 cursor-not-allowed p-2" title="Cannot delete Super Admin">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        if (confirm(`Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`)) {
                                            try {
                                                const res = await fetch(`/api/admin/users?id=${user.id}`, { method: 'DELETE' });
                                                if (!res.ok) {
                                                    const err = await res.json();
                                                    throw new Error(err.error || 'Failed to delete');
                                                }
                                                setMsg('User deleted successfully');
                                                fetchStaff();
                                            } catch (e: any) {
                                                setMsg(`Error: ${e.message}`);
                                            }
                                        }
                                    }}
                                    className="text-stone-400 hover:text-red-600 p-2 transition-colors"
                                    title="Delete User"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {staff.length === 0 && !loading && (
                    <p className="text-stone-500">No staff found.</p>
                )}
            </div>
        </div >

    );
}
