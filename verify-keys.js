const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- DEBUG INFO ---');
console.log('URL:', url);
console.log('Anon Key:', anonKey ? `${anonKey.slice(0, 10)}...${anonKey.slice(-5)}` : 'MISSING');
console.log('Anon Key Length:', anonKey ? anonKey.length : 0);
console.log('Service Key:', serviceKey ? `${serviceKey.slice(0, 10)}...${serviceKey.slice(-5)}` : 'MISSING');
console.log('Service Key Length:', serviceKey ? serviceKey.length : 0);
console.log('------------------');

if (!url || !anonKey || !serviceKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

async function testConnection() {
    try {
        console.log('\nTesting connection to availability_templates...');
        const supabase = createClient(url, anonKey);
        const { data, error } = await supabase.from('availability_templates').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Success! Data:', data);
        }
    } catch (err) {
        console.error('❌ Unexpected exception:', err);
    }
}

testConnection();
