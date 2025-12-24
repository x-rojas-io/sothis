
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
        // 1. Check USERS table (Admin/Provider)
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (user) {
            return NextResponse.json({
                exists: true,
                user: {
                    ...user,
                    name: user.name || 'Admin/Provider'
                }
            });
        }

        if (userError && userError.code !== 'PGRST116') {
            console.error('Error checking user:', userError);
            // Verify if error is just "not found" or actual DB error
            // We continue to check clients if it's just not found? 
            // Actually, if DB error return 500.
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 2. Check CLIENTS table
        const { data: client, error: clientError } = await supabaseAdmin
            .from('clients')
            .select('*')
            .eq('email', email)
            .single();

        if (client) {
            return NextResponse.json({
                exists: true,
                user: {
                    ...client,
                    name: client.name || 'Valued Client'
                }
            });
        }

        // Not found in either
        return NextResponse.json({
            exists: false,
            user: null
        });
    } catch (error) {
        console.error('Error checking user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
