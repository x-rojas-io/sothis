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
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
        // We can use count queries
        const { count: todayCount } = await supabaseAdmin
            .from('bookings')
            .select('id, time_slots!inner(date)', { count: 'exact', head: true })
            .eq('status', 'confirmed')
            .eq('time_slots.date', today);

        // For week count
        const { count: weekCount } = await supabaseAdmin
            .from('bookings')
            .select('id, time_slots!inner(date)', { count: 'exact', head: true })
            .eq('status', 'confirmed')
            .gte('time_slots.date', today)
            .lte('time_slots.date', weekFromNow);

        const { count: availableCount } = await supabaseAdmin
            .from('time_slots')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'available')
            .gte('date', today);

        return NextResponse.json({
            upcomingBookings: validBookings,
            stats: {
                todayBookings: todayCount || 0,
                weekBookings: weekCount || 0,
                availableSlots: availableCount || 0
            }
        });

    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
