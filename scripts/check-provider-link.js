
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLinks() {
    console.log('--- USERS (ROLE=PROVIDER or ADMIN) ---');
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, role');

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    console.table(users);

    console.log('\n--- PROVIDERS ---');
    const { data: providers, error: providersError } = await supabase
        .from('providers')
        .select('id, name, user_id, is_active');

    if (providersError) {
        console.error('Error fetching providers:', providersError);
        return;
    }

    console.table(providers);

    console.log('\n--- VERIFICATION ---');
    providers.forEach(p => {
        const linkedUser = users.find(u => u.id === p.user_id);
        if (linkedUser) {
            console.log(`✅ Provider "${p.name}" is linked to User "${linkedUser.name}" (${linkedUser.email}) [Role: ${linkedUser.role}]`);
        } else {
            console.log(`❌ Provider "${p.name}" (ID: ${p.id}) has user_id "${p.user_id}" which currently matches NO user.`);
            // Try to suggest a link by name
            const suggestion = users.find(u => u.name && p.name && u.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]));
            if (suggestion) {
                console.log(`   -> Suggestion: Should it be linked to "${suggestion.name}" (${suggestion.email})? ID: ${suggestion.id}`);
            }
        }
    });
}

checkLinks();
