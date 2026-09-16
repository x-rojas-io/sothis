
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

        // Validation
        const titleEn = typeof body.title === 'object' ? body.title.en : body.title;
        if (!titleEn || titleEn.trim() === '') {
            return NextResponse.json({ error: 'Service title (English) is required' }, { status: 400 });
        }

        const newService = {
            title: typeof body.title === 'object' ? body.title : { en: body.title, es: body.title },
            description: typeof body.description === 'object' ? body.description : { en: body.description || '', es: body.description || '' },
            price: typeof body.price === 'object' ? body.price : { en: body.price || '', es: body.price || '' },
            duration: typeof body.duration === 'object' ? body.duration : { en: body.duration || '60 min', es: body.duration || '60 min' },
            image_url: body.image_url || '/images/services/sothis-therapeutic-massage.jpg',
            is_active: body.is_active !== undefined ? body.is_active : true,
        };

        const { data, error } = await supabaseAdmin
            .from('services')
            .insert(newService)
            .select()
            .single();

        if (error) {
            console.error('Database error creating service:', error);
            return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error creating service:', error);
        return NextResponse.json({ error: error?.message || 'Failed to create service' }, { status: 500 });
    }
}
