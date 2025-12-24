const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function checkUserNames() {
    console.log('--- Checking USERS with Empty Names ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    const problemUsers = users.filter(u => !u.name || u.name.trim() === '');

    if (problemUsers.length > 0) {
        console.log('Found USERS with empty names:', problemUsers.length);
        problemUsers.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Name: '${u.name}'`));
    } else {
        console.log('✅ All users have names.');
    }
}

checkUserNames();
