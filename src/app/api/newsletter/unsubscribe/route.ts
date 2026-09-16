import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper to mask email (e.g. "sarah.connor@gmail.com" -> "s***r@gmail.com")
function maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return email;
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

// GET /api/newsletter/unsubscribe?token=...
// Lookup token and return masked email for confirmation page
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const { data: subscriber, error } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('id, email, is_active')
            .eq('unsubscribe_token', token)
            .maybeSingle();

        if (error || !subscriber) {
            return NextResponse.json({ error: 'Invalid or expired unsubscribe link.' }, { status: 404 });
        }

        return NextResponse.json({
            valid: true,
            maskedEmail: maskEmail(subscriber.email),
            isActive: subscriber.is_active
        });
    } catch (error: any) {
        console.error('Unsubscribe lookup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/newsletter/unsubscribe
// Perform the actual unsubscription or undo/resubscription
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token, action = 'unsubscribe' } = body;

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const { data: subscriber, error: findError } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('id, email, is_active')
            .eq('unsubscribe_token', token)
            .maybeSingle();

        if (findError || !subscriber) {
            return NextResponse.json({ error: 'Subscriber not found or invalid link.' }, { status: 404 });
        }

        if (action === 'resubscribe') {
            await supabaseAdmin
                .from('newsletter_subscribers')
                .update({ is_active: true, unsubscribed_at: null })
                .eq('id', subscriber.id);

            return NextResponse.json({
                success: true,
                message: 'Your subscription has been restored!',
                isActive: true
            });
        } else {
            await supabaseAdmin
                .from('newsletter_subscribers')
                .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
                .eq('id', subscriber.id);

            return NextResponse.json({
                success: true,
                message: 'You have been successfully unsubscribed.',
                isActive: false
            });
        }
    } catch (error: any) {
        console.error('Unsubscribe action error:', error);
        return NextResponse.json({ error: error?.message || 'Failed to update subscription' }, { status: 500 });
    }
}
