import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientEmail = searchParams.get('client_email');

        // Fetch all bookings with time slot details
        let query = supabaseAdmin
            .from('bookings')
            .select(`
                *,
                time_slot:time_slots(*)
            `)
            .order('created_at', { ascending: false });

        // Filter by client email if provided
        if (clientEmail) {
            query = query.eq('client_email', clientEmail);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Sorting in JS for simplicity on nested field
        const allBookings = data?.sort((a: any, b: any) => {
            const dateA = new Date(a.time_slot.date + 'T' + a.time_slot.start_time).getTime();
            const dateB = new Date(b.time_slot.date + 'T' + b.time_slot.start_time).getTime();
            return dateB - dateA; // Descending (latest dates first)
        });

        return NextResponse.json(allBookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status, notes } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        const { data, error } = await supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
}
