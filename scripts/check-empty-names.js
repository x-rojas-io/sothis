const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function checkNames() {
    console.log('--- Checking Clients with Empty Names ---');

    const { data: clients, error } = await supabase
        .from('clients')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    const problemClients = clients.filter(c => !c.name || c.name.trim() === '');

    if (problemClients.length > 0) {
        console.log('Found clients with empty names:', problemClients.length);
        problemClients.forEach(c => console.log(`- ID: ${c.id}, Email: ${c.email}, Name: '${c.name}'`));
    } else {
        console.log('✅ All clients have names.');
    }
}

checkNames();
