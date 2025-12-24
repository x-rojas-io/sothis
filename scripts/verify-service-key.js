const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- SERVICE KEY CHECK ---');
console.log('URL:', url);
console.log('Service Key:', serviceKey ? `${serviceKey.slice(0, 10)}...${serviceKey.slice(-5)}` : 'MISSING');

async function testServiceKey() {
    try {
        console.log('\nTesting connection with Service Role Key...');
        const supabase = createClient(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Try to access the users table which requires admin/service role
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Service Key Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Service Key Success! Data:', data);
        }
    } catch (err) {
        console.error('❌ Unexpected exception:', err);
    }
}

testServiceKey();
