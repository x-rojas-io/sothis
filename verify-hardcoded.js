const { createClient } = require('@supabase/supabase-js');

const url = 'https://mmqystevqgvgpfymfqzk.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcXlzdGV2cWd2Z3BmeW1mcXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTYxOTksImV4cCI6MjA4MDYzMjE5OX0.38Hzs2sLSAGt-0qeHnXu8j13pLMG4GrqJ4Qb5fLFGK8';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NjE5OSwiZXhwIjoyMDgwNjMyMTk5fQ.5Enj4PIY3ewv0XlogkQOcipLJqG28qmI-uYJvy86fI8';

console.log('--- HARDCODED KEY CHECK ---');
console.log('URL:', url);
console.log('Anon Key Length:', anonKey.length);
console.log('Service Key Length:', serviceKey.length);

async function testConnection() {
    try {
        console.log('\nTesting connection to availability_templates...');
        const supabase = createClient(url, anonKey);
        const { data, error } = await supabase.from('availability_templates').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Anon Key Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Anon Key Success. Count:', data);
        }

        console.log('\nTesting Service Role Key...');
        const supabaseService = createClient(url, serviceKey);
        const { data: serviceData, error: serviceError } = await supabaseService.from('users').select('count', { count: 'exact', head: true });

        if (serviceError) {
            console.error('❌ Service Key Error:', JSON.stringify(serviceError, null, 2));
        } else {
            console.log('✅ Service Key Success.');
        }

    } catch (err) {
        console.error('❌ Unexpected exception:', err);
    }
}

testConnection();
