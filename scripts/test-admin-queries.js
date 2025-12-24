const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(url, serviceKey);

async function testDashboardQueries() {
    console.log('Testing Dashboard Queries...');
    const today = new Date().toISOString().split('T')[0];

    try {
        // Test 1: Fetch Upcoming Bookings (with filter on joined table)
        // Note: filtering on nested resource usually requires !inner to filter parent rows based on child
        console.log('Query 1: Upcoming Bookings...');
        const { data: upcoming, error: upcomingError } = await supabaseAdmin
            .from('bookings')
            .select(`*, time_slot:time_slots!inner(*)`)
            .eq('status', 'confirmed')
            .gte('time_slots.date', today);

        if (upcomingError) console.error('Query 1 Error:', upcomingError);
        else console.log('Query 1 Success. Count:', upcoming?.length);

        // Test 2: Stats - Today
        console.log('Query 2: Stats Today...');
        const { count: todayCount, error: todayError } = await supabaseAdmin
            .from('bookings')
            .select('id, time_slots!inner(date)', { count: 'exact', head: true })
            .eq('status', 'confirmed')
            .eq('time_slots.date', today);

        if (todayError) console.error('Query 2 Error:', todayError);
        else console.log('Query 2 Success. Count:', todayCount);

    } catch (e) {
        console.error('Exception:', e);
    }
}

testDashboardQueries();
