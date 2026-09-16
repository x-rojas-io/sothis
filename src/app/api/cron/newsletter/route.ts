import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';
import { generateNewsletterHtml } from '@/lib/newsletter-template';

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

        // 2. Check Admin Session (Manual Trigger in Admin)
        if (!authorized) {
            const session = await getServerSession(authOptions);
            if (session && session.user?.role === 'admin') {
                authorized = true;
            }
        }

        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 3. Find oldest queued newsletter
        const { data: newsletter, error: nError } = await supabaseAdmin
            .from('newsletters')
            .select('*')
            .eq('status', 'queued')
            .is('sent_at', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (nError) throw nError;

        // Requirement: If no newsletters available, no email is triggered!
        if (!newsletter) {
            return NextResponse.json({
                success: true,
                message: 'No queued newsletters found. No emails triggered.'
            });
        }

        // 4. Fetch all active subscribers
        const { data: subscribers, error: sError } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('id, email, unsubscribe_token')
            .eq('is_active', true);

        if (sError) throw sError;

        if (!subscribers || subscribers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Newsletter found, but 0 active subscribers exist.'
            });
        }

        const customCtaUrl = newsletter.cta_url && newsletter.cta_url.trim() !== '' ? newsletter.cta_url.trim() : null;
        const ctaUrlWithTopic = customCtaUrl || `https://sothistherapeutic.com/api/newsletter/cta?topic=${encodeURIComponent(newsletter.title)}`;

        // 5. Batch send in chunks of 100
        const CHUNK_SIZE = 100;
        let totalSent = 0;
        const deliveryLogs: Array<{ newsletter_id: string; subscriber_id: string; email: string; status: 'sent' | 'failed'; error?: string }> = [];

        for (let i = 0; i < subscribers.length; i += CHUNK_SIZE) {
            const chunk = subscribers.slice(i, i + CHUNK_SIZE);
            const batchPayload = chunk.map(sub => {
                const unsubscribeUrl = `https://sothistherapeutic.com/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
                return {
                    from: 'Nancy from Sothis <bookings@sothistherapeutic.com>',
                    to: sub.email,
                    subject: newsletter.title,
                    html: generateNewsletterHtml({
                        title: newsletter.title,
                        previewText: newsletter.preview_text || undefined,
                        body: newsletter.body,
                        imageUrl: newsletter.image_url || undefined,
                        ctaText: newsletter.cta_text || 'Chat with Nancy on WhatsApp',
                        ctaUrl: ctaUrlWithTopic,
                        unsubscribeUrl,
                    }),
                    headers: {
                        'List-Unsubscribe': `<${unsubscribeUrl}>`,
                        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                    }
                };
            });

            try {
                await resend.batch.send(batchPayload);
                totalSent += chunk.length;
                chunk.forEach(sub => {
                    deliveryLogs.push({
                        newsletter_id: newsletter.id,
                        subscriber_id: sub.id,
                        email: sub.email,
                        status: 'sent',
                    });
                });
            } catch (batchErr: any) {
                console.error(`Batch send error:`, batchErr);
                chunk.forEach(sub => {
                    deliveryLogs.push({
                        newsletter_id: newsletter.id,
                        subscriber_id: sub.id,
                        email: sub.email,
                        status: 'failed',
                        error: batchErr?.message || 'Batch failed',
                    });
                });
            }
        }

        // 6. Update newsletter record
        await supabaseAdmin
            .from('newsletters')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                recipients_count: totalSent,
                updated_at: new Date().toISOString(),
            })
            .eq('id', newsletter.id);

        // 7. Insert audit logs
        if (deliveryLogs.length > 0) {
            try {
                await supabaseAdmin.from('newsletter_deliveries').insert(deliveryLogs);
            } catch (logErr) {
                console.warn('Failed to insert audit logs:', logErr);
            }
        }

        // 8. Send Nancy confirmation summary email
        try {
            await resend.emails.send({
                from: 'Sothis Notifications <bookings@sothistherapeutic.com>',
                to: process.env.CONTACT_EMAIL || 'sothistherapeutic@gmail.com',
                subject: `✅ Weekly Newsletter Sent: "${newsletter.title}" (${totalSent} recipients)`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px;">
                        <h2 style="color: #292524; margin-top: 0;">Weekly Newsletter Dispatched</h2>
                        <p style="color: #57534e;">Hi Nancy,</p>
                        <p style="color: #57534e;">Your queued newsletter <strong>"${newsletter.title}"</strong> was successfully delivered to <strong>${totalSent} active subscribers</strong>.</p>
                        <div style="margin: 20px 0; padding: 12px 16px; background-color: #f5f5f4; border-radius: 8px; font-size: 13px; color: #78716c;">
                            Replies and WhatsApp messages will arrive directly to your phone.
                        </div>
                    </div>
                `
            });
        } catch (summaryErr) {
            console.warn('Failed to send admin summary email:', summaryErr);
        }

        return NextResponse.json({
            success: true,
            newsletterTitle: newsletter.title,
            recipientsCount: totalSent,
        });
    } catch (error: any) {
        console.error('[Cron Newsletter] Error:', error);
        return NextResponse.json({ error: error?.message || 'Cron error' }, { status: 500 });
    }
}
