import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export default async function ClientsPage() {
    const { data: bookings, error } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clients:', error);
        return (
            <AdminLayout>
                <div className="p-4 text-red-500">Error loading clients</div>
            </AdminLayout>
        );
    }

    // Process bookings to get unique clients
    const clientsMap = new Map();

    bookings?.forEach((booking) => {
        const email = booking.client_email.toLowerCase().trim();

        // If we haven't seen this client, or this booking is newer (since we ordered by desc), update
        // Actually, since we want unique clients, we just want to ensure we have their details.
        // We'll prioritize the most recent details if they booked multiple times.
        if (!clientsMap.has(email)) {
            clientsMap.set(email, {
                name: booking.client_name,
                email: booking.client_email,
                phone: booking.client_phone || 'N/A',
                address: booking.client_address || '', // Capture address
                city: booking.client_city || '',
                state: booking.client_state || '',
                zip: booking.client_zip || '',
                lastBooking: booking.created_at,
                totalBookings: 1,
            });
        } else {
            const client = clientsMap.get(email);
            client.totalBookings += 1;
            // Update address if available in newer booking (created_at desc)
            if (booking.client_address) {
                client.address = booking.client_address;
                client.city = booking.client_city;
                client.state = booking.client_state;
                client.zip = booking.client_zip;
            }
            // Since we ordered by created_at DESC, the first one we find is the latest.
            // So we don't need to update lastBooking or details, assuming latest is best.
        }
    });

    const clients = Array.from(clientsMap.values());

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-900">Client List</h1>
                    <p className="mt-2 text-stone-600">
                        View contact information for all clients who have booked an appointment.
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Address
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Total Bookings
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                        Last Booking
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-stone-200">
                                {clients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-stone-500">
                                            No clients found.
                                        </td>
                                    </tr>
                                ) : (
                                    clients.map((client) => (
                                        <tr key={client.email} className="hover:bg-stone-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-stone-900">{client.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-500">{client.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-500">{client.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-500">
                                                    {client.address ? (
                                                        <>
                                                            <div>{client.address}</div>
                                                            <div className="text-xs text-stone-400">
                                                                {client.city && `${client.city}, `}
                                                                {client.state && `${client.state} `}
                                                                {client.zip}
                                                            </div>
                                                        </>
                                                    ) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-900">{client.totalBookings}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-stone-500">
                                                    {new Date(client.lastBooking).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
