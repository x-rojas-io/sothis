import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            client_name,
            client_email,
            client_phone,
            client_address,
            client_city,
            client_state,
            client_zip,
            notes,
            provider_id,
            date,       // "YYYY-MM-DD"
            time        // "HH:MM" (e.g. "14:30")
        } = body;

        // 1. Validate Input
        if (!client_name || !client_email || !provider_id || !date || !time) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 2. Formatting Time
        // Ensure time is in HH:MM:00 format for DB
        const timeParts = time.split(':');
        if (timeParts.length < 2) {
            return NextResponse.json({ error: 'Invalid time format' }, { status: 400 });
        }
        const formattedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}:00`;
        const endTimeParts = [parseInt(timeParts[0]) + 1, parseInt(timeParts[1])]; // Default 1 hour duration
        const formattedEndTime = `${endTimeParts[0].toString().padStart(2, '0')}:${endTimeParts[1].toString().padStart(2, '0')}:00`;


        // 3. Find or Create Time Slot
        let timeSlotId = null;

        // Check if slot exists
        const { data: existingSlot, error: fetchError } = await supabaseAdmin
            .from('time_slots')
            .select('id, status')
            .eq('date', date)
            .eq('start_time', formattedTime)
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching slot:', fetchError);
            // Proceed to create if error is just "not found", but here we handle DB errors
        }

        if (existingSlot) {
            timeSlotId = existingSlot.id;
            // Optionally update status to 'booked' if it was 'available'
            if (existingSlot.status === 'available') {
                await supabaseAdmin
                    .from('time_slots')
                    .update({ status: 'booked' })
                    .eq('id', timeSlotId);
            }
        } else {
            // Create new slot
            const { data: newSlot, error: createError } = await supabaseAdmin
                .from('time_slots')
                .insert({
                    date,
                    start_time: formattedTime,
                    end_time: formattedEndTime,
                    provider_id: provider_id, // Important: assign to provider
                    status: 'booked'  // Created specifically for this booking
                })
                .select()
                .single();

            if (createError) {
                // Handle Race Condition (Unique Constraint)
                if (createError.code === '23505') {
                    // It was created just now by someone else? Retry fetch?
                    // Or more likely, logic above failed to find it.
                    return NextResponse.json({ error: 'Time slot conflict. Please try again.' }, { status: 409 });
                }
                throw createError;
            }
            timeSlotId = newSlot.id;
        }

        // 4. Create Booking
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert([{
                time_slot_id: timeSlotId,
                client_name,
                client_email,
                client_phone,
                client_address,
                client_city,
                client_state,
                client_zip,
                service_type: 'Therapeutic Massage',
                notes,
                status: 'confirmed'
                // provider_id: removed as it's not in bookings schema, linked via time_slot_id
            }])
            .select()
            .single();

        if (bookingError) throw bookingError;

        // 5. Get Provider Name for Email
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('name')
            .eq('id', provider_id)
            .single();

        const providerName = provider?.name || 'Sothis Provider';

        // 6. Send Emails
        const fromEmail = 'bookings@sothistherapeutic.com';

        // Client Email
        await resend.emails.send({
            from: `Sothis Bookings <${fromEmail}>`,
            to: client_email,
            subject: 'Appointment Confirmed - Sothis Therapeutic Massage',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #292524; border-bottom: 2px solid #78716c; padding-bottom: 10px;">
                        Appointment Confirmed
                    </h2>
                    <p style="color: #44403c; line-height: 1.6;">Hi ${client_name},</p>
                    <p style="color: #44403c; line-height: 1.6;">
                        Your massage appointment with <strong>${providerName}</strong> has been booked by our staff.
                    </p>
                    <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #292524; margin-top: 0;">Appointment Details</h3>
                        <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p style="margin: 10px 0;"><strong>Time:</strong> ${formattedTime.slice(0, 5)}</p>
                        <p style="margin: 10px 0;"><strong>Provider:</strong> ${providerName}</p>
                        <p style="margin: 10px 0;"><strong>Service:</strong> Therapeutic Massage</p>
                        <p style="margin: 10px 0;"><strong>Location:</strong> Edgewater, NJ</p>
                    </div>
                </div>
            `
        });

        // Admin Email (Notification)
        await resend.emails.send({
            from: `Sothis Booking System <${fromEmail}>`,
            to: process.env.CONTACT_EMAIL || 'sothistherapeutic@gmail.com',
            subject: `Admin Booking: ${client_name} with ${providerName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                     <h2 style="color: #292524;">New Admin Booking</h2>
                     <p><strong>Booked by Admin for:</strong> ${client_name}</p>
                     <p><strong>Date:</strong> ${date} at ${formattedTime.slice(0, 5)}</p>
                     <p><strong>Provider:</strong> ${providerName}</p>
                </div>
            `
        });

        return NextResponse.json({
            success: true,
            booking,
            message: 'Booking created successfully'
        });

    } catch (error: any) {
        console.error('Admin Booking Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create booking' },
            { status: 500 }
        );
    }
}
