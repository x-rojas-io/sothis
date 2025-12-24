import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetNancy() {
    const email = 'sothistherapeutic@gmail.com';
    const password = 'password123';

    console.log('Resetting password for:', email);

    // Actually, lists are better.
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const nancy = list.users.find(u => u.email === email);
    if (!nancy) {
        console.error('Nancy not found!');
        return;
    }

    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        nancy.id,
        { password: password }
    );

    if (updateError) {
        console.error('Error updating Nancy:', updateError);
    } else {
        console.log('Nancy password updated to password123');
    }
}

resetNancy();
