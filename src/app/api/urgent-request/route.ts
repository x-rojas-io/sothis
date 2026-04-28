import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            client_name,
            client_email,
            client_phone,
            date,
            notes,
        } = body;

        if (!client_name || !client_email || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const fromEmail = 'bookings@sothistherapeutic.com';
        const sothisEmail = process.env.CONTACT_EMAIL || 'sothistherapeutic@gmail.com';
        const sothisPhone = '15512414652';

        // Format Date for Display
        const dateObj = new Date(date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        // 1. WhatsApp Link for Admin to Contact Client
        let adminWaLink = '';
        if (client_phone) {
            // Clean phone number (remove non-digits)
            const cleanPhone = client_phone.replace(/\D/g, '');
            // Simple check, assume US if 10 digits
            const finalPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
            adminWaLink = `https://wa.me/${finalPhone}`;
        }

        // 2. WhatsApp Link for Client to Contact Admin
        const clientWaMessage = `Hi Sothis, I just submitted an urgent appointment request online for ${formattedDate}.`;
        const clientWaLink = `https://wa.me/${sothisPhone}?text=${encodeURIComponent(clientWaMessage)}`;

        // Send Email to Admin (Sothis)
        await resend.emails.send({
            from: `Sothis Booking System <${fromEmail}>`,
            to: sothisEmail,
            subject: `🔴 URGENT REQUEST (No specific time): ${client_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #b91c1c; border-bottom: 2px solid #fca5a5; padding-bottom: 10px;">
                        Urgent Appointment Request (Within 48 Hours)
                    </h2>
                    <p style="color: #44403c; font-size: 16px;">
                        A client has requested an urgent appointment for <strong>${formattedDate}</strong>.
                    </p>
                    
                    <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #292524;">Client Details</h3>
                        <p style="margin: 8px 0;"><strong>Name:</strong> ${client_name}</p>
                        <p style="margin: 8px 0;"><strong>Email:</strong> ${client_email}</p>
                        <p style="margin: 8px 0;"><strong>Phone:</strong> ${client_phone || 'Not provided'}</p>
                        <p style="margin: 8px 0;"><strong>Preferred Times / Reason:</strong><br/>${notes}</p>
                    </div>

                    ${adminWaLink ? `
                        <div style="margin-top: 25px;">
                            <a href="${adminWaLink}" style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                Message Client on WhatsApp
                            </a>
                        </div>
                    ` : ''}
                    
                    <p style="margin-top: 20px; color: #78716c; font-size: 14px;">
                        You can reply directly to this email to contact the client, or use the WhatsApp link above.
                    </p>
                </div>
            `,
            replyTo: client_email
        });

        // Send Email to Client
        await resend.emails.send({
            from: `Sothis Bookings <${fromEmail}>`,
            to: client_email,
            subject: 'Urgent Appointment Request Received - Sothis Therapeutic Massage',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #292524; border-bottom: 2px solid #d6d3d1; padding-bottom: 10px;">
                        Urgent Request Received
                    </h2>
                    <p style="color: #44403c; font-size: 16px;">Hi ${client_name},</p>
                    <p style="color: #44403c; font-size: 16px; line-height: 1.6;">
                        We have received your urgent appointment request for <strong>${formattedDate}</strong>. 
                        A professional will review your request and get back to you shortly to coordinate an available time.
                    </p>

                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h3 style="color: #92400e; margin-top: 0;">Action Required: Health Profile Update</h3>
                        <p style="color: #92400e; line-height: 1.6;">
                            Your appointment will <strong>NOT</strong> be assigned or confirmed until your Clinical Health Profile is submitted. If you did not complete it during the request process, please do so from your dashboard.
                        </p>
                    </div>

                    <div style="margin-top: 30px;">
                        <p style="color: #44403c; font-weight: bold; margin-bottom: 10px;">Need to add more details?</p>
                        <a href="${clientWaLink}" style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Message Us on WhatsApp
                        </a>
                    </div>
                </div>
            `
        });

        return NextResponse.json({ success: true, message: 'Urgent request submitted successfully' });

    } catch (error: any) {
        console.error('Urgent Request Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to submit request' }, { status: 500 });
    }
}
