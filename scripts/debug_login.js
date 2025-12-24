
const { createClient } = require('@supabase/supabase-js');

// Keys from .env.local (verified via cat previously)
const supabaseUrl = 'https://mmqystevqgvgpfymfqzk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcXlzdGV2cWd2Z3BmeW1mcXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NjE5OSwiZXhwIjoyMDgwNjMyMTk5fQ.5Enj4PIY3ewv0XlogkQOcipLJqG28qmI-uYJvy86fI8';

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
