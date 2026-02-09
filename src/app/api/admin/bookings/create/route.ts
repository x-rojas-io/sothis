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
            service_type, // New field
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

        // 1. Set Duration to 2 Hours (120 minutes)
        const startHour = parseInt(timeParts[0]);
        const startMin = parseInt(timeParts[1]);

        const endDateObj = new Date();
        endDateObj.setHours(startHour + 2); // Add 2 hours
        endDateObj.setMinutes(startMin);

        const endHour = endDateObj.getHours();
        const endMin = endDateObj.getMinutes();

        const formattedEndTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

        // 2. Check for Overlaps
        // Query for any BOOKED slots on the same date and provider that overlap
        // Overlap Logic: (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
        const { data: conflictingSlots, error: conflictError } = await supabaseAdmin
            .from('time_slots')
            .select('start_time, end_time')
            .eq('date', date)
            .eq('provider_id', provider_id)
            .eq('status', 'booked') // Only care about booked slots
            .lt('start_time', formattedEndTime)
            .gt('end_time', formattedTime);

        if (conflictError) {
            console.error('Error checking conflicts:', conflictError);
            throw conflictError;
        }

        if (conflictingSlots && conflictingSlots.length > 0) {
            // Conflict found!
            // Calculate Next Available Time
            // Strategy: Find the max end_time of conflicts and add 15 min buffer
            let maxEndTime = formattedEndTime;

            conflictingSlots.forEach(slot => {
                if (slot.end_time > maxEndTime) {
                    maxEndTime = slot.end_time;
                }
            });

            // Parse maxEndTime to add buffer
            const [maxH, maxM] = maxEndTime.split(':').map(Number);
            const nextDate = new Date();
            nextDate.setHours(maxH);
            nextDate.setMinutes(maxM + 15); // Add 15 min buffer

            const nextH = nextDate.getHours().toString().padStart(2, '0');
            const nextM = nextDate.getMinutes().toString().padStart(2, '0');
            const nextAvailable = `${nextH}:${nextM}`;

            return NextResponse.json({
                error: 'Time slot conflict',
                nextAvailable: nextAvailable
            }, { status: 409 });
        }


        // 3. Find or Create Time Slot
        let timeSlotId = null;

        // Check if EXACT slot exists (unlikely given custom times, but possible)
        const { data: existingSlot, error: fetchError } = await supabaseAdmin
            .from('time_slots')
            .select('id, status')
            .eq('date', date)
            .eq('start_time', formattedTime)
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // ... error handling
        }

        if (existingSlot) {
            timeSlotId = existingSlot.id;
            // Update to booked if available
            await supabaseAdmin
                .from('time_slots')
                .update({
                    status: 'booked',
                    end_time: formattedEndTime // Enforce 2 hour duration even if reusing slot
                })
                .eq('id', timeSlotId);

        } else {
            // Create new slot
            const { data: newSlot, error: createError } = await supabaseAdmin
                .from('time_slots')
                .insert({
                    date,
                    start_time: formattedTime,
                    end_time: formattedEndTime,
                    provider_id: provider_id,
                    status: 'booked'
                })
                .select()
                .single();

            // ... error handling ...
            if (createError) {
                if (createError.code === '23505') {
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
                service_type: service_type || 'Therapeutic Massage', // Fallback just in case
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
                        <p style="margin: 10px 0;"><strong>Service:</strong> ${service_type || 'Therapeutic Massage'}</p>
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
