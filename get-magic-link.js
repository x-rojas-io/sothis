const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function getMagicLink() {
    // Get ALL tokens to see what's there
    const { data, error } = await supabase
        .from('verification_tokens')
        .select('*');

    if (error) {
        console.error('Error fetching tokens:', error);
        return;
    }

    console.log('Found tokens:', data.length);
    if (data.length > 0) {
        const latest = data[data.length - 1]; // Assuming order of insertion, or just grab last
        console.log('Latest Identifier:', latest.identifier);

        const callbackUrl = encodeURIComponent('http://localhost:3000/admin');
        const email = encodeURIComponent(latest.identifier);
        const token = encodeURIComponent(latest.token);

        const link = `http://localhost:3000/api/auth/callback/email?callbackUrl=${callbackUrl}&token=${token}&email=${email}`;
        console.log('MAGIC_LINK=' + link);
    } else {
        console.log('No tokens found. Did the sign-in validation actually write to the DB?');
    }
}

getMagicLink();
