import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        let authorized = false;

        // 1. Check Cron Secret
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
            authorized = true;
        }

        // 2. Check Admin Session
        if (!authorized) {
            const session = await getServerSession(authOptions);
            if (session && session.user?.role === 'admin') {
                authorized = true;
            }
        }

        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 3. Count queued newsletters
        const { count, error } = await supabaseAdmin
            .from('newsletters')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'queued')
            .is('sent_at', null);

        if (error) throw error;

        const queuedCount = count || 0;

        // If Nancy has newsletters queued, do not bother her
        if (queuedCount > 0) {
            return NextResponse.json({
                success: true,
                message: `Nancy has ${queuedCount} newsletter(s) queued. No reminder needed.`,
                queuedCount,
            });
        }

        // If 0 queued newsletters, send reminder email to Nancy
        const adminEmail = process.env.CONTACT_EMAIL || 'sothistherapeutic@gmail.com';
        await resend.emails.send({
            from: 'Sothis Assistant <bookings@sothistherapeutic.com>',
            to: adminEmail,
            subject: '🌿 Reminder: Queue next week’s Sothis newsletter',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e7e5e4; border-radius: 16px; background-color: #ffffff;">
                    <h2 style="font-family: Georgia, serif; color: #1c1917; margin-top: 0;">Hi Nancy!</h2>
                    <p style="color: #44403c; line-height: 1.6; font-size: 15px;">
                        You currently have no newsletters queued for upcoming Monday broadcasts.
                    </p>
                    <p style="color: #44403c; line-height: 1.6; font-size: 15px;">
                        Taking 2 minutes to draft a quick tip or recycling an evergreen newsletter keeps your clients engaged and books open slots.
                    </p>
                    <div style="margin: 24px 0; text-align: center;">
                        <a href="https://sothistherapeutic.com/admin/newsletter" style="display: inline-block; background-color: #292524; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                            ✍️ Open Sothis Newsletter Studio
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #a8a29e; margin-bottom: 0;">
                        Sothis Therapeutic Massage · Automated Marketing Assistant
                    </p>
                </div>
            `
        });

        return NextResponse.json({
            success: true,
            message: 'Reminder sent to Nancy.',
            queuedCount: 0,
        });
    } catch (error: any) {
        console.error('[Cron Reminder] Error:', error);
        return NextResponse.json({ error: error?.message || 'Reminder cron error' }, { status: 500 });
    }
}
