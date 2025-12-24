const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function testRegistration() {
    const testUser = {
        name: 'Nestor Rojas Test',
        email: 'nestor.rojas@live.com',
        phone: '1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345'
    };

    console.log('1. Cleaning up existing user/client if any...');
    // Delete from clients
    const { error: delError } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('email', testUser.email);
    if (delError) console.error('Delete error:', delError);

    // Delete from users just in case
    await supabaseAdmin
        .from('users')
        .delete()
        .eq('email', testUser.email);


    console.log('2. Attempting to insert client (simulating route logic)...');

    // Exact logic from route.ts
    const { data: newClient, error } = await supabaseAdmin
        .from('clients')
        .insert({
            name: testUser.name,
            email: testUser.email,
            phone: testUser.phone,
            address: testUser.address,
            city: testUser.city,
            state: testUser.state,
            zip: testUser.zip,
            email_verified: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('FAILED TO CREATE USER:', error);
    } else {
        console.log('SUCCESS:', newClient);
    }
}

testRegistration();
