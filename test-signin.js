const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function testFlow() {
    const testEmail = 'nestor.rojas@live.com';

    console.log(`Checking if user ${testEmail} exists...`);

    // Check USERS
    let { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single();

    if (userError && userError.code !== 'PGRST116') {
        console.error('Error checking users:', userError);
    }

    if (!user) {
        console.log('User not found in users table. Checking clients...');
        const { data: client, error: clientError } = await supabaseAdmin
            .from('clients')
            .select('*')
            .eq('email', testEmail)
            .single();

        if (clientError && clientError.code !== 'PGRST116') {
            console.error('Error checking clients:', clientError);
        }

        if (client) {
            console.log('Found client:', client.id);
            user = { ...client, role: 'client' };
        }
    } else {
        console.log('Found user:', user.id, user.role);
    }

    if (!user) {
        console.error('Test user not found in DB. Please update testEmail in script with a valid email.');
        // List some users to help
        const { data: users } = await supabaseAdmin.from('users').select('email').limit(5);
        console.log('Available users:', users?.map(u => u.email));
        return;
    }

    // Generate OTP
    const otp = '123456';
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    console.log('Cleaning old tokens...');
    const { error: delError } = await supabaseAdmin
        .from('verification_tokens')
        .delete()
        .eq('identifier', testEmail);

    if (delError) console.error('Delete error:', delError);

    console.log('Inserting new token...');
    const { error: insertError } = await supabaseAdmin
        .from('verification_tokens')
        .insert({
            identifier: testEmail,
            token: otp,
            expires: expires.toISOString(),
        });

    if (insertError) {
        console.error('Insert error:', insertError);
        return;
    }
    console.log('Token inserted.');

    console.log('Verifying token...');
    const { data: dbToken, error: verifyError } = await supabaseAdmin
        .from('verification_tokens')
        .select('*')
        .eq('identifier', testEmail)
        .eq('token', otp)
        .single();

    if (verifyError || !dbToken) {
        console.error('Verification failed. Token not found or error:', verifyError);
    } else {
        console.log('Token verified!', dbToken);
    }
}

testFlow();
