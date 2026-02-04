
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/services/[id]
// Admin: Update service details
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const { data, error } = await supabaseAdmin
            .from('services')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating service:', error);
        return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }
}

// PATCH /api/services/[id]
// Admin: Toggle active status
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { is_active } = await request.json();

        const { data, error } = await supabaseAdmin
            .from('services')
            .update({ is_active })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating service status:', error);
        return NextResponse.json({ error: 'Failed to update service status' }, { status: 500 });
    }
}
