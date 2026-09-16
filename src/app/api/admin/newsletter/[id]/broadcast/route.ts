import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';
import { generateNewsletterHtml } from '@/lib/newsletter-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch newsletter
        const { data: newsletter, error: nError } = await supabaseAdmin
            .from('newsletters')
            .select('*')
            .eq('id', id)
            .single();

        if (nError || !newsletter) {
            return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
        }

        // 2. Fetch all active subscribers
        const { data: subscribers, error: sError } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('id, email, unsubscribe_token')
            .eq('is_active', true);

        if (sError) throw sError;

        if (!subscribers || subscribers.length === 0) {
            return NextResponse.json({ error: 'No active subscribers found to broadcast to.' }, { status: 400 });
        }

        const customCtaUrl = newsletter.cta_url && newsletter.cta_url.trim() !== '' ? newsletter.cta_url.trim() : null;
        const ctaUrlWithTopic = customCtaUrl || `https://sothistherapeutic.com/api/newsletter/cta?topic=${encodeURIComponent(newsletter.title)}`;

        // 3. Batch send in chunks of 100 (Resend batch limit)
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
                        newsletter_id: id,
                        subscriber_id: sub.id,
                        email: sub.email,
                        status: 'sent',
                    });
                });
            } catch (batchErr: any) {
                console.error(`Batch send error for chunk ${i}:`, batchErr);
                chunk.forEach(sub => {
                    deliveryLogs.push({
                        newsletter_id: id,
                        subscriber_id: sub.id,
                        email: sub.email,
                        status: 'failed',
                        error: batchErr?.message || 'Batch failed',
                    });
                });
            }
        }

        // 4. Update newsletter record
        await supabaseAdmin
            .from('newsletters')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                recipients_count: totalSent,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        // 5. Insert delivery logs in background
        if (deliveryLogs.length > 0) {
            try {
                await supabaseAdmin.from('newsletter_deliveries').insert(deliveryLogs);
            } catch (logErr) {
                console.warn('Failed to save delivery logs:', logErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Newsletter successfully broadcast to ${totalSent} subscribers!`,
            recipientsCount: totalSent
        });
    } catch (error: any) {
        console.error('Error broadcasting newsletter:', error);
        return NextResponse.json({ error: error?.message || 'Failed to broadcast newsletter' }, { status: 500 });
    }
}
