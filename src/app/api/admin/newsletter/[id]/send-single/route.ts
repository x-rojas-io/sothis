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

        const body = await request.json();
        const rawEmail = body.email;
        const personalNote = body.note ? body.note.trim() : null;

        if (!rawEmail) {
            return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
        }

        const email = rawEmail.toLowerCase().trim();

        // 1. Fetch newsletter
        const { data: newsletter, error: nError } = await supabaseAdmin
            .from('newsletters')
            .select('*')
            .eq('id', id)
            .single();

        if (nError || !newsletter) {
            return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
        }

        // 2. Lookup or ensure subscriber token
        let { data: subscriber } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('id, unsubscribe_token')
            .eq('email', email)
            .maybeSingle();

        if (!subscriber) {
            const { data: newSub } = await supabaseAdmin
                .from('newsletter_subscribers')
                .insert({ email, source: 'manual_send', is_active: true })
                .select('id, unsubscribe_token')
                .single();
            subscriber = newSub;
        }

        const token = subscriber?.unsubscribe_token || 'direct';
        const unsubscribeUrl = `https://sothistherapeutic.com/newsletter/unsubscribe?token=${token}`;
        const customCtaUrl = newsletter.cta_url && newsletter.cta_url.trim() !== '' ? newsletter.cta_url.trim() : null;
        const ctaUrlWithTopic = customCtaUrl || `https://sothistherapeutic.com/api/newsletter/cta?topic=${encodeURIComponent(newsletter.title)}`;

        // Prepend personal note if provided
        const messageBody = personalNote 
            ? `<em>Note from Nancy: ${personalNote}</em>\n\n---\n\n${newsletter.body}`
            : newsletter.body;

        const html = generateNewsletterHtml({
            title: newsletter.title,
            previewText: newsletter.preview_text || undefined,
            body: messageBody,
            imageUrl: newsletter.image_url || undefined,
            ctaText: newsletter.cta_text || 'Chat with Nancy on WhatsApp',
            ctaUrl: ctaUrlWithTopic,
            unsubscribeUrl,
        });

        // 3. Send email
        const sendResult = await resend.emails.send({
            from: 'Nancy from Sothis <bookings@sothistherapeutic.com>',
            to: email,
            subject: newsletter.title,
            html,
            headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
        });

        // 4. Log delivery
        await supabaseAdmin
            .from('newsletter_deliveries')
            .insert({
                newsletter_id: id,
                subscriber_id: subscriber?.id || null,
                email,
                status: 'sent',
            });

        return NextResponse.json({
            success: true,
            message: `Newsletter successfully sent to ${email}`,
            result: sendResult
        });
    } catch (error: any) {
        console.error('Error sending single newsletter:', error);
        return NextResponse.json({ error: error?.message || 'Failed to send newsletter' }, { status: 500 });
    }
}
