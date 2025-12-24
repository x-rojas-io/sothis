
const { createClient } = require('@supabase/supabase-js');

// Keys from .env.local (verified via cat previously)
const supabaseUrl = 'https://mmqystevqgvgpfymfqzk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcXlzdGV2cWd2Z3BmeW1mcXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA1NjE5OSwiZXhwIjoyMDgwNjMyMTk5fQ.5Enj4PIY3ewv0XlogkQOcipLJqG28qmI-uYJvy86fI8';

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
