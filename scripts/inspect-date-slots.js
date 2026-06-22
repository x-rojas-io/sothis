const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function inspectSlots() {
    const targetDate = '2027-04-23';
    console.log(`Fetching all slots and bookings on ${targetDate}...`);
    
    const { data: slots, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('date', targetDate)
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching slots:', error);
        return;
    }

    console.log(`\n--- ALL SLOTS FOR ${targetDate} ---`);
    for (const slot of slots) {
        console.log(`Slot ID: ${slot.id}`);
        console.log(`Time: ${slot.start_time} - ${slot.end_time}`);
        console.log(`Status: ${slot.status}`);
        console.log(`Provider ID: ${slot.provider_id}`);
        
        // Fetch booking if status is booked
        if (slot.status === 'booked') {
            const { data: booking } = await supabase
                .from('bookings')
                .select('id, client_name, service_type, price, duration')
                .eq('time_slot_id', slot.id)
                .maybeSingle();
            if (booking) {
                console.log(`  -> Booked by: ${booking.client_name} (${booking.service_type}), Price: ${booking.price}, Duration: ${booking.duration}`);
            } else {
                console.log(`  -> No booking found for this booked slot!`);
            }
        }
        console.log('------------------------');
    }
}

inspectSlots();
