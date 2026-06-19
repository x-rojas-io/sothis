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
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Missing start_date or end_date parameters' }, { status: 400 });
        }

        // Fetch bookings within the date range that are confirmed or completed
        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                client_name,
                client_email,
                service_type,
                notes,
                status,
                price,
                duration,
                created_at,
                time_slot:time_slots!inner(
                    id,
                    date,
                    start_time,
                    end_time,
                    provider_id,
                    provider:providers(
                        id,
                        name,
                        color_code
                    )
                )
            `)
            .in('status', ['confirmed', 'completed'])
            .gte('time_slots.date', startDate)
            .lte('time_slots.date', endDate);

        if (error) throw error;

        // Calculate Summary Metrics
        let totalIncome = 0;
        let bookingsWithPriceCount = 0;
        let totalDuration = 0;
        let bookingsWithDurationCount = 0;

        const serviceBreakdownMap: Record<string, { service: string; count: number; income: number; totalDuration: number; durationCount: number }> = {};
        const providerBreakdownMap: Record<string, { providerId: string; providerName: string; colorCode: string; count: number; income: number; totalDuration: number; durationCount: number }> = {};

        const formattedBookings = (bookings || []).map((b: any) => {
            const price = b.price ? parseFloat(b.price) : 0;
            const duration = b.duration ? parseInt(b.duration, 10) : 0;

            totalIncome += price;
            if (price > 0) {
                bookingsWithPriceCount++;
            }

            if (duration > 0) {
                totalDuration += duration;
                bookingsWithDurationCount++;
            }

            // Extract Provider Info
            const provider = b.time_slot?.provider;
            const providerId = provider?.id || 'unknown';
            const providerName = provider?.name || 'Sothis Provider';
            const colorCode = provider?.color_code || '#78716c';

            // Service Breakdown
            const serviceType = b.service_type || 'Therapeutic Massage';
            if (!serviceBreakdownMap[serviceType]) {
                serviceBreakdownMap[serviceType] = { service: serviceType, count: 0, income: 0, totalDuration: 0, durationCount: 0 };
            }
            serviceBreakdownMap[serviceType].count++;
            serviceBreakdownMap[serviceType].income += price;
            if (duration > 0) {
                serviceBreakdownMap[serviceType].totalDuration += duration;
                serviceBreakdownMap[serviceType].durationCount++;
            }

            // Provider Breakdown
            if (!providerBreakdownMap[providerId]) {
                providerBreakdownMap[providerId] = { providerId, providerName, colorCode, count: 0, income: 0, totalDuration: 0, durationCount: 0 };
            }
            providerBreakdownMap[providerId].count++;
            providerBreakdownMap[providerId].income += price;
            if (duration > 0) {
                providerBreakdownMap[providerId].totalDuration += duration;
                providerBreakdownMap[providerId].durationCount++;
            }

            return {
                id: b.id,
                client_name: b.client_name,
                client_email: b.client_email,
                service_type: serviceType,
                status: b.status,
                price,
                duration,
                date: b.time_slot?.date,
                start_time: b.time_slot?.start_time,
                provider_name: providerName,
                provider_color: colorCode
            };
        });

        // Convert breakdowns to sorted arrays
        const serviceBreakdown = Object.values(serviceBreakdownMap)
            .map(s => ({
                service: s.service,
                count: s.count,
                income: s.income,
                avgDuration: s.durationCount > 0 ? Math.round(s.totalDuration / s.durationCount) : 0
            }))
            .sort((a, b) => b.income - a.income);

        const providerBreakdown = Object.values(providerBreakdownMap)
            .map(p => ({
                providerId: p.providerId,
                providerName: p.providerName,
                colorCode: p.colorCode,
                count: p.count,
                income: p.income,
                avgDuration: p.durationCount > 0 ? Math.round(p.totalDuration / p.durationCount) : 0
            }))
            .sort((a, b) => b.income - a.income);

        return NextResponse.json({
            summary: {
                totalIncome,
                totalBookings: bookings?.length || 0,
                averagePrice: bookingsWithPriceCount > 0 ? parseFloat((totalIncome / bookingsWithPriceCount).toFixed(2)) : 0,
                averageDuration: bookingsWithDurationCount > 0 ? Math.round(totalDuration / bookingsWithDurationCount) : 0
            },
            serviceBreakdown,
            providerBreakdown,
            bookings: formattedBookings.sort((a, b) => `${b.date}T${b.start_time}`.localeCompare(`${a.date}T${a.start_time}`))
        });
    } catch (error) {
        console.error('Error calculating income report:', error);
        return NextResponse.json({ error: 'Failed to calculate report data' }, { status: 500 });
    }
}
