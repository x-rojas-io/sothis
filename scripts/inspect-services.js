const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(url, serviceKey);

async function inspect() {
    const { data: services, error } = await supabaseAdmin
        .from('services')
        .select('*');

    if (error) {
        console.error(error);
    } else {
        console.log('Services count:', services.length);
        console.log('Sample Service:', JSON.stringify(services[0], null, 2));
    }
}

inspect();
