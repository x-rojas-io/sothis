import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: admins, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('role', 'admin')
            .order('name');

        if (error) throw error;

        return NextResponse.json(admins);
    } catch (error) {
        console.error('Error fetching admins:', error);
        return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { email, name } = await request.json();

        if (!email || !name) {
            return NextResponse.json({ error: 'Email and Name are required' }, { status: 400 });
        }

        // Check if user exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        let result;
        if (existingUser) {
            // Update role to admin
            result = await supabaseAdmin
                .from('users')
                .update({ role: 'admin', name }) // Update name too if provided
                .eq('email', email)
                .select()
                .single();
        } else {
            // Create new admin user
            result = await supabaseAdmin
                .from('users')
                .insert([{ email, name, role: 'admin' }])
                .select()
                .single();
        }

        if (result.error) throw result.error;

        return NextResponse.json(result.data);
    } catch (error) {
        console.error('Error creating/promoting admin:', error);
        return NextResponse.json({ error: 'Failed to save admin user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent deleting yourself
        if (session.user.email) {
            const { data: currentUser } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', session.user.email)
                .single();

            if (currentUser && currentUser.id === id) {
                return NextResponse.json({ error: 'Cannot remove your own admin access' }, { status: 400 });
            }
        }

        // Downgrade to 'user' role instead of deleting the record
        // This preserves booking history if they have any.
        const { error } = await supabaseAdmin
            .from('users')
            .update({ role: 'user' })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing admin access:', error);
        return NextResponse.json({ error: 'Failed to remove admin access' }, { status: 500 });
    }
}
