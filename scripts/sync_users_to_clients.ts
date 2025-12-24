
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function syncUsersToClients() {
    console.log('Starting Sync: Users -> Clients...');

    // 1. Fetch all 'client' users
    const { data: users, error } = await supabase.from('users').select('*').eq('role', 'client');
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Found ${users.length} users with role 'client'.`);

    let added = 0;
    for (const user of users) {
        // Check if exists in clients (by email)
        const { data: existing } = await supabase.from('clients').select('id').eq('email', user.email).single();

        if (!existing) {
            console.log(`Syncing missing client: ${user.email}`);
            const { error: insertError } = await supabase.from('clients').insert({
                email: user.email,
                name: user.name || user.email.split('@')[0], // Fallback name
                // Phone/Address might be missing in 'users' table if it was only minimal auth
                // We leave them null or try to fetch from somewhere else if available (e.g. metadata)
            });

            if (insertError) console.error(`Failed to insert ${user.email}:`, insertError);
            else added++;
        }
    }

    console.log(`Sync Complete. Added ${added} new clients from Users list.`);
}

syncUsersToClients();
