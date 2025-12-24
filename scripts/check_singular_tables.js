
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSingularTables() {
    const singulars = ['user', 'provider', 'client'];

    for (const table of singulars) {
        console.log(`Checking table '${table}'...`);
        const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ Table '${table}': Access Error or Does Not Exist (${error.message})`);
        } else {
            console.log(`⚠️ Table '${table}' Excists. Row count: ${count}`);
            if (count > 0) {
                const { data: rows } = await supabase.from(table).select('*').limit(3);
                console.log('Sample Data:', rows);
            }
        }
    }
}

inspectSingularTables();
