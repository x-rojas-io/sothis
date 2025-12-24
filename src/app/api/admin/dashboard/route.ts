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
        const adminSelectedProviderId = searchParams.get('provider_id');

        const today = new Date().toISOString().split('T')[0];
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Month calc
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // Determine the provider filter
        let filterProviderId: string | null = null;

        if (session.user.role === 'provider') {
            const { data: providerData } = await supabaseAdmin
                .from('providers')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (providerData) {
                filterProviderId = providerData.id;
            } else {
                return NextResponse.json({
                    upcomingBookings: [],
                    stats: { todayBookings: 0, weekBookings: 0, monthBookings: 0 },
                    userRole: session.user.role
                });
            }
        } else if (session.user.role === 'admin' && adminSelectedProviderId) {
            filterProviderId = adminSelectedProviderId;
        }

        // Build the query
        // We MUST use !inner on time_slots if we want to filter by time_slots.provider_id
        // Removed 'slug' as it appears to not exist on providers table and is not used by frontend here
        let query = supabaseAdmin
            .from('bookings')
            .select(`
                *,
                time_slot:time_slots!inner(
                    *,
                    provider:providers(id, name)
                )
            `)
            .eq('status', 'confirmed');

        if (filterProviderId) {
            query = query.eq('time_slots.provider_id', filterProviderId);
        }

        const { data: allBookings, error: bookingsError } = await query;

        if (bookingsError) throw bookingsError;

        // Filter and sort in memory
        const validBookings = allBookings
            ?.filter((b: any) => b.time_slot && b.time_slot.date >= today)
            .sort((a: any, b: any) => {
                const dateA = new Date(a.time_slot.date + 'T' + a.time_slot.start_time).getTime();
                const dateB = new Date(b.time_slot.date + 'T' + b.time_slot.start_time).getTime();
                return dateA - dateB;
            })
            // Map provider up to top level for frontend compatibility
            .map((b: any) => ({
                ...b,
                provider: b.time_slot?.provider
            }))
            || [];

        // Calculate Stats in memory to avoid complex separate queries
        // (Since we are fetching all confirmed bookings for the view anyway, or at least a reasonable subset.
        // If data grows huge, we should move back to COUNT queries, but for now this is efficient enough and simpler for filtering)

        const stats = {
            todayBookings: validBookings.filter((b: any) => b.time_slot.date === today).length,
            weekBookings: validBookings.filter((b: any) => b.time_slot.date >= today && b.time_slot.date <= weekFromNow).length,
            monthBookings: validBookings.filter((b: any) => b.time_slot.date >= startOfMonth && b.time_slot.date <= endOfMonth).length,
        };

        // For list, we might want to slice it now if we aren't doing frontend filtering
        // BUT, for Admin filtering, we need ALL future bookings.
        // Let's send top 50 maybe? Or just all valid upcoming. 
        // Let's send all valid upcoming for now so Admin can filter.

        return NextResponse.json({
            upcomingBookings: validBookings,
            stats: stats,
            userRole: session.user.role // return role to help frontend
        });

    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
