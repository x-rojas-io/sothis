import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { startDate, endDate, providerId } = await request.json();

        console.log(`[GenerateSlots] Request: ${startDate} to ${endDate}, Provider: ${providerId}`);

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        // Fetch availability templates
        let query = supabaseAdmin
            .from('availability_templates')
            .select('*')
            .eq('is_active', true);

        if (providerId) {
            query = query.eq('provider_id', providerId);
        }

        const { data: templates, error: templatesError } = await query;

        console.log(`[GenerateSlots] Found ${templates?.length} templates for provider ${providerId}`);
        if (templates && templates.length > 0) {
            console.log(`[GenerateSlots] Template Sample ProviderID: ${templates[0].provider_id}`);
        }

        if (templatesError) throw templatesError;
        if (!templates || templates.length === 0) {
            return NextResponse.json(
                { error: 'No availability templates found. Please set up your availability first.' },
                { status: 400 }
            );
        }

        const slots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Generate slots for each day in the range
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();

            // Find template for this day of week
            const template = templates.find(t => t.day_of_week === dayOfWeek);
            if (!template) continue;

            // Generate time slots for this day
            const dateStr = date.toISOString().split('T')[0];
            const startTime = template.start_time;
            const endTime = template.end_time;
            const slotDuration = template.slot_duration;
            const bufferMinutes = template.buffer_minutes;

            let currentTime = parseTime(startTime);
            const endTimeMinutes = parseTime(endTime);

            while (currentTime + slotDuration <= endTimeMinutes) {
                const slotStart = formatTime(currentTime);
                const slotEnd = formatTime(currentTime + slotDuration);

                // Log one slot for debugging
                if (slots.length === 0) {
                    console.log(`[GenerateSlots] Generating slot with provider_id: ${template.provider_id}`);
                }

                slots.push({
                    date: dateStr,
                    start_time: slotStart,
                    end_time: slotEnd,
                    status: 'available',
                    provider_id: template.provider_id
                });

                // Add slot duration + buffer for next slot
                currentTime += slotDuration + bufferMinutes;
            }
        }

        if (slots.length === 0) {
            return NextResponse.json(
                { error: 'No slots generated. Check your availability templates.' },
                { status: 400 }
            );
        }

        // Insert slots (ignore duplicates)
        const { data, error } = await supabaseAdmin
            .from('time_slots')
            .upsert(slots, { onConflict: 'date,start_time', ignoreDuplicates: true })
            .select();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            count: data?.length || 0,
            message: `Generated ${data?.length || 0} time slots`
        });
    } catch (error) {
        console.error('Error generating slots:', error);
        return NextResponse.json(
            { error: 'Failed to generate slots' },
            { status: 500 }
        );
    }
}

// Helper functions
function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
}
