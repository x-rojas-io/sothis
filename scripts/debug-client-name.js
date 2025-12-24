const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

async function run() {
    const testEmail = `debug_name_${Date.now()}@example.com`;
    console.log(`Creating client with email: ${testEmail}`);

    const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
            name: 'Debug User',
            email: testEmail,
            email_verified: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating client:', error);
        return;
    }

    console.log('Client Created:', newClient);
    console.log('Now run curl to check-user...');
    console.log(`curl "http://localhost:3000/api/auth/check-user?email=${testEmail}"`);
}

run();
