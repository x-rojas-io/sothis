
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSync() {
    // 1. Get all Users with role 'client'
    const { data: users } = await supabase.from('users').select('email').eq('role', 'client');
    const userEmails = new Set(users?.map(u => u.email.toLowerCase()) || []);

    // 2. Get all Clients
    const { data: clients } = await supabase.from('clients').select('email');
    const clientEmails = new Set(clients?.map(c => c.email.toLowerCase()) || []);

    console.log(`Total Client Users: ${userEmails.size}`);
    console.log(`Total CRM Clients: ${clientEmails.size}`);

    // 3. Find missing
    let missing = 0;
    userEmails.forEach(email => {
        if (!clientEmails.has(email)) {
            console.log(`Missing in CRM: ${email}`);
            missing++;
        }
    });

    if (missing === 0) {
        console.log('✅ All Client Users are present in the Clients CRM table.');
    } else {
        console.log(`⚠️ ${missing} users are missing from Clients CRM table.`);
        console.log('Recommendation: I can run a sync to add them.');
    }
}

checkSync();
