console.log('Script started');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
    console.log('Connecting to Supabase...');
    const { data: users, error } = await supabase
        .from('users')
        .select('role');

    if (error) {
        console.error('Error fetching users:', JSON.stringify(error, null, 2));
        return;
    }

    if (!users || users.length === 0) {
        console.log('No users found in table.');
        return;
    }

    const roles = new Set(users.map(u => u.role));
    console.log('Existing roles:', Array.from(roles));

    const invalid = users.filter(u => !['admin', 'user', 'provider'].includes(u.role));
    if (invalid.length > 0) {
        console.log('Found invalid roles:', invalid.map(u => u.role));
    } else {
        console.log('All roles are valid according to new constraint.');
    }
}

checkRoles();
