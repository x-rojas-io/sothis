import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { time_slot_id, client_name, client_email, client_phone, client_address, client_city, client_state, client_zip, notes, service_type } = body;

        // Validate input
        if (!time_slot_id || !client_name || !client_email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if slot is still available
        const { data: slot, error: slotError } = await supabaseAdmin
            .from('time_slots')
            .select(`
                *,
                providers (
                    name
                )
            `)
            .eq('id', time_slot_id)
            .eq('status', 'available')
            .single();

        if (slotError || !slot) {
            return NextResponse.json(
                { error: 'This time slot is no longer available' },
                { status: 400 }
            );
        }

        // Create booking
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert([{
                time_slot_id,
                client_name,
                client_email,
                client_phone,
                client_address,
                client_city,
                client_state,
                client_zip,
                service_type: service_type || 'Therapeutic Massage', // Fallback
                notes,
                status: 'confirmed'
            }])
            .select()
            .single();

        if (bookingError) {
            // Check for unique constraint violation (Race Condition)
            if (bookingError.code === '23505') {
                return NextResponse.json(
                    { error: 'This time slot was just booked by another client. Please select a different time.' },
                    { status: 409 }
                );
            }
            throw bookingError;
        }

        // Get Provider Name
        // @ts-ignore
        const providerName = slot.providers?.name || 'Sothis Provider';

        // Send confirmation email to client
        const fromEmail = 'bookings@sothistherapeutic.com';

        const { error: clientError } = await resend.emails.send({
            from: `Sothis Bookings <${fromEmail}>`,
            to: client_email,
            subject: 'Appointment Confirmed - Sothis Therapeutic Massage',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #292524; border-bottom: 2px solid #78716c; padding-bottom: 10px;">
                        Appointment Confirmed
                    </h2>
                    
                    <p style="color: #44403c; line-height: 1.6;">
                        Hi ${client_name},
                    </p>
                    
                    <p style="color: #44403c; line-height: 1.6;">
                        Your massage appointment with <strong>${providerName}</strong> has been confirmed!
                    </p>
                    
                    <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #292524; margin-top: 0;">Appointment Details</h3>
                        <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p style="margin: 10px 0;"><strong>Time:</strong> ${slot.start_time.slice(0, 5)}</p>
                        <p style="margin: 10px 0;"><strong>Provider:</strong> ${providerName}</p>
                        <p style="margin: 10px 0;"><strong>Service:</strong> Therapeutic Massage</p>
                        <p style="margin: 10px 0;"><strong>Location:</strong> Edgewater, NJ</p>
                    </div>
                    
                    <p style="color: #44403c; line-height: 1.6;">
                        If you need to cancel or reschedule, please contact us at sothistherapeutic@gmail.com or via Instagram @sothistherapeutic.
                    </p>
                    
                    <p style="color: #44403c; line-height: 1.6;">
                        We look forward to seeing you!
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e7e5e4; color: #78716c; font-size: 12px;">
                        <p>Sothis Therapeutic Massage</p>
                        <p>Edgewater, NJ</p>
                        <p>sothistherapeutic@gmail.com</p>
                    </div>
                </div>
            `,
        });

        if (clientError) {
            console.error('Resend Client Email Error:', clientError);
        }

        // Send notification to Nancy
        const { error: adminError } = await resend.emails.send({
            from: `Sothis Booking System <${fromEmail}>`,
            to: process.env.CONTACT_EMAIL || 'sothistherapeutic@gmail.com',
            subject: `New Booking: ${client_name} with ${providerName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #292524; border-bottom: 2px solid #78716c; padding-bottom: 10px;">
                        New Appointment Booked
                    </h2>
                    
                    <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #292524; margin-top: 0;">Client Information</h3>
                        <p style="margin: 10px 0;"><strong>Name:</strong> ${client_name}</p>
                        <p style="margin: 10px 0;"><strong>Email:</strong> ${client_email}</p>
                        ${client_phone ? `<p style="margin: 10px 0;"><strong>Phone:</strong> ${client_phone}</p>` : ''}
                        ${notes ? `<p style="margin: 10px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
                    </div>
                    
                    <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #292524; margin-top: 0;">Appointment Details</h3>
                        <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p style="margin: 10px 0;"><strong>Time:</strong> ${slot.start_time.slice(0, 5)}</p>
                        <p style="margin: 10px 0;"><strong>Provider:</strong> ${providerName}</p>
                        <p style="margin: 10px 0;"><strong>Service:</strong> ${service_type || 'Therapeutic Massage'}</p>
                    </div>
                    
                    <p style="color: #44403c; line-height: 1.6;">
                        View all bookings in your <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/bookings">admin dashboard</a>.
                    </p>
                </div>
            `,
        });

        if (adminError) {
            console.error('Resend Admin Email Error:', adminError);
        }

        return NextResponse.json({
            success: true,
            booking,
            message: 'Booking confirmed! Check your email for details.'
        });
    } catch (error) {
        console.error('Booking error:', error);
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        );
    }
}
