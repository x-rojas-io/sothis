
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkAdmins() {
    console.log('Checking public.users table...');

    const { data: users, error } = await supabase.from('users').select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total Users in public table: ${users.length}`);
    const admins = users.filter(u => u.role === 'admin');
    console.log(`Admins found: ${admins.length}`);

    if (admins.length > 0) {
        admins.forEach(a => console.log(` - Admin: ${a.email} (ID: ${a.id})`));
    } else {
        console.log('❌ NO ADMINS FOUND in public.users table!');
        console.log('Reason for empty list: The RLS policy requires an entry in public.users to grant access.');
    }
}

checkAdmins();
