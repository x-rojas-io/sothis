import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/newsletter/subscribers
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format');
        const search = searchParams.get('search')?.toLowerCase().trim();
        const status = searchParams.get('status'); // 'all', 'active', 'inactive'

        let query = supabaseAdmin
            .from('newsletter_subscribers')
            .select(`
                id,
                email,
                is_active,
                source,
                created_at,
                unsubscribed_at,
                client:clients(id, name, phone)
            `)
            .order('created_at', { ascending: false });

        if (status === 'active') query = query.eq('is_active', true);
        if (status === 'inactive') query = query.eq('is_active', false);
        if (search) query = query.ilike('email', `%${search}%`);

        const { data: subscribers, error } = await query;
        if (error) throw error;

        // CSV Export format
        if (format === 'csv') {
            const csvRows = [
                ['Email', 'Name', 'Phone', 'Status', 'Source', 'Subscribed At', 'Unsubscribed At'].join(',')
            ];

            (subscribers || []).forEach((sub: any) => {
                const clientName = sub.client?.name ? `"${sub.client.name.replace(/"/g, '""')}"` : '';
                const clientPhone = sub.client?.phone ? `"${sub.client.phone.replace(/"/g, '""')}"` : '';
                const row = [
                    `"${sub.email}"`,
                    clientName,
                    clientPhone,
                    sub.is_active ? 'Active' : 'Unsubscribed',
                    sub.source || 'home_popup',
                    sub.created_at ? new Date(sub.created_at).toISOString() : '',
                    sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toISOString() : '',
                ];
                csvRows.push(row.join(','));
            });

            return new NextResponse(csvRows.join('\n'), {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="sothis-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
                },
            });
        }

        return NextResponse.json(subscribers || []);
    } catch (error: any) {
        console.error('Error fetching subscribers:', error);
        return NextResponse.json({ error: error?.message || 'Failed to fetch subscribers' }, { status: 500 });
    }
}

// PATCH /api/admin/newsletter/subscribers
// Toggle subscriber status
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, is_active } = body;

        if (!id || typeof is_active !== 'boolean') {
            return NextResponse.json({ error: 'Subscriber id and is_active status are required' }, { status: 400 });
        }

        const updateData: Record<string, any> = { is_active };
        if (!is_active) {
            updateData.unsubscribed_at = new Date().toISOString();
        } else {
            updateData.unsubscribed_at = null;
        }

        const { data, error } = await supabaseAdmin
            .from('newsletter_subscribers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating subscriber:', error);
        return NextResponse.json({ error: error?.message || 'Failed to update subscriber' }, { status: 500 });
    }
}
