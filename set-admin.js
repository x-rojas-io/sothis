const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function setAdmin() {
    console.log('Setting admin role for sothistherapeutic@gmail.com...');

    // Update the user
    const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', 'sothistherapeutic@gmail.com')
        .select();

    if (error) {
        console.error('Error updating execution:', error);
    } else {
        console.log('Success:', data);
    }
}

setAdmin();
