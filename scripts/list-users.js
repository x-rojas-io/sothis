const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, serviceKey);

async function listUsers() {
    console.log('--- Listing Users (Admins/Providers) ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, role');

    if (error) {
        console.error(error);
        return;
    }

    if (users.length > 0) {
        console.log('Found Users:', users.length);
        users.forEach(u => console.log(`- Role: [${u.role}] | Email: ${u.email} | Name: ${u.name}`));
    } else {
        console.log('❌ No users found in `users` table.');
    }
}

listUsers();
