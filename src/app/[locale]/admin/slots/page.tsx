'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';

export default function SlotsPage() {
    const [activeTab, setActiveTab] = useState<'generate' | 'manage'>('generate');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Manage Tab State
    const [slots, setSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    async function handleGenerateSlots(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/admin/generate-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate, endDate }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`✅ Successfully generated ${data.count} time slots!`);
                setStartDate('');
                setEndDate('');
                fetchSlots(); // Refresh list
            } else {
                setMessage(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            setMessage('❌ Failed to generate slots. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // Set default dates (today + 2 weeks)
    React.useEffect(() => {
        const today = new Date();
        const twoWeeksLater = new Date(today);
        twoWeeksLater.setDate(today.getDate() + 14);

        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(twoWeeksLater.toISOString().split('T')[0]);

        // Initial fetch
        fetchSlots();
    }, []);

    async function fetchSlots() {
        setLoadingSlots(true);
        try {
            const response = await fetch('/api/admin/slots');
            if (response.ok) {
                const data = await response.json();
                setSlots(data);
            }
        } catch (error) {
            console.error('Failed to fetch slots', error);
        } finally {
            setLoadingSlots(false);
        }
    }

    async function toggleSlotStatus(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'available' ? 'blocked' : 'available';
        try {
            const response = await fetch('/api/admin/slots', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });

            if (response.ok) {
                // Optimistic update
                setSlots(slots.map(s => s.id === id ? { ...s, status: newStatus } : s));
            }
        } catch (error) {
            alert('Failed to update slot');
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-stone-900">Availability</h1>
                        <p className="mt-2 text-stone-600">
                            {activeTab === 'generate' ? 'Generate new time slots' : 'Manage existing slots'}
                        </p>
                    </div>

                    <div className="bg-stone-100 p-1 rounded-lg inline-flex">
                        <button
                            onClick={() => setActiveTab('generate')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'generate' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-900'
                                }`}
                        >
                            Generate New
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'manage' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-900'
                                }`}
                        >
                            Manage Existing
                        </button>
                    </div>
                </div>

                {activeTab === 'generate' ? (
                    /* Generate Form */
                    <div className="bg-white rounded-lg border border-stone-200 p-6">
                        <h2 className="text-lg font-semibold text-stone-900 mb-4">Generate Slots</h2>
                        <form onSubmit={handleGenerateSlots} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-md border border-stone-300 px-3 py-2"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-stone-900 mb-2">How it works:</h3>
                                <ul className="text-sm text-stone-600 space-y-1 list-disc list-inside">
                                    <li>Slots will be generated based on your availability templates</li>
                                    <li>Each slot includes a 15-minute buffer before the next appointment</li>
                                    <li>Duplicate slots will be automatically skipped</li>
                                    <li>Only days with availability templates will have slots generated</li>
                                </ul>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-lg ${message.startsWith('✅')
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}>
                                    {message}
                                </div>
                            )}

                            <Button type="submit" disabled={loading}>
                                {loading ? 'Generating...' : 'Generate Slots'}
                            </Button>
                        </form>
                    </div>
                ) : (
                    /* Manage List */
                    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                        <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
                            <h3 className="font-semibold text-stone-700">All Time Slots</h3>
                            <button onClick={() => fetchSlots()} className="text-sm text-blue-600 hover:text-blue-800">
                                Refresh
                            </button>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto">
                            {loadingSlots ? (
                                <div className="p-8 text-center text-stone-500">Loading slots...</div>
                            ) : slots.length === 0 ? (
                                <div className="p-8 text-center text-stone-500">No slots found. Generate some first!</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-stone-50 text-stone-500 font-medium">
                                        <tr>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Time</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {slots.map((slot) => (
                                            <tr key={slot.id} className="hover:bg-stone-50">
                                                <td className="p-4 font-medium text-stone-900">
                                                    {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="p-4 text-stone-600">
                                                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${slot.status === 'available' ? 'bg-green-100 text-green-800' :
                                                        slot.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800' // blocked
                                                        }`}>
                                                        {slot.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {slot.status !== 'booked' && (
                                                        <button
                                                            onClick={() => toggleSlotStatus(slot.id, slot.status)}
                                                            className={`text-xs font-medium px-3 py-1 rounded border min-w-[120px] ${slot.status === 'available'
                                                                    ? 'text-red-700 border-red-200 hover:bg-red-50 bg-white'
                                                                    : 'text-green-700 border-green-200 hover:bg-green-50 bg-white'
                                                                }`}
                                                        >
                                                            {slot.status === 'available' ? '⛔ Block / Hold' : '✅ Make Available'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
