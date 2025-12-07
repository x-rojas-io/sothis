const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function checkSlots() {
    console.log('Checking slots for December...');

    const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .gte('date', '2025-12-01')
        .lte('date', '2025-12-31')
        .order('date', { ascending: true });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found slots:', data.length);
        if (data.length > 0) {
            // Group by date
            const grouped = data.reduce((acc, slot) => {
                acc[slot.date] = (acc[slot.date] || 0) + 1;
                return acc;
            }, {});
            console.log('Slots per day:', grouped);
        } else {
            console.log('No slots found in December.');
        }
    }
}

checkSlots();
