import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode');

        if (mode === 'search') {
            const query = searchParams.get('q');
            if (!query || query.length < 3) return NextResponse.json([]);
            
            const { data, error } = await supabaseAdmin
                .from('clients')
                .select('id, name, email, phone, address, city, state, zip')
                .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
                .limit(10);
                
            if (error) throw error;
            return NextResponse.json(data);
        }

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

        if (!id) {
            return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });
        }

        // 1. Fetch current client details (to check for changes)
        const { data: currentClient, error: fetchError } = await supabaseAdmin
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('API PUT clients: fetch client error:', fetchError);
            throw fetchError;
        }

        const oldEmail = currentClient.email;
        const newEmail = updates.email;

        // 2. Check for email uniqueness if email is being updated
        if (newEmail && newEmail.toLowerCase().trim() !== oldEmail.toLowerCase().trim()) {
            const { data: existingClient, error: conflictError } = await supabaseAdmin
                .from('clients')
                .select('id')
                .eq('email', newEmail.trim())
                .neq('id', id)
                .maybeSingle();

            if (conflictError) {
                console.error('API PUT clients: email conflict check error:', conflictError);
                throw conflictError;
            }

            if (existingClient) {
                return NextResponse.json(
                    { error: 'Email address is already in use by another client' },
                    { status: 400 }
                );
            }
        }

        // Sanitize updates to only allow valid column names of the 'clients' table
        const allowedKeys = [
            'name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'notes',
            'image', 'email_verified', 'consent_at', 'consent_version'
        ];
        const sanitizedUpdates: any = {};
        for (const key of allowedKeys) {
            if (updates[key] !== undefined) {
                sanitizedUpdates[key] = updates[key];
            }
        }

        // 3. Update the client record
        const { error: clientUpdateError } = await supabaseAdmin
            .from('clients')
            .update(sanitizedUpdates)
            .eq('id', id);

        if (clientUpdateError) {
            console.error('API PUT clients: client update error:', clientUpdateError);
            throw clientUpdateError;
        }

        // 4. Update the user record if it exists and email has changed
        if (newEmail && newEmail.toLowerCase().trim() !== oldEmail.toLowerCase().trim()) {
            const { data: existingUser, error: userFetchError } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', oldEmail)
                .maybeSingle();

            if (userFetchError) {
                console.error('API PUT clients: user fetch error:', userFetchError);
            } else if (existingUser) {
                const { error: userUpdateError } = await supabaseAdmin
                    .from('users')
                    .update({
                        email: newEmail.trim(),
                        name: updates.name
                    })
                    .eq('id', existingUser.id);

                if (userUpdateError) {
                    console.error('API PUT clients: user update error:', userUpdateError);
                }
            }
        }

        // 5. Update future bookings if email or other demographic fields were updated
        const today = new Date().toISOString().split('T')[0];

        // Fetch bookings associated with this client's old email
        const { data: clientBookings, error: bookingsFetchError } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                time_slot:time_slots!inner(date)
            `)
            .eq('client_email', oldEmail);

        if (bookingsFetchError) {
            console.error('API PUT clients: fetch client bookings error:', bookingsFetchError);
        } else if (clientBookings && clientBookings.length > 0) {
            // Filter to bookings that occur today or in the future
            const futureBookingIds = clientBookings
                .filter((b: any) => b.time_slot && b.time_slot.date >= today)
                .map((b: any) => b.id);

            if (futureBookingIds.length > 0) {
                const bookingUpdates: any = {};
                if (updates.email) bookingUpdates.client_email = updates.email.trim();
                if (updates.name) bookingUpdates.client_name = updates.name;
                if (updates.phone !== undefined) bookingUpdates.client_phone = updates.phone;
                if (updates.address !== undefined) bookingUpdates.client_address = updates.address;
                if (updates.city !== undefined) bookingUpdates.client_city = updates.city;
                if (updates.state !== undefined) bookingUpdates.client_state = updates.state;
                if (updates.zip !== undefined) bookingUpdates.client_zip = updates.zip;

                if (Object.keys(bookingUpdates).length > 0) {
                    const { error: bookingsUpdateError } = await supabaseAdmin
                        .from('bookings')
                        .update(bookingUpdates)
                        .in('id', futureBookingIds);

                    if (bookingsUpdateError) {
                        console.error('API PUT clients: bookings update error:', bookingsUpdateError);
                        throw bookingsUpdateError;
                    }
                }
            }
        }

        // 6. Update client_email in all intake forms for this client
        if (updates.email) {
            const { error: intakeUpdateError } = await supabaseAdmin
                .from('intake_forms')
                .update({ client_email: updates.email.trim() })
                .eq('client_id', id);

            if (intakeUpdateError) {
                console.error('API PUT clients: intake forms update error:', intakeUpdateError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API PUT clients: final exception:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
