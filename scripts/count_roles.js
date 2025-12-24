
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function countRoles() {
    console.log('Counting users by role...');

    const { data: users, error } = await supabase
        .from('users')
        .select('role');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {});

    console.log('Role Counts:');
    console.table(roleCounts);

    // Also check for distinct roles to be sure
    const distinctRoles = [...new Set(users.map(u => u.role))];
    console.log('Distinct Roles in DB:', distinctRoles);
}

countRoles();
