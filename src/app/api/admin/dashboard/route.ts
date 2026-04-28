import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['admin', 'provider'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const adminSelectedProviderId = searchParams.get('provider_id');

        const today = new Date().toISOString().split('T')[0];
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Month calc
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // Determine the provider filter
        let filterProviderId: string | null = null;

        if (session.user.role === 'provider') {
            const { data: providerData } = await supabaseAdmin
                .from('providers')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (providerData) {
                filterProviderId = providerData.id;
            } else {
                return NextResponse.json({
                    upcomingBookings: [],
                    stats: { todayBookings: 0, weekBookings: 0, monthBookings: 0 },
                    userRole: session.user.role
                });
            }
        } else if (session.user.role === 'admin' && adminSelectedProviderId) {
            filterProviderId = adminSelectedProviderId;
        }

        // Build the query
        // Join with clients to get the internal client ID and metadata
        // Join with intake_forms to get clinical history
        const { data: allBookings, error: bookingsError } = await supabaseAdmin
            .from('bookings')
            .select(`
                *,
                time_slot:time_slots!inner(
                    *,
                    provider:providers(id, name)
                )
            `)
            .eq('status', 'confirmed')
            .order('date', { referencedTable: 'time_slots', ascending: true });

        if (bookingsError) throw bookingsError;

        // Fetch all clients, latest intakes, and SOAP note status
        const [clientsRes, intakeRes, soapNotesRes] = await Promise.all([
            supabaseAdmin.from('clients').select('*'),
            supabaseAdmin
                .from('intake_forms')
                .select('client_id, signature_date')
                .order('signature_date', { ascending: false }),
            supabaseAdmin
                .from('soap_notes')
                .select('booking_id, status')
        ]);

        const clients = clientsRes.data || [];
        const intakes = intakeRes.data || [];

        // Map for O(1) lookup
        const clientByEmail: Record<string, any> = {};
        clients.forEach(c => clientByEmail[c.email.toLowerCase().trim()] = c);

        const intakeByClient: Record<string, any> = {};
        intakes.forEach(i => {
            if (!intakeByClient[i.client_id]) intakeByClient[i.client_id] = i;
        });

        const soapNoteByBooking: Record<string, any> = {};
        (soapNotesRes.data || []).forEach(s => {
            soapNoteByBooking[s.booking_id] = s.status;
        });

        // Filter and sort in memory
        const validBookings = allBookings
            ?.filter((b: any) => b.time_slot && b.time_slot.date >= today)
            .map((b: any) => {
                const email = b.client_email.toLowerCase().trim();
                const client = clientByEmail[email] || null;
                const latestIntake = client ? intakeByClient[client.id] : null;

                return {
                    ...b,
                    client: client,
                    latest_intake: latestIntake,
                    soap_note_status: soapNoteByBooking[b.id] || null,
                    provider: b.time_slot?.provider
                };
            })
            // Apply provider filter if applicable
            .filter((b: any) => !filterProviderId || b.time_slot.provider_id === filterProviderId)
            .sort((a: any, b: any) => {
                const dateA = new Date(a.time_slot.date + 'T' + a.time_slot.start_time).getTime();
                const dateB = new Date(b.time_slot.date + 'T' + b.time_slot.start_time).getTime();
                return dateA - dateB;
            })
            || [];

        // Calculate Stats
        const stats = {
            todayBookings: validBookings.filter((b: any) => b.time_slot.date === today).length,
            weekBookings: validBookings.filter((b: any) => b.time_slot.date >= today && b.time_slot.date <= weekFromNow).length,
            monthBookings: validBookings.filter((b: any) => b.time_slot.date >= startOfMonth && b.time_slot.date <= endOfMonth).length,
        };

        return NextResponse.json({
            upcomingBookings: validBookings,
            stats: stats,
            userRole: session.user.role 
        });

    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
