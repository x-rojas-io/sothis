const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectDuplicates() {
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*');

    if (error) {
        console.error('Error fetching clients:', error);
        return;
    }

    console.log(`Total clients in registry: ${clients.length}`);

    const groups = {};
    clients.forEach(c => {
        const key = c.email.toLowerCase().trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
    });

    let duplicatesCount = 0;
    for (const [email, list] of Object.entries(groups)) {
        if (list.length > 1) {
            duplicatesCount++;
            console.log(`\nDuplicate Group for email: "${email}" (${list.length} records):`);
            for (const c of list) {
                // Check if they have an intake form
                const { data: intake } = await supabase
                    .from('intake_forms')
                    .select('id, signature_date')
                    .eq('client_id', c.id)
                    .maybeSingle();

                console.log(`  - ID: ${c.id}`);
                console.log(`    Name: ${c.name}`);
                console.log(`    Email: ${c.email}`);
                console.log(`    Phone: ${c.phone}`);
                console.log(`    Address: ${c.address}, ${c.city}, ${c.state} ${c.zip}`);
                console.log(`    Intake Form: ${intake ? `YES (signed: ${intake.signature_date})` : 'NO'}`);
            }
        }
    }

    if (duplicatesCount === 0) {
        console.log('No case-insensitive duplicates found in clients table.');
    }
}

inspectDuplicates();
