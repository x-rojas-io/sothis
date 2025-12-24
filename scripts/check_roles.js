const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Log env vars (partial for security) to ensure they are loaded
// console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
// console.log('KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'Missing');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRoles() {
    try {
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
        
        // Also check if any role is NOT in ('admin', 'user', 'provider')
        const invalid = users.filter(u => !['admin', 'user', 'provider'].includes(u.role));
        if (invalid.length > 0) {
            console.log('Found invalid roles:', invalid.map(u => u.role));
        } else {
            console.log('All roles are valid according to new constraint.');
        }

    } catch (e) {
        console.error('Script error:', e);
    }
}

checkRoles();
