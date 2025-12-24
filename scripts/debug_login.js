
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAdmins() {
    console.log('Fetching users with role "admin"...');

    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role, name')
        .eq('role', 'admin');

    if (error) {
        console.error('Error fetching admins:', error);
    } else {
        if (users && users.length > 0) {
            console.log('Admins found:');
            console.table(users);
        } else {
            console.log('No admins found.');
        }
    }
}

listAdmins();
