'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Booking, TimeSlot } from '@/lib/supabase';

export default function AdminDashboard() {
    const [upcomingBookings, setUpcomingBookings] = useState<(Booking & { time_slot: TimeSlot })[]>([]);
    const [stats, setStats] = useState({
        todayBookings: 0,
        weekBookings: 0,
        monthBookings: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        try {
            const response = await fetch('/api/admin/dashboard');
            if (!response.ok) throw new Error('Failed to fetch dashboard data');

            const data = await response.json();

            setUpcomingBookings(data.upcomingBookings || []);
            setStats(data.stats || {
                todayBookings: 0,
                weekBookings: 0,
                monthBookings: 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
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
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900">Dashboard</h1>
                    <p className="mt-2 text-stone-600">Welcome back, Nancy!</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/admin/bookings?filter=today" className="block transform transition-all hover:scale-105">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                            <h3 className="text-stone-500 font-medium font-sans">Today's Bookings</h3>
                            <p className="text-3xl font-bold text-stone-900 mt-2">{stats.todayBookings}</p>
                        </div>
                    </Link>

                    <Link href="/admin/bookings?filter=week" className="block transform transition-all hover:scale-105">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                            <h3 className="text-stone-500 font-medium font-sans">This Week</h3>
                            <p className="text-3xl font-bold text-stone-900 mt-2">{stats.weekBookings}</p>
                        </div>
                    </Link>

                    <Link href="/admin/bookings?filter=month" className="block transform transition-all hover:scale-105">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                            <h3 className="text-stone-500 font-medium font-sans">This Month</h3>
                            <p className="text-3xl font-bold text-stone-900 mt-2">{stats.monthBookings}</p>
                        </div>
                    </Link>
                </div>

                {/* Upcoming Bookings */}
                <div className="bg-white rounded-lg border border-stone-200">
                    <div className="p-6 border-b border-stone-200">
                        <h2 className="text-xl font-semibold text-stone-900">Upcoming Bookings</h2>
                    </div>
                    <div className="divide-y divide-stone-200">
                        {upcomingBookings.length === 0 ? (
                            <div className="p-6 text-center text-stone-500">
                                No upcoming bookings
                            </div>
                        ) : (
                            upcomingBookings.map((booking) => (
                                <div key={booking.id} className="p-6 hover:bg-stone-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-stone-900">{booking.client_name}</div>
                                            <div className="text-sm text-stone-600 mt-1">{booking.client_email}</div>
                                            {booking.client_phone && (
                                                <div className="text-sm text-stone-600">{booking.client_phone}</div>
                                            )}
                                            <div className="text-sm text-stone-500 mt-2">
                                                {booking.service_type}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-stone-900">
                                                {new Date(booking.time_slot.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </div>
                                            <div className="text-sm text-stone-600 mt-1">
                                                {booking.time_slot.start_time.slice(0, 5)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
