const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function checkSchema() {
    console.log('Checking public.sessions columns...');
    // Just select one row and look at keys
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting sessions:', error);
    } else {
        console.log('Session tokens found:', data && data.length > 0 ? Object.keys(data[0]) : 'No sessions found, checking via dummy insert error');
    }

    if (!data || data.length === 0) {
        // Try insert with camelCase
        const { error: insertError } = await supabase
            .from('sessions')
            .insert({ sessionToken: 'test', userId: '00000000-0000-0000-0000-000000000000', expires: new Date() })
            .select();

        if (insertError) {
            console.error('Dummy Insert Error:', insertError);
        }
    }
}

checkSchema();
