const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function checkSchema() {
    // We can't query information_schema easily via JS client, 
    // but we can try to insert a dummy record with all fields and see if it fails, 
    // OR just select one record and see what keys it returns (if any records exist).

    // Better: insert a heavily constrained dummy record and rollback? No transactions in JS client.

    // Instead, let's try to select specific columns. If they don't exist, it should throw?
    // Actually, PostgREST might ignore them or return error.

    const { data, error } = await supabaseAdmin
        .from('clients')
        .select('address, city, state, zip')
        .limit(1);

    if (error) {
        console.error('Schema Check Error:', error);
    } else {
        console.log('Schema Check Success, columns exist (or at least query didn\'t fail). Data:', data);
    }
}

checkSchema();
