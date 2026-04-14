import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/admin/intake/invite
 * Sends an email invitation to a client to complete their clinical intake form.
 * Handles both new and existing clients.
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        // 1. Security Check (Admin/Provider Only)
        if (!session?.user?.email || !['admin', 'provider'].includes((session.user as any)?.role)) {
            return NextResponse.json({ error: 'Unauthorized. Clinical access required.' }, { status: 401 });
        }

        const { client_email, client_name } = await request.json();

        if (!client_email) {
            return NextResponse.json({ error: 'Client email is required for invitation.' }, { status: 400 });
        }

        // 2. Upsert Client Record (Ensure they exist in the registry)
        const trimmedEmail = client_email.trim().toLowerCase();
        const { data: client, error: clientError } = await supabaseAdmin
            .from('clients')
            .upsert({
                email: trimmedEmail,
                name: client_name || 'Valued Client',
            }, { onConflict: 'email' })
            .select()
            .single();

        if (clientError) {
            console.error('API: Invite Client Upsert Error:', clientError);
            throw new Error('Failed to register prospective client.');
        }

        // 3. Send Invitation Email
        const intakeLink = `${process.env.NEXTAUTH_URL || 'https://sothis.pro'}/en/intake-form?mode=new`;
        const fromEmail = 'bookings@sothistherapeutic.com';

        const { error: mailError } = await resend.emails.send({
            from: `Sothis Therapeutic <${fromEmail}>`,
            to: trimmedEmail,
            subject: 'Initial Clinical Intake - Sothis Therapeutic Massage',
            html: `
                <div style="font-family: 'Times New Roman', serif; max-width: 600px; margin: 0 auto; color: #1c1917; line-height: 1.6;">
                    <h2 style="text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #1c1917; padding-bottom: 10px; text-align: center;">
                        Clinical Intake Invitation
                    </h2>
                    
                    <p style="margin-top: 30px;">
                        Dear ${client.name},
                    </p>
                    
                    <p>
                        In preparation for your therapeutic massage session, we invite you to complete your initial clinical intake form. 
                        This essential document helps us understand your medical history and customize your treatment for the safest and most effective results.
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${intakeLink}" style="background-color: #1c1917; color: #ffffff; padding: 18px 32px; text-decoration: none; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em; font-size: 14px; border-radius: 2px;">
                            Complete Clinical Profile
                        </a>
                    </div>
                    
                    <p style="font-style: italic; color: #57534e; font-size: 13px;">
                        Note: You will be asked to sign in or create a secure account to protect your clinical information. 
                        Once signed in, you will be redirected automatically to the intake form.
                    </p>
                    
                    <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e7e5e4; font-size: 12px; text-align: center; color: #78716c;">
                        <p><strong>Sothis Therapeutic Massage</strong></p>
                        <p>Edgewater, NJ · Clinical Wellbeing & Bodywork</p>
                        <p><a href="mailto:sothistherapeutic@gmail.com" style="color: #78716c;">sothistherapeutic@gmail.com</a></p>
                    </div>
                </div>
            `,
        });

        if (mailError) {
            console.error('Resend Invite Email Error:', mailError);
            throw new Error('Email delivery failed.');
        }

        return NextResponse.json({ success: true, message: `Invitation sent to ${trimmedEmail}` });

    } catch (error: any) {
        console.error('API: POST /api/admin/intake/invite ERROR:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
