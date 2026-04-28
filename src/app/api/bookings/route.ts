import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            time_slot_id, 
            client_name, 
            client_email, 
            client_phone, 
            client_address, 
            client_city, 
            client_state, 
            client_zip, 
            notes, 
            service_type,
            intake_form_id // Optional link to clinical profile
        } = body;

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

        // 1. Calculate Urgency (Scenario 2 vs 3)
        const bookingDate = new Date(slot.date + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        // If within 7 days, it's an urgent request (Scenario 2)
        const isUrgent = bookingDate < sevenDaysFromNow;

        // 2. Create booking with PENDING status (Point 3)
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
                service_type: service_type || 'Therapeutic Massage',
                notes,
                intake_form_id: intake_form_id || null,
                status: 'pending' // ALWAYS pending for clients
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

        // Generate WhatsApp Links
        const fromEmail = 'bookings@sothistherapeutic.com';
        const sothisPhone = '15512414652';
        const clientWaMessage = `Hi Sothis, I submitted an appointment request online for ${new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${slot.start_time.slice(0, 5)}.`;
        const clientWaLink = `https://wa.me/${sothisPhone}?text=${encodeURIComponent(clientWaMessage)}`;

        let adminWaLink = '';
        if (client_phone) {
            const cleanPhone = client_phone.replace(/\D/g, '');
            const finalPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
            adminWaLink = `https://wa.me/${finalPhone}`;
        }

        const { error: clientError } = await resend.emails.send({
            from: `Sothis Bookings <${fromEmail}>`,
            to: client_email,
            subject: isUrgent ? 'URGENT Request Received - Sothis Therapeutic Massage' : 'Appointment Request Received - Sothis Therapeutic Massage',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #292524; border-bottom: 2px solid #78716c; padding-bottom: 10px;">
                        ${isUrgent ? '⚠️ Urgent Request Received' : 'Appointment Request Received'}
                    </h2>
                    
                    <p style="color: #44403c; line-height: 1.6; font-size: 16px;">
                        Hi ${client_name},
                    </p>
                    
                    <p style="color: #44403c; line-height: 1.6; font-size: 16px;">
                        We have received your appointment request. A professional will review your requested time and reply with the available date and time, which may differ from your initial request.
                    </p>

                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h3 style="color: #92400e; margin-top: 0;">Action Required: Health Profile Update</h3>
                        <p style="color: #92400e; line-height: 1.6;">
                            Your appointment will <strong>NOT</strong> be assigned or confirmed until your Clinical Health Profile is submitted. If you did not complete it during the request process, please do so from your dashboard.
                        </p>
                    </div>
                    
                    <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #292524; margin-top: 0;">Requested Details</h3>
                        <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p style="margin: 10px 0;"><strong>Time:</strong> ${slot.start_time.slice(0, 5)}</p>
                        <p style="margin: 10px 0;"><strong>Provider:</strong> ${providerName}</p>
                        <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #f5a623;">Pending Confirmation</span></p>
                    </div>

                    <div style="margin-top: 30px;">
                        <p style="color: #44403c; font-weight: bold; margin-bottom: 10px;">Need to add more details or ask a question?</p>
                        <a href="${clientWaLink}" style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Message Us on WhatsApp
                        </a>
                    </div>
                    
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

        const { error: adminError } = await resend.emails.send({
            from: `Sothis Booking System <${fromEmail}>`,
            to: process.env.CONTACT_EMAIL || 'sothistherapeutic@gmail.com',
            subject: `${isUrgent ? '🔴 URGENT REQUEST:' : 'New Request:'} ${client_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #292524; border-bottom: 2px solid #78716c; padding-bottom: 10px;">
                        ${isUrgent ? '🔴 Urgent Booking Request' : 'New Booking Request'}
                    </h2>
                    
                    <p style="font-size: 16px;"><strong>This request is PENDING your approval.</strong></p>
                    
                    <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #292524; margin-top: 0;">Client Information</h3>
                        <p style="margin: 10px 0;"><strong>Name:</strong> ${client_name}</p>
                        <p style="margin: 10px 0;"><strong>Email:</strong> ${client_email}</p>
                        ${client_phone ? `<p style="margin: 10px 0;"><strong>Phone:</strong> ${client_phone}</p>` : ''}
                    </div>
                    
                    <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #292524; margin-top: 0;">Appointment Details</h3>
                        <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p style="margin: 10px 0;"><strong>Time:</strong> ${slot.start_time.slice(0, 5)}</p>
                        <p style="margin: 10px 0;"><strong>Urgency:</strong> ${isUrgent ? '<span style="color: red; font-weight: bold;">URGENT (Within 7 Days)</span>' : 'Standard (7+ Days)'}</p>
                        <p style="margin: 10px 0;"><strong>Notes:</strong> ${notes}</p>
                    </div>

                    ${adminWaLink ? `
                        <div style="margin-top: 25px;">
                            <a href="${adminWaLink}" style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                Message Client on WhatsApp
                            </a>
                        </div>
                    ` : ''}
                    
                    <p style="color: #44403c; line-height: 1.6; margin-top: 25px;">
                        Approve or reschedule this request in your <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/bookings">admin dashboard</a>.
                    </p>
                </div>
            `,
            replyTo: client_email
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
