'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeftIcon, CalendarIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/solid';
import Button from '@/components/Button';

interface ReportSummary {
    totalIncome: number;
    totalBookings: number;
    averagePrice: number;
    averageDuration: number;
}

interface ServiceBreakdown {
    service: string;
    count: number;
    income: number;
    avgDuration: number;
}

interface ProviderBreakdown {
    providerId: string;
    providerName: string;
    colorCode: string;
    count: number;
    income: number;
    avgDuration: number;
}

interface DetailedBooking {
    id: string;
    client_name: string;
    client_email: string;
    service_type: string;
    status: string;
    price: number;
    duration: number;
    date: string;
    start_time: string;
    provider_name: string;
    provider_color: string;
}

export default function IncomeReportsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    // Default to current month
    const today = new Date();
    const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState<ReportSummary>({ totalIncome: 0, totalBookings: 0, averagePrice: 0, averageDuration: 0 });
    const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
    const [providerBreakdown, setProviderBreakdown] = useState<ProviderBreakdown[]>([]);
    const [bookings, setBookings] = useState<DetailedBooking[]>([]);

    useEffect(() => {
        if (status === 'authenticated') {
            // @ts-ignore
            if (session?.user?.role !== 'admin' && session?.user?.role !== 'provider') {
                router.push('/');
                return;
            }
            fetchReportData();
        } else if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, session, router, startDate, endDate]);

    async function fetchReportData() {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/reports/income?start_date=${startDate}&end_date=${endDate}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch report data');
            }
            const data = await res.json();
            setSummary(data.summary);
            setServiceBreakdown(data.serviceBreakdown);
            setProviderBreakdown(data.providerBreakdown);
            setBookings(data.bookings);
        } catch (err: any) {
            console.error('Error loading report:', err);
            setError(err.message || 'Error loading report data');
        } finally {
            setIsLoading(false);
        }
    }

    const setPreset = (preset: 'this-month' | 'last-month' | 'last-30' | 'ytd') => {
        const now = new Date();
        if (preset === 'this-month') {
            setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
            setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        } else if (preset === 'last-month') {
            const prev = subMonths(now, 1);
            setStartDate(format(startOfMonth(prev), 'yyyy-MM-dd'));
            setEndDate(format(endOfMonth(prev), 'yyyy-MM-dd'));
        } else if (preset === 'last-30') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
            setEndDate(format(now, 'yyyy-MM-dd'));
        } else if (preset === 'ytd') {
            setStartDate(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'));
            setEndDate(format(now, 'yyyy-MM-dd'));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (status === 'loading') return <div className="text-center py-12">Checking Authorization...</div>;

    return (
        <div className="space-y-8 print:space-y-4 print:p-0">
            {/* Navigation and Actions */}
            <div className="flex justify-between items-center print:hidden">
                <Link href="/admin" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition-colors cursor-pointer"
                >
                    <PrinterIcon className="w-4 h-4 text-stone-500" /> Print / PDF
                </button>
            </div>

            {/* Title & Description */}
            <div className="border-b border-stone-200 pb-5 print:pb-3">
                <h1 className="text-3xl font-serif font-bold text-stone-900 print:text-2xl">Income & Revenue Reports</h1>
                <p className="mt-2 text-stone-600 text-sm print:hidden">
                    Generate visual insights on treatment sales, therapist billings, and custom service variants.
                </p>
                <p className="hidden print:block text-stone-500 text-xs mt-1">
                    Report Period: {startDate} to {endDate}
                </p>
            </div>

            {/* Date Range Selector & Presets */}
            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 shadow-sm print:hidden flex flex-col md:flex-row gap-6 justify-between items-stretch md:items-center">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white text-stone-850"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white text-stone-850"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-end">
                    <button onClick={() => setPreset('this-month')} className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 rounded border border-stone-200 transition-colors">
                        This Month
                    </button>
                    <button onClick={() => setPreset('last-month')} className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 rounded border border-stone-200 transition-colors">
                        Last Month
                    </button>
                    <button onClick={() => setPreset('last-30')} className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 rounded border border-stone-200 transition-colors">
                        Last 30 Days
                    </button>
                    <button onClick={() => setPreset('ytd')} className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 rounded border border-stone-200 transition-colors">
                        Year to Date
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium text-center">
                    ⚠️ {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-20 text-stone-500 flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
                    Calculating analytics and financial breakdowns...
                </div>
            ) : (
                <div className="space-y-8 print:space-y-6">
                    {/* Summary KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4 print:gap-2">
                        {/* KPI 1: Revenue */}
                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between print:p-4 print:border-stone-300">
                            <div>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block">Total Revenue</span>
                                <span className="text-3xl font-bold text-stone-900 mt-2 block print:text-2xl">${summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <span className="text-xs text-green-600 mt-3 font-medium flex items-center gap-1 print:hidden">
                                🟢 Active Earnings
                            </span>
                        </div>

                        {/* KPI 2: Bookings Count */}
                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between print:p-4 print:border-stone-300">
                            <div>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block">Total Sessions</span>
                                <span className="text-3xl font-bold text-stone-900 mt-2 block print:text-2xl">{summary.totalBookings}</span>
                            </div>
                            <span className="text-xs text-stone-500 mt-3 font-medium flex items-center gap-1 print:hidden">
                                📅 Confirmed / Completed
                            </span>
                        </div>

                        {/* KPI 3: Average Ticket */}
                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between print:p-4 print:border-stone-300">
                            <div>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block">Average Ticket</span>
                                <span className="text-3xl font-bold text-stone-900 mt-2 block print:text-2xl">${summary.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <span className="text-xs text-stone-500 mt-3 font-medium flex items-center gap-1 print:hidden">
                                🎟️ Mean Service Price
                            </span>
                        </div>

                        {/* KPI 4: Average Duration */}
                        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between print:p-4 print:border-stone-300">
                            <div>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block">Avg. Session Time</span>
                                <span className="text-3xl font-bold text-stone-900 mt-2 block print:text-2xl">{summary.averageDuration} min</span>
                            </div>
                            <span className="text-xs text-stone-500 mt-3 font-medium flex items-center gap-1 print:hidden">
                                ⏱️ Duration Mean
                            </span>
                        </div>
                    </div>

                    {/* Charts & Breakdown Grids */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
                        {/* Breakdown 1: Revenue by Service Type */}
                        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden print:border-stone-300">
                            <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50 print:bg-white print:px-4">
                                <h3 className="font-serif font-bold text-lg text-stone-900">Revenue by Service Type</h3>
                            </div>
                            <div className="p-6 space-y-6 print:p-4">
                                {serviceBreakdown.length === 0 ? (
                                    <div className="text-center py-6 text-stone-400 italic text-sm">No data available for this range.</div>
                                ) : (
                                    serviceBreakdown.map((s, idx) => {
                                        const percent = summary.totalIncome > 0 ? (s.income / summary.totalIncome) * 100 : 0;
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-bold text-stone-800">{s.service}</span>
                                                    <div className="text-right">
                                                        <span className="font-bold text-stone-900">${s.income.toLocaleString()}</span>
                                                        <span className="text-stone-400 text-xs ml-2">({s.count} sessions · {s.avgDuration}m avg)</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden print:border print:border-stone-200">
                                                    <div
                                                        className="bg-secondary h-full rounded-full"
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Breakdown 2: Revenue by Therapist */}
                        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden print:border-stone-300">
                            <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50 print:bg-white print:px-4">
                                <h3 className="font-serif font-bold text-lg text-stone-900">Revenue by Therapist</h3>
                            </div>
                            <div className="p-6 space-y-6 print:p-4">
                                {providerBreakdown.length === 0 ? (
                                    <div className="text-center py-6 text-stone-400 italic text-sm">No data available for this range.</div>
                                ) : (
                                    providerBreakdown.map((p, idx) => {
                                        const percent = summary.totalIncome > 0 ? (p.income / summary.totalIncome) * 100 : 0;
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full inline-block"
                                                            style={{ backgroundColor: p.colorCode }}
                                                        ></span>
                                                        <span className="font-bold text-stone-800">{p.providerName}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-stone-900">${p.income.toLocaleString()}</span>
                                                        <span className="text-stone-400 text-xs ml-2">({p.count} sessions · {p.avgDuration}m avg)</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden print:border print:border-stone-200">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${percent}%`, backgroundColor: p.colorCode }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Booking Logs */}
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden print:border-stone-300">
                        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50 print:bg-white print:px-4">
                            <h3 className="font-serif font-bold text-lg text-stone-900">Detailed Treatment Logs</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase text-stone-500 font-bold tracking-wider print:bg-white">
                                        <th className="px-6 py-3.5 print:px-2">Date & Time</th>
                                        <th className="px-6 py-3.5 print:px-2">Client Name</th>
                                        <th className="px-6 py-3.5 print:px-2">Therapist</th>
                                        <th className="px-6 py-3.5 print:px-2">Service Type</th>
                                        <th className="px-6 py-3.5 print:px-2 text-center">Duration</th>
                                        <th className="px-6 py-3.5 print:px-2 text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 print:text-xs">
                                    {bookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-stone-400 italic text-sm">
                                                No bookings recorded within this range.
                                            </td>
                                        </tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-stone-50/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-stone-600 print:px-2">
                                                    {booking.date} @ {booking.start_time.slice(0, 5)}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-stone-900 print:px-2">
                                                    {booking.client_name}
                                                    <span className="block text-xs font-normal text-stone-400 font-sans print:hidden">{booking.client_email}</span>
                                                </td>
                                                <td className="px-6 py-4 print:px-2">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="w-2 h-2 rounded-full inline-block"
                                                            style={{ backgroundColor: booking.provider_color }}
                                                        ></span>
                                                        <span className="text-sm text-stone-700">{booking.provider_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-stone-600 print:px-2">
                                                    {booking.service_type}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm text-stone-700 print:px-2">
                                                    {booking.duration ? `${booking.duration} min` : <span className="text-stone-300 italic">—</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-stone-900 print:px-2">
                                                    {booking.price ? `$${booking.price.toFixed(2)}` : <span className="text-stone-300 italic">—</span>}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
