
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mmqystevqgvgpfymfqzk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcXlzdGV2cWd2Z3BmeW1mcXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NjE5OSwiZXhwIjoyMDgwNjMyMTk5fQ.5Enj4PIY3ewv0XlogkQOcipLJqG28qmI-uYJvy86fI8';

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
