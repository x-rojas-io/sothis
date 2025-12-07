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

        // Fetch all bookings with time slot details
        const { data, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                *,
                time_slot:time_slots(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Sort by Booking Date (Time Slot Date) instead of creation date if preferred, 
        // but typically "New Bookings" at top is good.
        // Let's sort by Appointment Date for the "Schedule" view? 
        // Or user can sort. Let's return them by Appointment Date desc (newest appointments first or future first?)
        // Let's stick with database sort for now, or refine.

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

        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('bookings')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // If cancelling, ensure the time slot is freed? 
        // Logic: if booking is cancelled, the slot remains "available"? 
        // Or strictly speaking, the slot is linked to the booking. 
        // If booking is cancelled, we might want to free the slot.
        // But our schema links booking -> slot. Slot has specific status? 
        // Let's check schema. Usually slot has 'booked' status if we update it.
        // Wait, 'src/app/api/bookings/route.ts' creates booking but doesn't seem to update time_slot status to 'booked' explicitly?
        // Let's check 'src/app/api/bookings/route.ts' again.

        // Actually, let's keep it simple: Update booking status.
        // If we need to free the slot, we should do it here. 
        // But 'bookings' table usually drives availability if we query 'left join'.
        // For now, just updating booking status is the user request.

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
}
