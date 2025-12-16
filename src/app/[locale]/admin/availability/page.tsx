'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import type { AvailabilityTemplate } from '@/lib/supabase';
import Button from '@/components/Button';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPage() {
    const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        slot_duration: 60,
        buffer_minutes: 15,
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function fetchTemplates() {
        try {
            const response = await fetch('/api/admin/availability');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setTemplates(data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to save');
            }

            await fetchTemplates();
            setEditMode(false);
            setFormData({
                day_of_week: 1,
                start_time: '09:00',
                end_time: '17:00',
                slot_duration: 60,
                buffer_minutes: 15,
            });
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Error saving availability template');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this availability template?')) return;

        try {
            const response = await fetch(`/api/admin/availability?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete');
            await fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Error deleting template');
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="text-center py-12">Loading...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-stone-900">Availability Settings</h1>
                        <p className="mt-2 text-stone-600">Set your general weekly availability</p>
                    </div>
                    <Button onClick={() => setEditMode(!editMode)}>
                        {editMode ? 'Cancel' : 'Add Day'}
                    </Button>
                </div>

                {/* Add Form */}
                {editMode && (
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <h2 className="text-lg font-semibold text-stone-900 mb-4">Add Availability</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Day of Week
                                    </label>
                                    <select
                                        value={formData.day_of_week}
                                        onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        required
                                    >
                                        {DAYS_OF_WEEK.map((day, index) => (
                                            <option key={index} value={index}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Slot Duration (minutes)
                                    </label>
                                    <select
                                        value={formData.slot_duration}
                                        onChange={(e) => setFormData({ ...formData, slot_duration: parseInt(e.target.value) })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        required
                                    >
                                        <option value={60}>60 minutes</option>
                                        <option value={90}>90 minutes</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Buffer Between Appointments (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.buffer_minutes}
                                        onChange={(e) => setFormData({ ...formData, buffer_minutes: parseInt(e.target.value) })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        min="0"
                                        max="60"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Button type="submit">Save Availability</Button>
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Current Availability */}
                <div className="bg-white rounded-lg border border-stone-200">
                    <div className="p-6 border-b border-stone-200">
                        <h2 className="text-xl font-semibold text-stone-900">Current Availability</h2>
                    </div>
                    <div className="divide-y divide-stone-200">
                        {templates.length === 0 ? (
                            <div className="p-6 text-center text-stone-500">
                                No availability set. Add your first day above.
                            </div>
                        ) : (
                            templates.map((template) => (
                                <div key={template.id} className="p-6 flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold text-stone-900">
                                            {DAYS_OF_WEEK[template.day_of_week]}
                                        </div>
                                        <div className="text-sm text-stone-600 mt-1">
                                            {template.start_time.slice(0, 5)} - {template.end_time.slice(0, 5)}
                                        </div>
                                        <div className="text-sm text-stone-500 mt-1">
                                            {template.slot_duration} min slots • {template.buffer_minutes} min buffer
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="text-sm text-red-600 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
