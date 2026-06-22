import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

        if (updates.email) {
            updates.email = updates.email.toLowerCase().trim();
        }
        const oldEmail = currentClient.email?.toLowerCase().trim();
        const newEmail = updates.email;

        // 2. Check for email uniqueness if email is being updated
        if (newEmail && newEmail !== oldEmail) {
            const { data: existingClient, error: conflictError } = await supabaseAdmin
                .from('clients')
                .select('id')
                .eq('email', newEmail)
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
        if (newEmail && newEmail !== oldEmail) {
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
                        email: newEmail,
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

        // Fetch bookings associated with this client's old email with provider details
        const { data: clientBookings, error: bookingsFetchError } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                client_name,
                client_email,
                client_phone,
                service_type,
                intake_form_id,
                time_slot:time_slots!inner(
                    date,
                    start_time,
                    provider:providers(name)
                )
            `)
            .eq('client_email', oldEmail);

        if (bookingsFetchError) {
            console.error('API PUT clients: fetch client bookings error:', bookingsFetchError);
        } else if (clientBookings && clientBookings.length > 0) {
            // Filter to bookings that occur today or in the future
            const futureBookings = clientBookings.filter(
                (b: any) => b.time_slot && b.time_slot.date >= today
            );

            const futureBookingIds = futureBookings.map((b: any) => b.id);

            if (futureBookingIds.length > 0) {
                const bookingUpdates: any = {};
                if (updates.email) bookingUpdates.client_email = updates.email;
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

                    // Send email notification for each updated future booking to the new/corrected email
                    const fromEmail = 'bookings@sothistherapeutic.com';
                    const baseUrl = process.env.NEXTAUTH_URL || 'https://sothistherapeutic.com';

                    for (const booking of futureBookings as any[]) {
                        const targetEmail = (updates.email || booking.client_email).trim().toLowerCase();
                        const clientName = updates.name || booking.client_name;
                        
                        const timeSlotObj = Array.isArray(booking.time_slot) ? booking.time_slot[0] : booking.time_slot;
                        const providerObj = timeSlotObj && Array.isArray(timeSlotObj.provider) ? timeSlotObj.provider[0] : timeSlotObj?.provider;

                        const providerName = providerObj?.name || 'Sothis Provider';
                        const dateVal = timeSlotObj?.date;
                        const startTimeVal = timeSlotObj?.start_time || '00:00:00';

                        try {
                            await resend.emails.send({
                                from: `Sothis Bookings <${fromEmail}>`,
                                to: targetEmail,
                                subject: 'Appointment Confirmed - Sothis Therapeutic Massage',
                                html: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                        <h2 style="color: #292524; border-bottom: 2px solid #78716c; padding-bottom: 10px;">
                                            Appointment Confirmed
                                        </h2>
                                        <p style="color: #44403c; line-height: 1.6;">Hi ${clientName},</p>
                                        <p style="color: #44403c; line-height: 1.6;">
                                            Your massage appointment with <strong>${providerName}</strong> has been updated in our system.
                                        </p>
                                        <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                            <h3 style="color: #292524; margin-top: 0;">Appointment Details</h3>
                                            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            <p style="margin: 10px 0;"><strong>Time:</strong> ${startTimeVal.slice(0, 5)}</p>
                                            <p style="margin: 10px 0;"><strong>Provider:</strong> ${providerName}</p>
                                            <p style="margin: 10px 0;"><strong>Service:</strong> ${booking.service_type || 'Therapeutic Massage'}</p>
                                            <p style="margin: 10px 0;"><strong>Location:</strong> Edgewater, NJ</p>
                                        </div>

                                        ${!booking.intake_form_id ? `
                                        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                            <h3 style="color: #92400e; margin-top: 0;">Action Required: Health Profile Update</h3>
                                            <p style="color: #92400e; line-height: 1.6;">
                                                Our therapist has requested an updated health profile for this session. Please complete your clinical intake form before your arrival:
                                            </p>
                                            <div style="margin-top: 15px;">
                                                <a href="${baseUrl}/intake-form?booking_id=${booking.id}" 
                                                   style="background-color: #f5a623; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                                    Complete Health Profile
                                                </a>
                                            </div>
                                            <p style="color: #92400e; font-size: 12px; margin-top: 10px;">
                                                * If you cannot click the button, copy this link: ${baseUrl}/intake-form?booking_id=${booking.id}
                                            </p>
                                        </div>
                                        ` : ''}

                                        <p style="color: #44403c; line-height: 1.6;">
                                            If you need to change your appointment, please contact us at sothistherapeutic@gmail.com.
                                        </p>
                                    </div>
                                `
                            });
                            console.log(`API PUT clients: Sent update email for booking ${booking.id} to ${targetEmail}`);
                        } catch (emailErr) {
                            console.error('API PUT clients: Failed to send update notification for booking:', booking.id, emailErr);
                        }
                    }
                }
            }
        }

        // 6. Update client_email in all intake forms for this client
        if (updates.email) {
            const { error: intakeUpdateError } = await supabaseAdmin
                .from('intake_forms')
                .update({ client_email: updates.email })
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
