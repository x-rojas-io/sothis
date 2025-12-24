
const { createClient } = require('@supabase/supabase-js');

// Keys from .env.local
const supabaseUrl = 'https://mmqystevqgvgpfymfqzk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcXlzdGV2cWd2Z3BmeW1mcXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NjE5OSwiZXhwIjoyMDgwNjMyMTk5fQ.5Enj4PIY3ewv0XlogkQOcipLJqG28qmI-uYJvy86fI8';

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
