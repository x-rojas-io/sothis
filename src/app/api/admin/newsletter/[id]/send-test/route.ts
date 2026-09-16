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

        const body = await request.json().catch(() => ({}));
        const targetEmail = body.testEmail?.trim() || session.user?.email || 'sothistherapeutic@gmail.com';

        // 1. Fetch newsletter
        const { data: newsletter, error } = await supabaseAdmin
            .from('newsletters')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !newsletter) {
            return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
        }

        const customCtaUrl = newsletter.cta_url && newsletter.cta_url.trim() !== '' ? newsletter.cta_url.trim() : null;
        const ctaUrlWithTopic = customCtaUrl || `https://sothistherapeutic.com/api/newsletter/cta?topic=${encodeURIComponent(newsletter.title)}`;

        // 2. Generate HTML
        const html = generateNewsletterHtml({
            title: `[TEST PREVIEW] ${newsletter.title}`,
            previewText: newsletter.preview_text || undefined,
            body: newsletter.body,
            imageUrl: newsletter.image_url || undefined,
            ctaText: newsletter.cta_text || 'Chat with Nancy on WhatsApp',
            ctaUrl: ctaUrlWithTopic,
            unsubscribeUrl: 'https://sothistherapeutic.com/newsletter/unsubscribe?token=test-preview-token',
        });

        // 3. Send email via Resend
        const result = await resend.emails.send({
            from: 'Nancy from Sothis <bookings@sothistherapeutic.com>',
            to: targetEmail,
            subject: `[TEST PREVIEW] ${newsletter.title}`,
            html: html,
        });

        return NextResponse.json({
            success: true,
            message: `Test email sent successfully to ${targetEmail}`,
            result
        });
    } catch (error: any) {
        console.error('Error sending test newsletter:', error);
        return NextResponse.json({ error: error?.message || 'Failed to send test email' }, { status: 500 });
    }
}
