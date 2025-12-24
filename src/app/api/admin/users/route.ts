import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a generic admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function GET() {
    try {
        // 1. Fetch all users from 'users' table (roles) - Filter out "client" role
        const { data: users, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .in('role', ['admin', 'provider']);

        if (userError) throw userError;

        // 2. Fetch providers to enrich
        const { data: providers, error: providerError } = await supabaseAdmin.from('providers').select('*');
        if (providerError) throw providerError;

        // Merge logic
        const merged = users.map((u: any) => {
            const providerDetails = providers.find((p: any) => p.user_id === u.id); // Assuming we link by user_id

            // If no link, maybe match by email? Or just return base
            // Since we haven't strictly enforced user_id FK yet, let's look for matching emails or create a pseudo-link
            // But 'providers' table doesn't have email column.

            // Re-think: Current providers table has NO user_id link in migration script?
            // "user_id UUID REFERENCES auth.users(id)" WAS in the creation script (user said "multi_provider_setup.sql" executed).
            // Let's assume it exists.

            return {
                id: u.id,
                email: u.email,
                role: u.role,
                ...providerDetails, // Enriches with name, bio, etc if provider
            };
        });

        // Also, include any providers who might NOT have a user account yet (legacy ones from migration?)
        // If they don't have user_id, they won't match. We should return them too?
        // User requested strict "Staff Users", implying they interact with system.
        // Let's stick to 'users' table as the source of truth for Logins.
        // But Nancy (default) might not have a user entry in 'users' table if not migrated.

        return NextResponse.json(merged);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, role, name, bio, specialties, color_code } = body;

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Add to 'users' table for role
        const { error: roleError } = await supabaseAdmin.from('users').insert({
            id: userId,
            email,
            role
        });

        if (roleError) throw roleError;

        // 3. If Provider, create provider profile
        if (role === 'provider') {
            const { error: providerError } = await supabaseAdmin.from('providers').insert({
                user_id: userId, // Link to auth user
                name,
                bio,
                specialties,
                color_code,
                is_active: true
            });

            if (providerError) throw providerError;
        }

        return NextResponse.json({ success: true, userId });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Fetch user to check email for protection
        const { data: user, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(id);

        if (fetchError || !user.user) {
            // If not found in auth, check public.users? 
            // Actually if they are not in auth, we might still want to clean up public tables.
            // But for protection check, we assume the Super Admin exists in Auth.
            // Let's fallback to querying public table if auth lookup fails or if we want to be doubly sure.
            const { data: publicUser } = await supabaseAdmin.from('users').select('email').eq('id', id).single();

            if (publicUser?.email === 'sothistherapeutic@gmail.com') {
                return NextResponse.json({ error: 'Cannot delete Super Admin account' }, { status: 403 });
            }
        } else {
            if (user.user.email === 'sothistherapeutic@gmail.com') {
                return NextResponse.json({ error: 'Cannot delete Super Admin account' }, { status: 403 });
            }
        }

        // 2. Delete from 'providers' (Cascade might handle this, but let's be explicit)
        await supabaseAdmin.from('providers').delete().eq('user_id', id);

        // 3. Delete from 'users'
        await supabaseAdmin.from('users').delete().eq('id', id);

        // 4. Delete Auth User
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
