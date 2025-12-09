'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { TimeSlot } from '@/lib/supabase';
import Button from '@/components/Button';

export default function BookingPage() {
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        client_city: '',
        client_state: '',
        client_zip: '',
        notes: '',
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchAvailableSlots();
    }, []);

    async function fetchAvailableSlots() {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('time_slots')
                .select('*')
                .eq('status', 'available')
                .gte('date', today)
                .order('date')
                .order('start_time')
                .limit(50);

            if (error) throw error;
            setAvailableSlots(data || []);
        } catch (error) {
            console.error('Error fetching slots:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedSlot) return;

        setSubmitting(true);
        setMessage('');

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    time_slot_id: selectedSlot.id,
                    ...formData,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('✅ Booking confirmed! Check your email for details.');
                setSelectedSlot(null);
                setFormData({
                    client_name: '',
                    client_email: '',
                    client_phone: '',
                    client_address: '',
                    client_city: '',
                    client_state: '',
                    client_zip: '',
                    notes: '',
                });
                await fetchAvailableSlots();
            } else {
                setMessage(`❌ ${data.error || 'Failed to book appointment'}`);
            }
        } catch (error) {
            setMessage('❌ Failed to book appointment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    // Group slots by date
    const slotsByDate = availableSlots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {} as Record<string, TimeSlot[]>);

    if (loading) {
        return (
            <div className="min-h-screen bg-white py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    Loading available appointments...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-12">
                    <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 sm:text-4xl">
                        Book Your Appointment
                    </h1>
                    <p className="mt-2 text-lg leading-8 text-stone-600">
                        Choose an available time slot and complete your booking
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Available Slots */}
                    <div>
                        <h2 className="text-xl font-semibold text-stone-900 mb-4">Available Times</h2>
                        {Object.keys(slotsByDate).length === 0 ? (
                            <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-center text-stone-600">
                                No appointments available at this time. Please check back later.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(slotsByDate).map(([date, slots]) => (
                                    <div key={date} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                                        <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                                            <h3 className="font-semibold text-stone-900">
                                                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </h3>
                                        </div>
                                        <div className="p-4 grid grid-cols-2 gap-2">
                                            {slots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedSlot?.id === slot.id
                                                        ? 'bg-secondary text-white'
                                                        : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                                                        }`}
                                                >
                                                    {slot.start_time.slice(0, 5)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Booking Form */}
                    <div>
                        <h2 className="text-xl font-semibold text-stone-900 mb-4">Your Information</h2>
                        {!selectedSlot ? (
                            <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-center text-stone-600">
                                Please select a time slot to continue
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                                    <div className="text-sm font-medium text-stone-900">Selected Time:</div>
                                    <div className="text-lg font-semibold text-secondary mt-1">
                                        {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </div>
                                    <div className="text-stone-700">{selectedSlot.start_time.slice(0, 5)}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.client_name}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.client_email}
                                        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.client_phone}
                                        onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-stone-200">
                                    <h3 className="text-sm font-semibold text-stone-900">Address (Optional)</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-2">Street Address</label>
                                        <input
                                            type="text"
                                            value={formData.client_address}
                                            onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                                            className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-2">City</label>
                                            <input
                                                type="text"
                                                value={formData.client_city}
                                                onChange={(e) => setFormData({ ...formData, client_city: e.target.value })}
                                                className="w-full rounded-md border border-stone-300 px-3 py-2"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-2">State</label>
                                                <input
                                                    type="text"
                                                    value={formData.client_state}
                                                    onChange={(e) => setFormData({ ...formData, client_state: e.target.value })}
                                                    className="w-full rounded-md border border-stone-300 px-3 py-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 mb-2">Zip</label>
                                                <input
                                                    type="text"
                                                    value={formData.client_zip}
                                                    onChange={(e) => setFormData({ ...formData, client_zip: e.target.value })}
                                                    className="w-full rounded-md border border-stone-300 px-3 py-2"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        placeholder="Any special requests or concerns..."
                                    />
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-lg ${message.startsWith('✅')
                                        ? 'bg-green-50 text-green-800 border border-green-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                        }`}>
                                        {message}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={submitting}>
                                    {submitting ? 'Booking...' : 'Confirm Booking'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
