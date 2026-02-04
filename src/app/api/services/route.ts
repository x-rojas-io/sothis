
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/services
// Public: Fetch all active services
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

// POST /api/services
// Admin: Create a new service
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Basic validation (could be improved)
        if (!body.image_url || !body.title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('services')
            .insert(body)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating service:', error);
        return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
}
