import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = session.user.email;

        // Fetch bookings for this email
        // We use supabaseAdmin to bypass RLS, but we strictly filter by the session email
        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                *,
                time_slot:time_slots(*)
            `)
            .eq('client_email', userEmail)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Sort by date (descending)
        const sortedBookings = bookings?.sort((a: any, b: any) => {
            const dateA = new Date(a.time_slot.date + 'T' + a.time_slot.start_time).getTime();
            const dateB = new Date(b.time_slot.date + 'T' + b.time_slot.start_time).getTime();
            return dateB - dateA;
        });

        return NextResponse.json(sortedBookings || []);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}
