
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
    console.log('Verifying Providers...');
    const { data: providers, error } = await supabase.from('providers').select('*');

    if (error) {
        console.error('Error fetching providers:', error);
        return;
    }

    console.log('Providers found:', providers.length);
    providers.forEach(p => {
        console.log(`- [${p.id}] ${p.name} (${p.specialties?.join(', ') || 'No specialties'}) - Active: ${p.is_active}`);
    });

    if (providers.length === 0) {
        console.warn('WARNING: No providers found. Migration might have failed to backfill.');
    } else {
        console.log('SUCCESS: Providers table is populated.');
    }
}

verify();
