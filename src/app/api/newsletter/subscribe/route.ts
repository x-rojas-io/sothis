import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const rawEmail = body.email;
        const source = body.source || 'home_popup';

        if (!rawEmail || typeof rawEmail !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const email = rawEmail.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
        }

        // 1. Check if email belongs to an existing client
        const { data: client } = await supabaseAdmin
            .from('clients')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        const clientId = client?.id || null;

        // 2. Check if already in newsletter_subscribers
        const { data: existingSub } = await supabaseAdmin
            .from('newsletter_subscribers')
            .select('id, is_active, unsubscribe_token')
            .eq('email', email)
            .maybeSingle();

        if (existingSub) {
            if (existingSub.is_active) {
                return NextResponse.json({
                    success: true,
                    message: 'You are already subscribed to our newsletter!',
                    alreadySubscribed: true
                });
            } else {
                // Reactivate subscription
                const { error: updateError } = await supabaseAdmin
                    .from('newsletter_subscribers')
                    .update({
                        is_active: true,
                        unsubscribed_at: null,
                        client_id: clientId || undefined,
                        source: source
                    })
                    .eq('id', existingSub.id);

                if (updateError) throw updateError;

                return NextResponse.json({
                    success: true,
                    message: 'Welcome back! Your subscription has been reactivated.'
                });
            }
        }

        // 3. Insert new subscriber
        const { data: newSub, error: insertError } = await supabaseAdmin
            .from('newsletter_subscribers')
            .insert({
                email,
                client_id: clientId,
                is_active: true,
                source
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            message: 'Thank you for subscribing to our wellness newsletter!'
        });
    } catch (error: any) {
        console.error('Newsletter subscribe error:', error);
        return NextResponse.json({ error: error?.message || 'Failed to subscribe' }, { status: 500 });
    }
}
