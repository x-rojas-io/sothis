import { supabase } from '@/lib/supabase';

export async function getServicesContext(): Promise<string> {
    const { data: services } = await supabase
        .from('services')
        .select('title, price, duration')
        .eq('is_active', true);

    if (!services || services.length === 0) return "No specific services found.";

    return services.map((s: any) => {
        const title = s.title?.en || 'Service';
        const price = s.price?.en || 'Price varies';
        const duration = s.duration?.en || 'Duration varies';
        return `- ${title}: ${price} (${duration})`;
    }).join('\n');
}

export async function getAvailabilityContext(): Promise<string> {
    // 1. General Templates
    const { data: templates } = await supabase
        .from('availability_templates')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week');

    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const generalHours = templates?.map((t: any) =>
        `- ${daysMap[t.day_of_week]}: ${t.start_time} - ${t.end_time}`
    ).join('\n') || "Variable hours.";

    // 2. Upcoming Slots (Next 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // We need to fetch slots that are active/available
    // Assuming 'time_slots' table has 'date', 'start_time', 'status' ('available')
    // And assuming we want to show a summary, not EVERY slot if there are hundreds.
    // Let's fetch all available for next 7 days.
    const { data: slots } = await supabase
        .from('time_slots')
        .select('date, start_time')
        .eq('status', 'available')
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', nextWeek.toISOString().split('T')[0])
        .order('date')
        .order('start_time')
        .limit(20); // Limit to avoid blowing up context

    const specificSlots = slots?.map((s: any) =>
        `- ${s.date} at ${s.start_time}`
    ).join('\n') || "No specific slots found for the next 7 days in the system (check online booking).";

    return `
GENERAL HOURS:
${generalHours}

UPCOMING OPEN SLOTS (Sample):
${specificSlots}
    `.trim();
}
