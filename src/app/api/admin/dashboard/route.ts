import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date().toISOString().split('T')[0];
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Month calc
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // Fetch upcoming bookings (Simplify to JS filter to avoid PostgREST join syntax issues)
        const { data: allBookings, error: bookingsError } = await supabaseAdmin
            .from('bookings')
            .select(`
                *,
                time_slot:time_slots(*)
            `)
            .eq('status', 'confirmed');

        if (bookingsError) throw bookingsError;

        // Filter and sort in memory
        const validBookings = allBookings
            ?.filter((b: any) => b.time_slot && b.time_slot.date >= today)
            .sort((a: any, b: any) => {
                const dateA = new Date(a.time_slot.date + 'T' + a.time_slot.start_time).getTime();
                const dateB = new Date(b.time_slot.date + 'T' + b.time_slot.start_time).getTime();
                return dateA - dateB;
            })
            .slice(0, 5) || [];

        // Stats
        // Today
        const { count: todayCount } = await supabaseAdmin
            .from('bookings')
            .select('id, time_slots!inner(date)', { count: 'exact', head: true })
            .eq('status', 'confirmed')
            .eq('time_slots.date', today);

        // Week
        const { count: weekCount } = await supabaseAdmin
            .from('bookings')
            .select('id, time_slots!inner(date)', { count: 'exact', head: true })
            .eq('status', 'confirmed')
            .gte('time_slots.date', today)
            .lte('time_slots.date', weekFromNow);

        // Month
        const { count: monthCount } = await supabaseAdmin
            .from('bookings')
            .select('id, time_slots!inner(date)', { count: 'exact', head: true })
            .eq('status', 'confirmed')
            .gte('time_slots.date', startOfMonth)
            .lte('time_slots.date', endOfMonth);

        return NextResponse.json({
            upcomingBookings: validBookings,
            stats: {
                todayBookings: todayCount || 0,
                weekBookings: weekCount || 0,
                monthBookings: monthCount || 0,
            }
        });

    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
