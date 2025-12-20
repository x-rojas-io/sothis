
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyConcurrency() {
    console.log('🕵️‍♂️ Starting Concurrency Verification...');

    // 1. Get an available time slot
    console.log('1. Fetching an available time slot...');
    const { data: slot, error: slotError } = await supabase
        .from('time_slots')
        .select('id, start_time, date')
        .eq('status', 'available')
        .gt('date', new Date().toISOString()) // Future slots only
        .limit(1)
        .single();

    if (slotError || !slot) {
        console.error('❌ Could not find an available slot to test with.', slotError);
        return;
    }

    console.log(`   Target Slot: ID=${slot.id} Date=${slot.date} Time=${slot.start_time}`);

    // 2. Prepare payload
    const bookingPayload = {
        time_slot_id: slot.id,
        client_name: 'Concurrency Tester',
        client_email: 'tester@example.com',
        notes: 'Automated Concurrency Test'
    };

    // 3. Fire simultaneous requests
    console.log('2. Firing 2 simultaneous booking requests...');

    // We use the local API URL. Assuming dev server is running on 3000.
    const apiUrl = 'http://localhost:3000/api/bookings';

    const req1 = fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookingPayload, client_name: 'Tester A' })
    });

    const req2 = fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookingPayload, client_name: 'Tester B' })
    });

    const [res1, res2] = await Promise.all([req1, req2]);

    console.log('3. Results received:');
    console.log(`   Request A Status: ${res1.status}`);
    console.log(`   Request B Status: ${res2.status}`);

    // 4. Verification Logic
    const statuses = [res1.status, res2.status].sort();

    // We expect one 200 and one 409
    if (statuses[0] === 200 && statuses[1] === 409) {
        console.log('✅ SUCCESS: Race condition handled correctly!');
        console.log('   One booking succeeded (200), the other was rejected (409).');
    } else if (statuses[0] === 200 && statuses[1] === 200) {
        console.error('❌ FAILURE: Double booking occurred! Both requests returned 200.');
    } else {
        console.error(`⚠️  Unexpected outcome: ${statuses.join(', ')}`);
        const text1 = await res1.text();
        const text2 = await res2.text();
        console.log('Res1:', text1);
        console.log('Res2:', text2);
    }
}

verifyConcurrency();
