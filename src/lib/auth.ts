import EmailProvider from 'next-auth/providers/email';
import { SimpleSupabaseAdapter } from '@/lib/custom-adapter';
import { Resend } from 'resend';
import { NextAuthOptions } from 'next-auth';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase environment variables are missing. Authentication will not work.');
}

export const authOptions: NextAuthOptions = {
    providers: [
        EmailProvider({
            async sendVerificationRequest({ identifier, url }) {
                if (!process.env.RESEND_API_KEY) {
                    console.error('RESEND_API_KEY is missing');
                    return;
                }
                const { host } = new URL(url);
                const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
                try {
                    await resend.emails.send({
                        from: `Sothis Admin <${fromEmail}>`,
                        to: identifier,
                        subject: `Sign in to ${host}`,
                        text: `Sign in to ${host}\n${url}\n\n`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #292524;">Sign in to Sothis Admin</h2>
                                <p style="color: #44403c;">Click the button below to sign in:</p>
                                <a href="${url}" style="background-color: #d6d3d1; color: #292524; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Sign In</a>
                                <p style="color: #78716c; font-size: 12px; margin-top: 20px;">If you didn't request this email, you can ignore it.</p>
                            </div>
                        `,
                    });
                } catch (error) {
                    console.error('Error sending verification email', error);
                    throw new Error('Failed to send verification email');
                }
            },
        }),
    ],
    // Only configure adapter if variables exist to prevent crash
    adapter: SimpleSupabaseAdapter(),
    callbacks: {
        async session({ session, user }: any) {
            if (session?.user) {
                session.user.id = user.id;
                session.user.role = user.role; // Ensure role is passed to session
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
};
