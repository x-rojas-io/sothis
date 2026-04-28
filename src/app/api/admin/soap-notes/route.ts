import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['admin', 'provider'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get('booking_id');
        const clientEmail = searchParams.get('client_email');
        const limit = searchParams.get('limit');

        let response;

        if (bookingId) {
            response = await supabaseAdmin.from('soap_notes').select('*').eq('booking_id', bookingId).single();
        } else if (clientEmail) {
            let q = supabaseAdmin.from('soap_notes').select('*').eq('client_email', clientEmail).order('created_at', { ascending: false });
            if (limit) q = q.limit(parseInt(limit));
            response = await q;
        } else {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const { data, error } = response;
        
        if (error && bookingId && error.code === 'PGRST116') {
            return NextResponse.json(null);
        }

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['admin', 'provider'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        
        let id = body.id;
        if (!id && body.booking_id) {
            const { data: existing } = await supabaseAdmin
                .from('soap_notes')
                .select('id')
                .eq('booking_id', body.booking_id)
                .single();
            if (existing) id = existing.id;
        }

        const noteData = {
            ...body,
            provider_id: session.user.id,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = id 
            ? await supabaseAdmin.from('soap_notes').update(noteData).eq('id', id).select().single()
            : await supabaseAdmin.from('soap_notes').insert([noteData]).select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
