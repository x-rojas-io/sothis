import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/admin/intake
 * Fetches a specific client's intake form. Admin only.
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as any)?.role;

        if (role !== 'admin' && role !== 'provider') {
            return NextResponse.json({ error: 'Unauthorized. Admin or Provider access required.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        const { data: intake, error: intakeError } = await supabaseAdmin
            .from('intake_forms')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (intakeError && intakeError.code !== 'PGRST116') {
            throw intakeError;
        }

        // Fetch Audit History
        let auditHistory = [];
        if (intake?.id) {
            const { data } = await supabaseAdmin
                .from('intake_form_audit')
                .select('*, modified_by_user:modified_by(name, email)')
                .eq('intake_form_id', intake.id)
                .order('created_at', { ascending: false });
            auditHistory = data || [];
        }

        return NextResponse.json({ intake, auditHistory });

    } catch (error: any) {
        console.error('API: GET /api/admin/intake ERROR:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
