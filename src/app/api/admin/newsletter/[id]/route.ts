import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/newsletter/[id]
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('newsletters')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Newsletter not found' }, { status: 404 });
    }
}

// PUT /api/admin/newsletter/[id]
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
        const { title, preview_text, body: contentBody, image_url, cta_text, cta_url, status } = body;

        const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (title !== undefined) updatePayload.title = title.trim();
        if (preview_text !== undefined) updatePayload.preview_text = preview_text ? preview_text.trim() : null;
        if (contentBody !== undefined) updatePayload.body = contentBody.trim();
        if (image_url !== undefined) updatePayload.image_url = image_url || null;
        if (cta_text !== undefined) updatePayload.cta_text = cta_text ? cta_text.trim() : 'Chat with Nancy on WhatsApp';
        if (cta_url !== undefined) updatePayload.cta_url = cta_url ? cta_url.trim() : 'https://sothistherapeutic.com/api/newsletter/cta';
        if (status !== undefined) updatePayload.status = status;

        const { data, error } = await supabaseAdmin
            .from('newsletters')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating newsletter:', error);
        return NextResponse.json({ error: error?.message || 'Failed to update newsletter' }, { status: 500 });
    }
}

// DELETE /api/admin/newsletter/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabaseAdmin
            .from('newsletters')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting newsletter:', error);
        return NextResponse.json({ error: error?.message || 'Failed to delete newsletter' }, { status: 500 });
    }
}
