import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/user/intake
 * Fetches the current user's intake form (latest) or history if ?history=all.
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const historyMode = searchParams.get('history');
        const userId = (session.user as any)?.id;
        const userEmail = session.user.email;
        const userName = session.user.name;

        // Diagnostic logs (Visible in Server Terminal)
        console.log('API: GET /api/user/intake | Session User ID:', userId);
        console.log('API: GET /api/user/intake | Session Email:', userEmail);

        // 1. Soft Registry Lookup (Get display name if possible, but don't fail)
        const { data: client } = await supabaseAdmin
            .from('clients')
            .select('id, full_name, email')
            .or(`id.eq.${userId},email.ilike."${userEmail.trim()}"`)
            .maybeSingle();

        const displayName = client?.full_name || userName || 'Client';
        const clientId = client?.id || userId;

        // Fetch Last Appointment info for context (Optional Join)
        const { data: lastBooking, error: lastBookingError } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                status,
                time_slot:time_slots (
                    date,
                    providers (name)
                )
            `)
            .or(`client_email.ilike."${userEmail.trim()}",client_id.eq.${clientId}`)
            .eq('status', 'confirmed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (lastBookingError) {
            console.error('API: lastBooking join error:', lastBookingError);
        }

        const lastSessionInfo = lastBooking ? {
            date: (lastBooking.time_slot as any)?.date,
            provider_name: (lastBooking.time_slot as any)?.providers?.name || (lastBooking.time_slot as any)?.provider?.name
        } : null;

        if (historyMode === 'all') {
            const trimmedEmail = userEmail.trim();
            const { data: intakeHistory, error: historyError } = await supabaseAdmin
                .from('intake_forms')
                .select('*')
                .or(`client_id.eq.${clientId},client_email.ilike."${trimmedEmail}"`)
                .order('created_at', { ascending: false });

            if (historyError) {
                console.error('API: History fetch error:', historyError);
                throw historyError;
            }

            // Enrich history with session context
            const enrichedHistory = (intakeHistory || []).map(form => ({
                ...form,
                last_session: lastSessionInfo
            }));

            return NextResponse.json({ 
                history: enrichedHistory, 
                client_name: displayName,
                _debug: { queried_id: clientId, queried_email: trimmedEmail, registry_found: !!client }
            });
        }

        // Default: Get Latest Single Form (Hybrid Lookup)
        const trimmedEmail = userEmail.trim();
        const { data: intake, error: intakeError } = await supabaseAdmin
            .from('intake_forms')
            .select('*')
            .or(`client_id.eq.${clientId},client_email.ilike."${trimmedEmail}"`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (intakeError && intakeError.code !== 'PGRST116') {
            console.error('API: Default intake fetch error:', intakeError);
            throw intakeError;
        }

        return NextResponse.json({ 
            intake, 
            client_name: displayName,
            last_session: lastSessionInfo,
            _debug: { queried_id: clientId, queried_email: trimmedEmail }
        });

    } catch (error) {
        console.error('API: GET /api/user/intake ERROR:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/user/intake
 * Creates or updates the user's health intake form and captures an audit snapshot.
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { 
            full_name, 
            phone_day, 
            address, 
            city_state_zip, 
            occupation, 
            emergency_contact, 
            emergency_phone, 
            initial_visit_date, 
            date_of_birth, 
            questions, 
            medical_history, 
            concentrate_on, 
            consent_name, 
            consent_at, 
            therapist_signature_at,
            booking_id // Optional link to a specific booking
        } = body;

        const medicalHistoryObj = medical_history || questions;

        if (!consent_name) {
            return NextResponse.json({ error: 'Clinical signature is required' }, { status: 400 });
        }

        // Get Client ID from email
        const { data: client } = await supabaseAdmin
            .from('clients')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        // 1. Insert New Intake Form (Supports multiple treatments/years)
        const { data: intake, error: intakeError } = await supabaseAdmin
            .from('intake_forms')
            .insert({
                client_id: client.id,
                client_email: session.user.email,
                full_name,
                phone_day,
                address,
                city_state_zip,
                occupation,
                emergency_contact,
                emergency_phone,
                initial_visit_date,
                date_of_birth,
                medical_history: medicalHistoryObj, // Map questions/medical_history object
                concentrate_on,
                consent_name,
                consent_at: consent_at || new Date().toISOString(),
                therapist_signature_at,
                signature_name: consent_name, // Legacy support
                signature_date: new Date().toISOString(),
                updated_by: (session.user as any)?.id, // Capture UUID (Client or Staff)
                updated_by_email: session.user.email // Capture Actor Email for Clinical Audit
            })
            .select()
            .single();

        if (intakeError) throw intakeError;

        // 2. Late Binding (Update Booking if ID provided)
        if (booking_id) {
            const { error: bookingUpdateError } = await supabaseAdmin
                .from('bookings')
                .update({ intake_form_id: intake.id })
                .eq('id', booking_id)
                .eq('client_email', session.user.email); // Security check
            
            if (bookingUpdateError) {
                console.error('API: Failed to late-bind intake to booking:', booking_id, bookingUpdateError);
            }
        }

        // 3. Audit Trail Snapshot (Immutable Record)
        const { error: auditError } = await supabaseAdmin
            .from('intake_form_audit')
            .insert({
                intake_form_id: intake.id,
                modified_by: (session.user as any)?.id,
                modified_by_email: session.user.email,
                snapshot: body,
                created_at: new Date().toISOString()
            });

        if (auditError) {
            console.error('CRITICAL: Audit log failure for intake update:', auditError);
        }

        return NextResponse.json({ success: true, intake });

    } catch (error: any) {
        console.error('API: POST /api/user/intake ERROR:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
