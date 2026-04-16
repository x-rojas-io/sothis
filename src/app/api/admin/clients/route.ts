import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode');

        if (mode === 'active') {
            // 1. Fetch Clients, Bookings, and Latest Intakes concurrently
            const [clientsRes, bookingsRes, intakeRes] = await Promise.all([
                supabaseAdmin.from('clients').select('*').order('name'),
                supabaseAdmin
                    .from('bookings')
                    .select(`
                        id,
                        client_email,
                        status,
                        service_type,
                        time_slot:time_slots(date, start_time)
                    `)
                    .in('status', ['confirmed', 'pending', 'arrived', 'no_show']),
                supabaseAdmin
                    .from('intake_forms')
                    .select('client_id, signature_date')
                    .order('signature_date', { ascending: false })
            ]);

            if (clientsRes.error) throw clientsRes.error;
            if (bookingsRes.error) throw bookingsRes.error;
            if (intakeRes.error) throw intakeRes.error;

            const clients = clientsRes.data;
            const bookings = bookingsRes.data;
            const intakes = intakeRes.data;

            // 2. Map Bookings and Intakes for O(1) lookup
            const today = new Date().toISOString().split('T')[0];
            const bookingsByEmail: Record<string, any[]> = {};
            const intakesByClient: Record<string, any> = {};

            bookings.forEach((b: any) => {
                if (!b.client_email) return;
                const email = b.client_email.toLowerCase().trim();
                if (!bookingsByEmail[email]) bookingsByEmail[email] = [];
                bookingsByEmail[email].push(b);
            });

            intakes.forEach((form: any) => {
                if (!intakesByClient[form.client_id]) {
                    intakesByClient[form.client_id] = form; // Keep most recent
                }
            });

            // 3. Process the aggregation per client
            const activeClients = clients
                .map(client => {
                    const clientEmail = client.email.toLowerCase().trim();
                    const clientBookings = bookingsByEmail[clientEmail] || [];

                    if (clientBookings.length === 0) return null;

                    const sortedBookings = clientBookings.sort((a, b) => 
                        new Date(b.time_slot.date).getTime() - new Date(a.time_slot.date).getTime()
                    );

                    const past = sortedBookings.filter((b: any) => b.time_slot.date <= today);
                    const future = sortedBookings.filter((b: any) => b.time_slot.date > today);

                    return {
                        ...client,
                        latest_intake: intakesByClient[client.id] || null,
                        last_appointment: past[0] ? {
                            date: past[0].time_slot.date,
                            service: past[0].service_type
                        } : null,
                        next_appointment: future.reverse()[0] ? {
                            date: future[0].time_slot.date,
                            service: future[0].service_type
                        } : null
                    };
                })
                .filter(c => c !== null);

            return NextResponse.json(activeClients);
        }

        // Default: Global Registry (All clients)
        const [clientsRes, intakeRes] = await Promise.all([
            supabaseAdmin.from('clients').select('*').order('name'),
            supabaseAdmin
                .from('intake_forms')
                .select('client_id, signature_date')
                .order('signature_date', { ascending: false })
        ]);

        if (clientsRes.error) throw clientsRes.error;
        if (intakeRes.error) throw intakeRes.error;

        const clients = clientsRes.data;
        const intakes = intakeRes.data;

        // Map latest intake to each client
        const intakesByClient: Record<string, any> = {};
        intakes.forEach((form: any) => {
            if (!intakesByClient[form.client_id]) {
                intakesByClient[form.client_id] = form;
            }
        });

        const registryClients = clients.map(client => ({
            ...client,
            latest_intake: intakesByClient[client.id] || null
        }));

        return NextResponse.json(registryClients);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        const { error } = await supabaseAdmin
            .from('clients')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
