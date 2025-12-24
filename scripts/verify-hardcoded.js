const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- ENVIRONMENT VARIABLE CHECK ---');
console.log('URL:', url ? '✅ Found' : '❌ Missing');
console.log('Anon Key:', anonKey ? `✅ Found (Length: ${anonKey.length})` : '❌ Missing');
console.log('Service Key:', serviceKey ? `✅ Found (Length: ${serviceKey.length})` : '❌ Missing');

async function testConnection() {
    if (!url || !anonKey || !serviceKey) {
        console.error('❌ Cannot test connection due to missing variables.');
        return;
    }

    try {
        console.log('\nTesting connection with Anon Key...');
        const supabase = createClient(url, anonKey);
        // Using a public table implies we might need RLS, but 'availability_templates' was used in the original script.
        // We just check if we can connect; even a 401 is better than a hardcoded key.
        const { data, error } = await supabase.from('availability_templates').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('⚠️ Anon Key Connection Issue (might be RLS):', error.message);
        } else {
            console.log('✅ Anon Key Connection Success.');
        }

        console.log('\nTesting connection with Service Role Key...');
        const supabaseService = createClient(url, serviceKey);
        const { error: serviceError } = await supabaseService.from('users').select('count', { count: 'exact', head: true });

        if (serviceError) {
            console.error('❌ Service Key Error:', serviceError.message);
        } else {
            console.log('✅ Service Key Connection Success.');
        }

    } catch (err) {
        console.error('❌ Unexpected exception:', err);
    }
}

testConnection();
