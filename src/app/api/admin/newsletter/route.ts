import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/newsletter
// List all newsletters
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: newsletters, error } = await supabaseAdmin
            .from('newsletters')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(newsletters || []);
    } catch (error: any) {
        console.error('Error fetching newsletters:', error);
        return NextResponse.json({ error: error?.message || 'Failed to fetch newsletters' }, { status: 500 });
    }
}

// POST /api/admin/newsletter
// Create a new newsletter
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, preview_text, body: contentBody, image_url, cta_text, cta_url, status = 'draft' } = body;

        if (!title || !contentBody) {
            return NextResponse.json({ error: 'Title and content body are required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('newsletters')
            .insert({
                title: title.trim(),
                preview_text: preview_text ? preview_text.trim() : null,
                body: contentBody.trim(),
                image_url: image_url || null,
                cta_text: cta_text ? cta_text.trim() : 'Chat with Nancy on WhatsApp',
                cta_url: cta_url ? cta_url.trim() : 'https://sothistherapeutic.com/api/newsletter/cta',
                status: ['draft', 'queued', 'sent'].includes(status) ? status : 'draft',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error creating newsletter:', error);
        return NextResponse.json({ error: error?.message || 'Failed to create newsletter' }, { status: 500 });
    }
}
