import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET(request: Request) {
    try {
        // 1. Security Check (Vercel Cron)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Calculate "Tomorrow" (EST/EDT)
        // We want bookings where date == tomorrow
        const now = new Date();
        // Adjust to EST/EDT manually or use library. For simplicity, we assume server time or UTC.
        // Vercel Cron runs at 11:00 UTC (6:00 AM EST).
        // So 'tomorrow' relative to *now* (11:00 UTC) is the next calendar day.

        // Let's rely on date strings to be safe.
        // If today is 2025-02-09, we want bookings for 2025-02-10.
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const targetDate = tomorrow.toISOString().split('T')[0];

        console.log(`[Cron] Sending reminders for date: ${targetDate}`);

        // 3. Fetch Bookings
        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                *,
                time_slot:time_slots!inner(
                    date,
                    start_time,
                    provider:providers(name)
                )
            `)
            .eq('time_slot.date', targetDate)
            .eq('status', 'confirmed');

        if (error) {
            console.error('[Cron] DB Error:', error);
            throw error;
        }

        if (!bookings || bookings.length === 0) {
            return NextResponse.json({ message: 'No bookings found for tomorrow', date: targetDate });
        }

        console.log(`[Cron] Found ${bookings.length} bookings.`);

        // 4. Send Emails
        const emailPromises = bookings.map(async (booking: any) => {
            const clientName = booking.client_name;
            const clientEmail = booking.client_email;
            const time = booking.time_slot.start_time.slice(0, 5); // HH:MM
            const providerName = booking.time_slot.provider?.name || 'Sothis Team';

            // Format Date for Email (e.g., "Monday, February 10")
            const [y, m, d] = booking.time_slot.date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            });

            try {
                await resend.emails.send({
                    from: 'Sothis Reminders <bookings@sothistherapeutic.com>',
                    to: clientEmail,
                    subject: `Reminder: Appointment Tomorrow at ${time}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #292524;">Appointment Reminder</h2>
                            <p style="color: #44403c; line-height: 1.6;">Hi ${clientName},</p>
                            <p style="color: #44403c; line-height: 1.6;">
                                This is a friendly reminder for your appointment tomorrow with <strong>${providerName}</strong>.
                            </p>
                            <div style="background-color: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
                                <p style="margin: 10px 0;"><strong>Time:</strong> ${time}</p>
                                <p style="margin: 10px 0;"><strong>Location:</strong> Sothis Therapeutic Massage, Edgewater, NJ</p>
                            </div>
                            <p style="font-size: 12px; color: #78716c;">
                                If you need to reschedule, please contact us at least 24 hours in advance.
                            </p>
                        </div>
                    `
                });
                return { id: booking.id, status: 'sent' };
            } catch (err) {
                console.error(`[Cron] Failed to send to ${clientEmail}`, err);
                return { id: booking.id, status: 'failed', error: err };
            }
        });

        const results = await Promise.all(emailPromises);

        return NextResponse.json({
            success: true,
            targetDate,
            processed: results.length,
            results
        });

    } catch (error: any) {
        console.error('[Cron] Handler Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
