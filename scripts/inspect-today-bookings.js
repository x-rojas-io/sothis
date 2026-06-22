const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function inspectBookings() {
    console.log('Fetching bookings and slots...');
    const { data: bookings, error: bError } = await supabase
        .from('bookings')
        .select(`
            id,
            client_name,
            service_type,
            price,
            duration,
            time_slot:time_slots(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (bError) {
        console.error('Error fetching bookings:', bError);
        return;
    }

    console.log('\n--- RECENT BOOKINGS ---');
    bookings.forEach(b => {
        console.log(`Booking ID: ${b.id}`);
        console.log(`Client: ${b.client_name}`);
        console.log(`Service: ${b.service_type}`);
        console.log(`Saved Price: ${b.price}, Saved Duration: ${b.duration}`);
        if (b.time_slot) {
            console.log(`Slot: ${b.time_slot.date} ${b.time_slot.start_time} - ${b.time_slot.end_time} (Status: ${b.time_slot.status})`);
        } else {
            console.log('Slot: NONE');
        }
        console.log('------------------------');
    });
}

inspectBookings();
