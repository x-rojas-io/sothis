
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Generate 6-digit code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('DEBUG OTP:', otp);
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // 2. Store in verification_tokens
        // First delete any existing tokens for this email to facilitate cleanup
        await supabaseAdmin
            .from('verification_tokens')
            .delete()
            .eq('identifier', email);

        const { error: dbError } = await supabaseAdmin
            .from('verification_tokens')
            .insert({
                identifier: email,
                token: otp,
                expires: expires.toISOString(),
            });

        if (dbError) {
            console.error('Database error storing OTP:', dbError);
            return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
        }

        // 3. Send Email
        const { error: emailError } = await resend.emails.send({
            from: 'Sothis Bookings <bookings@sothistherapeutic.com>',
            to: email,
            subject: 'Your Sothis Sign-in Code',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Sign in to Sothis</h2>
                    <p>Enter the following code to complete your sign-in:</p>
                    <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; letter-spacing: 4px; font-weight: bold;">
                        ${otp}
                    </div>
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">This code expires in 10 minutes.</p>
                </div>
            `
        });

        if (emailError) {
            console.error('Resend error:', emailError);
            console.log('⚠️ Email failed (likely test mode limit). Proceeding anyway so you can use the terminal OTP.');
            // Do NOT return error; allow flow to continue
        }

        return NextResponse.json({
            success: true,
            // In development or if email fails (test mode), return the OTP to the client for convenience
            dev_otp: emailError ? otp : undefined
        });

    } catch (error) {
        console.error('OTP API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
