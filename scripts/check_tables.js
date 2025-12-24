
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Listing Tables in public schema...');
    // There isn't a direct "list tables" method in JS client easily without rpc or checking information_schema
    // But we can check if specific tables exist by selecting from them.

    const tablesToCheck = ['users', 'user', 'providers', 'provider', 'clients', 'client'];

    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (!error) {
            console.log(`✅ Table '${table}' EXISTS`);
        } else {
            // 404 means not found usually, or permission denied
            console.log(`❌ Table '${table}' NOT FOUND (or error: ${error.message})`);
        }
    }
}

listTables();
