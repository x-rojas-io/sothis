console.log('Script started');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mmqystevqgvgpfymfqzk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcXlzdGV2cWd2Z3BmeW1mcXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NjE5OSwiZXhwIjoyMDgwNjMyMTk5fQ.5Enj4PIY3ewv0XlogkQOcipLJqG28qmI-uYJvy86fI8';

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
